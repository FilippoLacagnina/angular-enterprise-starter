import { randomUUID } from 'node:crypto';

import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
  type Router,
} from 'express';

import { createAiSummaryRuntime } from './summary.runtime';
import { AiSummaryInputSchema } from './summary.schema';
import type { AiSummaryInput, AiSummaryOutput } from '../../../../contracts/ai/summary.contract';
import { type EnabledAiServerConfig, loadAiServerConfig } from '../../config/ai-server.config';
import { AiFoundationDisabledError, mapAiError } from '../../http/ai-error.mapper';
import {
  completeAiRequest as completeRequest,
  createAiRequestInitializer,
  getAiRequestContext as getRequestContext,
  normalizeAiAbortError as normalizeAbortError,
  rejectWhenAiOperationFails as rejectWhenOperationFails,
  runAiOperationWithTimeout as runWithTimeout,
  startAiRequestTimeout as startRequestTimeout,
  tryGetAiRequestContext as tryGetRequestContext,
  waitForAiOperation as waitWithAbort,
  type AiRequestContext,
} from '../../http/ai-request-lifecycle';
import { prepareAiStreamResponse, writeAiStreamEvent } from '../../http/ai-stream.writer';
import { consoleAiRequestLogger, type AiRequestLogger } from '../../logging/ai-request.logger';

const AI_JSON_LIMIT = '32kb';

interface AiRuntimePort {
  summarizeFlow(
    input: AiSummaryInput,
    options?: { abortSignal?: AbortSignal },
  ): Promise<AiSummaryOutput>;
  summarizeStreamFlow: {
    stream(input: AiSummaryInput, options?: { abortSignal?: AbortSignal }): AiSummaryStreamResult;
  };
}

interface AiSummaryStreamResult {
  output: Promise<AiSummaryOutput>;
  stream: AsyncIterable<string>;
}

export interface AiSummaryRouterOptions {
  allowUnauthenticatedExample?: boolean;
  createRuntime?: (config: EnabledAiServerConfig) => AiRuntimePort;
  loadConfig?: typeof loadAiServerConfig;
  logger?: AiRequestLogger;
  now?: () => number;
  requestGuard?: RequestHandler;
  requestIdFactory?: () => string;
}

export function createAiSummaryRouter(options: AiSummaryRouterOptions = {}): Router {
  const router = express.Router();
  const loadConfig = options.loadConfig ?? loadAiServerConfig;
  const logger = options.logger ?? consoleAiRequestLogger;
  const now = options.now ?? Date.now;
  const requestIdFactory = options.requestIdFactory ?? randomUUID;
  const allowUnauthenticatedExample =
    options.allowUnauthenticatedExample ??
    process.env['AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE'] === 'true';
  const requestGuard =
    options.requestGuard ??
    createDefaultExampleGuard(allowUnauthenticatedExample, requestIdFactory);
  const runtimeFactory =
    options.createRuntime ??
    ((config: EnabledAiServerConfig): AiRuntimePort => createAiSummaryRuntime(config));
  let runtime: AiRuntimePort | undefined;
  const initializeAiRequest = createAiRequestInitializer({ logger, now, requestIdFactory });

  function loadEnabledConfig(context: AiRequestContext): EnabledAiServerConfig {
    const config = loadConfig();
    context.model = config.defaultProvider.model;
    context.provider = config.defaultProvider.id;

    if (!config.enabled) {
      throw new AiFoundationDisabledError();
    }

    return config;
  }

  async function completeStreamWithError(
    error: unknown,
    context: AiRequestContext,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    if (context.completed) {
      return;
    }

    const normalizedError = normalizeAbortError(error, context.abortController.signal);

    if (!context.abortController.signal.aborted) {
      context.abortController.abort(normalizedError);
    }

    if (!response.headersSent) {
      next(normalizedError);
      return;
    }

    const mappedError = mapAiError(normalizedError, context.requestId);

    try {
      await writeAiStreamEvent(response, {
        error: mappedError.body,
        type: 'error',
      });
      response.end();
      completeRequest(context, {
        errorCode: mappedError.body.code,
        httpStatus: response.statusCode,
        status: mappedError.logStatus,
      });
    } catch {
      if (!response.destroyed && !response.writableEnded) {
        response.end();
      }

      completeRequest(context, {
        httpStatus: 499,
        status: 'aborted',
      });
    }
  }

  const jsonBodyParser = express.json({ limit: AI_JSON_LIMIT });

  router.post(
    '/summarize',
    requestGuard,
    initializeAiRequest,
    jsonBodyParser,
    async (request: Request, response: Response, next: NextFunction): Promise<void> => {
      const context = getRequestContext(response);

      try {
        const config = loadEnabledConfig(context);

        runtime ??= runtimeFactory(config);
        const input = AiSummaryInputSchema.parse(request.body);
        const output = await runWithTimeout(
          runtime.summarizeFlow(input, {
            abortSignal: context.abortController.signal,
          }),
          config.timeoutMs,
          context.abortController,
        );

        if (context.completed) {
          return;
        }

        response.status(200).json(output);
        completeRequest(context, {
          httpStatus: 200,
          status: 'success',
        });
      } catch (error: unknown) {
        if (!context.completed) {
          next(error);
        }
      }
    },
  );

  router.post(
    '/summarize/stream',
    requestGuard,
    initializeAiRequest,
    jsonBodyParser,
    async (request: Request, response: Response, next: NextFunction): Promise<void> => {
      const context = getRequestContext(response);
      let timeout: ReturnType<typeof setTimeout> | undefined;

      try {
        const config = loadEnabledConfig(context);
        const input = AiSummaryInputSchema.parse(request.body);
        runtime ??= runtimeFactory(config);
        timeout = startRequestTimeout(context.abortController, config.timeoutMs);

        const generation = runtime.summarizeStreamFlow.stream(input, {
          abortSignal: context.abortController.signal,
        });
        const outputFailure = rejectWhenOperationFails(generation.output);

        const iterator = generation.stream[Symbol.asyncIterator]();
        let iteration = await waitWithAbort(
          Promise.race([iterator.next(), outputFailure]),
          context.abortController.signal,
        );

        while (!iteration.done) {
          if (!response.headersSent) {
            prepareAiStreamResponse(response);
          }

          await writeAiStreamEvent(
            response,
            { delta: iteration.value, type: 'chunk' },
            context.abortController.signal,
          );
          iteration = await waitWithAbort(
            Promise.race([iterator.next(), outputFailure]),
            context.abortController.signal,
          );
        }

        const output = await waitWithAbort(generation.output, context.abortController.signal);

        if (!response.headersSent) {
          prepareAiStreamResponse(response);
        }

        await writeAiStreamEvent(
          response,
          {
            output,
            requestId: context.requestId,
            type: 'complete',
          },
          context.abortController.signal,
        );
        response.end();
        completeRequest(context, {
          httpStatus: 200,
          status: 'success',
        });
      } catch (error: unknown) {
        await completeStreamWithError(error, context, response, next);
      } finally {
        if (timeout) {
          clearTimeout(timeout);
        }
      }
    },
  );

  router.use((error: unknown, _request: Request, response: Response, next: NextFunction): void => {
    const context = tryGetRequestContext(response);

    if (!context) {
      next(error);
      return;
    }

    const mappedError = mapAiError(error, context.requestId);

    completeRequest(context, {
      errorCode: mappedError.body.code,
      httpStatus: mappedError.httpStatus,
      status: mappedError.logStatus,
    });

    if (!response.headersSent) {
      response.status(mappedError.httpStatus).json(mappedError.body);
    }
  });

  return router;
}

function createDefaultExampleGuard(
  allowUnauthenticatedExample: boolean,
  requestIdFactory: () => string,
): RequestHandler {
  if (allowUnauthenticatedExample) {
    return (_request, _response, next): void => next();
  }

  return (_request, response): void => {
    const requestId = requestIdFactory();

    response.setHeader('X-Correlation-Id', requestId);
    response.status(503).json({
      code: 'AI_CONFIGURATION_ERROR',
      message: 'The AI example requires an application request guard.',
      requestId,
      retryable: false,
    });
  };
}
