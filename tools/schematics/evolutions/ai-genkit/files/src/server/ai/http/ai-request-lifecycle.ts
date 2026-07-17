import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { AiHeadersTooLargeError, AiRequestTimeoutError } from './ai-error.mapper';
import type { AiRequestLogEntry, AiRequestLogger } from '../logging/ai-request.logger';

const MAX_BAGGAGE_HEADER_BYTES = 8_192;
const MAX_REQUEST_ID_LENGTH = 128;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const UNCONFIGURED_AI_MODEL = 'unconfigured';
const UNCONFIGURED_AI_PROVIDER = 'unconfigured';

type AiRequestCompletion = Pick<AiRequestLogEntry, 'errorCode' | 'httpStatus' | 'status'>;

export interface AiRequestContext {
  abortController: AbortController;
  completed: boolean;
  complete(details: AiRequestCompletion): void;
  model: string;
  provider: string;
  requestId: string;
}

interface AiRequestInitializerOptions {
  logger: AiRequestLogger;
  now: () => number;
  requestIdFactory: () => string;
}

function readRequestId(request: Request, requestIdFactory: () => string): string {
  const candidate = request.get('X-Correlation-Id')?.trim();

  if (
    candidate &&
    candidate.length <= MAX_REQUEST_ID_LENGTH &&
    REQUEST_ID_PATTERN.test(candidate)
  ) {
    return candidate;
  }

  return requestIdFactory();
}

export function createAiRequestInitializer(options: AiRequestInitializerOptions): RequestHandler {
  return (request: Request, response: Response, next: NextFunction): void => {
    const requestId = readRequestId(request, options.requestIdFactory);
    const startedAt = options.now();
    const context: AiRequestContext = {
      abortController: new AbortController(),
      completed: false,
      complete(details): void {
        if (context.completed) {
          return;
        }

        context.completed = true;
        options.logger.log({
          durationMs: Math.max(0, options.now() - startedAt),
          event: 'ai_request_completed',
          model: context.model,
          provider: context.provider,
          requestId: context.requestId,
          ...details,
        });
      },
      model: UNCONFIGURED_AI_MODEL,
      provider: UNCONFIGURED_AI_PROVIDER,
      requestId,
    };

    response.locals['aiRequestContext'] = context;
    response.setHeader('X-Correlation-Id', requestId);

    response.once('close', () => {
      if (!response.writableEnded) {
        context.abortController.abort();
        context.complete({
          httpStatus: 499,
          status: 'aborted',
        });
      }
    });

    const baggage = request.get('baggage');
    if (baggage && Buffer.byteLength(baggage, 'utf8') > MAX_BAGGAGE_HEADER_BYTES) {
      next(new AiHeadersTooLargeError());
      return;
    }

    next();
  };
}

export function getAiRequestContext(response: Response): AiRequestContext {
  return response.locals['aiRequestContext'] as AiRequestContext;
}

export function tryGetAiRequestContext(response: Response): AiRequestContext | undefined {
  return response.locals['aiRequestContext'] as AiRequestContext | undefined;
}

export function completeAiRequest(context: AiRequestContext, details: AiRequestCompletion): void {
  context.complete(details);
}

export function startAiRequestTimeout(
  abortController: AbortController,
  timeoutMs: number,
): ReturnType<typeof setTimeout> {
  const timeout = setTimeout(() => {
    abortController.abort(new AiRequestTimeoutError());
  }, timeoutMs);
  timeout.unref();

  return timeout;
}

export function waitForAiOperation<T>(
  operation: PromiseLike<T>,
  abortSignal: AbortSignal,
): Promise<T> {
  if (abortSignal.aborted) {
    return Promise.reject(abortSignal.reason);
  }

  return new Promise<T>((resolve, reject) => {
    const cleanup = (): void => abortSignal.removeEventListener('abort', onAbort);
    const onAbort = (): void => {
      cleanup();
      reject(abortSignal.reason);
    };

    abortSignal.addEventListener('abort', onAbort, { once: true });
    Promise.resolve(operation).then(
      (result) => {
        cleanup();
        resolve(result);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
}

export function rejectWhenAiOperationFails(operation: PromiseLike<unknown>): Promise<never> {
  return Promise.resolve(operation).then(
    () => new Promise<never>(() => undefined),
    (error: unknown) => Promise.reject(error),
  );
}

export function normalizeAiAbortError(error: unknown, abortSignal: AbortSignal): unknown {
  return abortSignal.aborted && abortSignal.reason instanceof AiRequestTimeoutError
    ? abortSignal.reason
    : error;
}

export function runAiOperationWithTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  abortController: AbortController,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = startAiRequestTimeout(abortController, timeoutMs);
    const onAbort = (): void => {
      clearTimeout(timeout);
      reject(abortController.signal.reason);
    };
    abortController.signal.addEventListener('abort', onAbort, { once: true });

    operation.then(
      (result) => {
        clearTimeout(timeout);
        abortController.signal.removeEventListener('abort', onAbort);
        resolve(result);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        abortController.signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}
