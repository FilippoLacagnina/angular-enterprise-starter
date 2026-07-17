import { request as httpRequest } from 'node:http';
import type { AddressInfo } from 'node:net';

import express, { type ErrorRequestHandler, type RequestHandler, type Router } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAiSummaryRouter, type AiSummaryRouterOptions } from './summary.routes';
import type {
  AiSummaryInput,
  AiSummaryOutput,
  AiSummaryStreamEvent,
} from '../../../../contracts/ai/summary.contract';
import {
  AiServerConfigError,
  type EnabledAiServerConfig,
  loadAiServerConfig,
} from '../../config/ai-server.config';
import type { AiRequestLogEntry, AiRequestLogger } from '../../logging/ai-request.logger';
import { AiProviderError } from '../../providers/ai-provider.error';

interface TestLogger extends AiRequestLogger {
  entries: AiRequestLogEntry[];
}

interface RuntimeStub {
  summarizeFlow(
    input: AiSummaryInput,
    options?: { abortSignal?: AbortSignal },
  ): Promise<AiSummaryOutput>;
  summarizeStreamFlow: {
    stream(
      input: AiSummaryInput,
      options?: { abortSignal?: AbortSignal },
    ): {
      output: Promise<AiSummaryOutput>;
      stream: AsyncIterable<string>;
    };
  };
}

function createAiRouter(options: AiSummaryRouterOptions = {}): Router {
  return createAiSummaryRouter({
    allowUnauthenticatedExample: true,
    ...options,
  });
}

function createTestLogger(): TestLogger {
  const entries: AiRequestLogEntry[] = [];

  return {
    entries,
    log(entry): void {
      entries.push(entry);
    },
  };
}

function createEnabledConfig(
  overrides: Partial<EnabledAiServerConfig> = {},
): EnabledAiServerConfig {
  const config = loadAiServerConfig({
    AI_GENKIT_DEFAULT_PROVIDER: 'google-ai',
    AI_GENKIT_ENABLED: 'true',
    AI_GENKIT_GOOGLE_AI_ENABLED: 'true',
    AI_GENKIT_GOOGLE_AI_MODEL: 'gemini-test-model',
    GEMINI_API_KEY: 'server-secret',
  });

  if (!config.enabled) {
    throw new Error('Expected an enabled AI test configuration.');
  }

  return {
    ...config,
    ...overrides,
  };
}

async function* createStream(...chunks: string[]): AsyncIterable<string> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

async function* createFailingStream(error: unknown, ...chunks: string[]): AsyncIterable<string> {
  yield* createStream(...chunks);
  throw error;
}

async function* createHangingStream(firstChunk?: string): AsyncIterable<string> {
  if (firstChunk !== undefined) {
    yield firstChunk;
  }

  await new Promise<void>(() => undefined);
}

function createRuntimeStub(overrides: Partial<RuntimeStub> = {}): RuntimeStub {
  return {
    summarizeFlow: vi.fn().mockResolvedValue({ summary: 'Default summary.' }),
    summarizeStreamFlow: {
      stream: vi.fn().mockReturnValue({
        output: Promise.resolve({ summary: 'Default summary.' }),
        stream: createStream('Default summary.'),
      }),
    },
    ...overrides,
  };
}

async function withAiServer<T>(
  router: Router,
  run: (baseUrl: string) => Promise<T>,
  errorHandler?: ErrorRequestHandler,
): Promise<T> {
  const app = express();
  app.use('/api/ai', router);

  if (errorHandler) {
    app.use(errorHandler);
  }

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    const listeningServer = app.listen(0, '127.0.0.1', (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(listeningServer);
    });
  });
  const address = server.address() as AddressInfo;

  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }
}

function postJson(baseUrl: string, body: unknown, headers: HeadersInit = {}): Promise<Response> {
  return fetch(`${baseUrl}/api/ai/summarize`, {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    method: 'POST',
  });
}

function postStreamJson(
  baseUrl: string,
  body: unknown,
  headers: HeadersInit = {},
): Promise<Response> {
  return fetch(`${baseUrl}/api/ai/summarize/stream`, {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    method: 'POST',
  });
}

async function readStreamEvents(response: Response): Promise<AiSummaryStreamEvent[]> {
  const text = await response.text();

  return text
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as AiSummaryStreamEvent);
}

describe('createAiSummaryRouter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('denies the example by default until access is configured explicitly', async () => {
    const createRuntime = vi.fn();
    const loadConfig = vi.fn();
    const logger = createTestLogger();

    await withAiServer(
      createAiSummaryRouter({
        createRuntime,
        loadConfig,
        logger,
        requestIdFactory: () => 'guard-required-1',
      }),
      async (baseUrl) => {
        const response = await postJson(baseUrl, { text: 'Protected input.' });

        expect(response.status).toBe(503);
        expect(response.headers.get('X-Correlation-Id')).toBe('guard-required-1');
        expect(await response.json()).toEqual({
          code: 'AI_CONFIGURATION_ERROR',
          message: 'The AI example requires an application request guard.',
          requestId: 'guard-required-1',
          retryable: false,
        });
      },
    );

    expect(loadConfig).not.toHaveBeenCalled();
    expect(createRuntime).not.toHaveBeenCalled();
    expect(logger.entries).toEqual([]);
  });

  it('returns a typed summary and preserves a valid correlation ID', async () => {
    const logger = createTestLogger();
    const summarizeFlow = vi.fn().mockResolvedValue({ summary: 'Short summary.' });

    await withAiServer(
      createAiRouter({
        createRuntime: () => createRuntimeStub({ summarizeFlow }),
        loadConfig: () => createEnabledConfig(),
        logger,
      }),
      async (baseUrl) => {
        const response = await postJson(
          baseUrl,
          { text: 'Sensitive user content that must never be logged.' },
          { 'X-Correlation-Id': 'request-123' },
        );

        expect(response.status).toBe(200);
        expect(response.headers.get('X-Correlation-Id')).toBe('request-123');
        expect(await response.json()).toEqual({ summary: 'Short summary.' });
      },
    );

    expect(summarizeFlow).toHaveBeenCalledWith(
      {
        text: 'Sensitive user content that must never be logged.',
      },
      { abortSignal: expect.any(AbortSignal) },
    );
    expect(logger.entries).toEqual([
      expect.objectContaining({
        event: 'ai_request_completed',
        httpStatus: 200,
        model: 'gemini-test-model',
        provider: 'google-ai',
        requestId: 'request-123',
        status: 'success',
      }),
    ]);
    expect(JSON.stringify(logger.entries)).not.toContain('Sensitive user content');
  });

  it('does not create the Genkit runtime when the foundation is disabled', async () => {
    const createRuntime = vi.fn();

    await withAiServer(
      createAiRouter({
        createRuntime,
        loadConfig: () => ({
          defaultProvider: {
            id: 'google-ai',
            model: 'gemini-test-model',
          },
          enabled: false,
          timeoutMs: 30_000,
        }),
        logger: createTestLogger(),
      }),
      async (baseUrl) => {
        const response = await postJson(baseUrl, { text: 'Input' });
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body).toMatchObject({ code: 'AI_DISABLED', retryable: false });
      },
    );

    expect(createRuntime).not.toHaveBeenCalled();
  });

  it('allows an application guard to reject requests before AI processing', async () => {
    const createRuntime = vi.fn();
    const logger = createTestLogger();
    const requestGuard: RequestHandler = (_request, response) => {
      response.status(401).json({ code: 'UNAUTHORIZED' });
    };

    await withAiServer(
      createAiRouter({
        createRuntime,
        loadConfig: () => createEnabledConfig(),
        logger,
        requestGuard,
      }),
      async (baseUrl) => {
        const response = await postJson(baseUrl, { text: 'Input' });

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ code: 'UNAUTHORIZED' });
      },
    );

    expect(createRuntime).not.toHaveBeenCalled();
    expect(logger.entries).toEqual([]);
  });

  it('forwards request guard errors to the application error handler', async () => {
    const guardError = new Error('Unauthorized');
    const requestGuard: RequestHandler = (_request, _response, next) => {
      next(guardError);
    };
    const createRuntime = vi.fn();
    const loadConfig = vi.fn();
    const logger = createTestLogger();
    const applicationErrorHandler: ErrorRequestHandler = (
      error,
      _request,
      response,
      next,
    ): void => {
      void next;
      expect(error).toBe(guardError);
      response.status(401).json({ code: 'UNAUTHORIZED' });
    };

    await withAiServer(
      createAiRouter({
        createRuntime,
        loadConfig,
        logger,
        requestGuard,
      }),
      async (baseUrl) => {
        const response = await postJson(baseUrl, { text: 'Protected input.' });

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ code: 'UNAUTHORIZED' });
      },
      applicationErrorHandler,
    );

    expect(loadConfig).not.toHaveBeenCalled();
    expect(createRuntime).not.toHaveBeenCalled();
    expect(logger.entries).toEqual([]);
  });

  it('uses provider-neutral log context when configuration cannot be loaded', async () => {
    const logger = createTestLogger();

    await withAiServer(
      createAiRouter({
        loadConfig: () => {
          throw new AiServerConfigError('Sensitive configuration detail.');
        },
        logger,
      }),
      async (baseUrl) => {
        const response = await postJson(baseUrl, { text: 'Input' });

        expect(response.status).toBe(503);
        expect(await response.json()).toMatchObject({
          code: 'AI_CONFIGURATION_ERROR',
          retryable: false,
        });
      },
    );

    expect(logger.entries).toEqual([
      expect.objectContaining({
        errorCode: 'AI_CONFIGURATION_ERROR',
        model: 'unconfigured',
        provider: 'unconfigured',
        status: 'error',
      }),
    ]);
    expect(JSON.stringify(logger.entries)).not.toContain('Sensitive configuration detail');
  });

  it('rejects invalid input without invoking the flow', async () => {
    const summarizeFlow = vi.fn();

    await withAiServer(
      createAiRouter({
        createRuntime: () => createRuntimeStub({ summarizeFlow }),
        loadConfig: () => createEnabledConfig(),
        logger: createTestLogger(),
      }),
      async (baseUrl) => {
        const response = await postJson(baseUrl, { text: '' });

        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ code: 'AI_INVALID_REQUEST' });
      },
    );

    expect(summarizeFlow).not.toHaveBeenCalled();
  });

  it('maps provider quota errors to an explicit 429 response', async () => {
    const logger = createTestLogger();
    const providerError = new AiProviderError('google-ai', 'rate_limited');

    await withAiServer(
      createAiRouter({
        createRuntime: () =>
          createRuntimeStub({
            summarizeFlow: vi.fn().mockRejectedValue(providerError),
          }),
        loadConfig: () => createEnabledConfig(),
        logger,
      }),
      async (baseUrl) => {
        const response = await postJson(baseUrl, { text: 'Input' });
        const body = await response.json();

        expect(response.status).toBe(429);
        expect(body).toMatchObject({ code: 'AI_RATE_LIMITED', retryable: true });
        expect(JSON.stringify(body)).not.toContain('google-ai');
      },
    );

    expect(logger.entries[0]).toMatchObject({
      errorCode: 'AI_RATE_LIMITED',
      httpStatus: 429,
      status: 'rate_limited',
    });
  });

  it('returns 504 when the configured timeout expires', async () => {
    const logger = createTestLogger();
    let providerSignal: AbortSignal | undefined;

    await withAiServer(
      createAiRouter({
        createRuntime: () =>
          createRuntimeStub({
            summarizeFlow: (_input, options) => {
              providerSignal = options?.abortSignal;
              return new Promise<AiSummaryOutput>(() => undefined);
            },
          }),
        loadConfig: () => createEnabledConfig({ timeoutMs: 5 }),
        logger,
      }),
      async (baseUrl) => {
        const response = await postJson(baseUrl, { text: 'Input' });

        expect(response.status).toBe(504);
        expect(await response.json()).toMatchObject({ code: 'AI_TIMEOUT', retryable: true });
      },
    );

    expect(logger.entries[0]).toMatchObject({
      errorCode: 'AI_TIMEOUT',
      httpStatus: 504,
      status: 'timeout',
    });
    expect(providerSignal?.aborted).toBe(true);
  });

  it('rejects oversized baggage before invoking the runtime', async () => {
    const createRuntime = vi.fn();

    await withAiServer(
      createAiRouter({
        createRuntime,
        loadConfig: () => createEnabledConfig(),
        logger: createTestLogger(),
      }),
      async (baseUrl) => {
        const response = await postJson(baseUrl, { text: 'Input' }, { baggage: 'a'.repeat(8_193) });

        expect(response.status).toBe(431);
        expect(await response.json()).toMatchObject({ code: 'AI_HEADERS_TOO_LARGE' });
      },
    );

    expect(createRuntime).not.toHaveBeenCalled();
  });

  it('returns 413 for a body larger than the route-specific JSON limit', async () => {
    await withAiServer(
      createAiRouter({
        createRuntime: () => createRuntimeStub({ summarizeFlow: vi.fn() }),
        loadConfig: () => createEnabledConfig(),
        logger: createTestLogger(),
      }),
      async (baseUrl) => {
        const response = await postJson(baseUrl, { text: 'a'.repeat(40_000) });

        expect(response.status).toBe(413);
        expect(await response.json()).toMatchObject({ code: 'AI_PAYLOAD_TOO_LARGE' });
      },
    );
  });

  it('replaces an invalid correlation ID', async () => {
    await withAiServer(
      createAiRouter({
        createRuntime: () =>
          createRuntimeStub({
            summarizeFlow: vi.fn().mockResolvedValue({ summary: 'Summary' }),
          }),
        loadConfig: () => createEnabledConfig(),
        logger: createTestLogger(),
        requestIdFactory: () => 'generated-request-id',
      }),
      async (baseUrl) => {
        const response = await postJson(
          baseUrl,
          { text: 'Input' },
          { 'X-Correlation-Id': 'invalid request id' },
        );

        expect(response.headers.get('X-Correlation-Id')).toBe('generated-request-id');
      },
    );
  });

  describe('POST /summarize/stream', () => {
    it('streams typed NDJSON chunks followed by the validated final output', async () => {
      const logger = createTestLogger();
      const summarizeStreamFlow = {
        stream: vi.fn().mockReturnValue({
          output: Promise.resolve({ summary: 'Short summary.' }),
          stream: createStream('Short ', 'summary.'),
        }),
      };

      await withAiServer(
        createAiRouter({
          createRuntime: () => createRuntimeStub({ summarizeStreamFlow }),
          loadConfig: () => createEnabledConfig(),
          logger,
        }),
        async (baseUrl) => {
          const response = await postStreamJson(
            baseUrl,
            { text: 'Sensitive streaming input.' },
            { 'X-Correlation-Id': 'stream-request-1' },
          );

          expect(response.status).toBe(200);
          expect(response.headers.get('Cache-Control')).toBe('no-store, no-transform');
          expect(response.headers.get('Content-Type')).toBe('application/x-ndjson; charset=utf-8');
          expect(response.headers.get('X-Accel-Buffering')).toBe('no');
          expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
          await expect(readStreamEvents(response)).resolves.toEqual([
            { delta: 'Short ', type: 'chunk' },
            { delta: 'summary.', type: 'chunk' },
            {
              output: { summary: 'Short summary.' },
              requestId: 'stream-request-1',
              type: 'complete',
            },
          ]);
        },
      );

      expect(summarizeStreamFlow.stream).toHaveBeenCalledWith(
        { text: 'Sensitive streaming input.' },
        { abortSignal: expect.any(AbortSignal) },
      );
      expect(logger.entries).toEqual([
        expect.objectContaining({
          httpStatus: 200,
          requestId: 'stream-request-1',
          status: 'success',
        }),
      ]);
      expect(JSON.stringify(logger.entries)).not.toContain('Sensitive streaming input');
    });

    it('returns a regular 429 response when the provider fails before streaming starts', async () => {
      const logger = createTestLogger();
      const providerError = new AiProviderError('google-ai', 'rate_limited');

      await withAiServer(
        createAiRouter({
          createRuntime: () =>
            createRuntimeStub({
              summarizeStreamFlow: {
                stream: vi.fn().mockImplementation(() => ({
                  output: Promise.reject(providerError),
                  stream: createHangingStream(),
                })),
              },
            }),
          loadConfig: () => createEnabledConfig(),
          logger,
        }),
        async (baseUrl) => {
          const response = await postStreamJson(baseUrl, { text: 'Input' });
          const body = await response.json();

          expect(response.status).toBe(429);
          expect(response.headers.get('Content-Type')).toContain('application/json');
          expect(body).toMatchObject({ code: 'AI_RATE_LIMITED', retryable: true });
          expect(JSON.stringify(body)).not.toContain('google-ai');
        },
      );

      expect(logger.entries[0]).toMatchObject({
        errorCode: 'AI_RATE_LIMITED',
        httpStatus: 429,
        status: 'rate_limited',
      });
    });

    it('writes a safe error frame when a 429 occurs after the first chunk', async () => {
      const logger = createTestLogger();
      const providerError = new AiProviderError('google-ai', 'rate_limited');

      await withAiServer(
        createAiRouter({
          createRuntime: () =>
            createRuntimeStub({
              summarizeStreamFlow: {
                stream: vi.fn().mockImplementation(() => ({
                  output: Promise.reject(providerError),
                  stream: createFailingStream(providerError, 'Partial summary.'),
                })),
              },
            }),
          loadConfig: () => createEnabledConfig(),
          logger,
        }),
        async (baseUrl) => {
          const response = await postStreamJson(baseUrl, { text: 'Sensitive input' });

          expect(response.status).toBe(200);
          await expect(readStreamEvents(response)).resolves.toEqual([
            { delta: 'Partial summary.', type: 'chunk' },
            {
              error: expect.objectContaining({
                code: 'AI_RATE_LIMITED',
                retryable: true,
              }),
              type: 'error',
            },
          ]);
        },
      );

      expect(logger.entries[0]).toMatchObject({
        errorCode: 'AI_RATE_LIMITED',
        httpStatus: 200,
        status: 'rate_limited',
      });
      expect(JSON.stringify(logger.entries)).not.toContain('Sensitive input');
    });

    it('returns 504 and aborts the flow when the timeout occurs before the first chunk', async () => {
      const logger = createTestLogger();
      let providerSignal: AbortSignal | undefined;

      await withAiServer(
        createAiRouter({
          createRuntime: () =>
            createRuntimeStub({
              summarizeStreamFlow: {
                stream: (_input, options) => {
                  providerSignal = options?.abortSignal;
                  return {
                    output: new Promise<AiSummaryOutput>(() => undefined),
                    stream: createHangingStream(),
                  };
                },
              },
            }),
          loadConfig: () => createEnabledConfig({ timeoutMs: 5 }),
          logger,
        }),
        async (baseUrl) => {
          const response = await postStreamJson(baseUrl, { text: 'Input' });

          expect(response.status).toBe(504);
          expect(await response.json()).toMatchObject({ code: 'AI_TIMEOUT', retryable: true });
        },
      );

      expect(providerSignal?.aborted).toBe(true);
      expect(logger.entries[0]).toMatchObject({
        errorCode: 'AI_TIMEOUT',
        httpStatus: 504,
        status: 'timeout',
      });
    });

    it('writes a timeout frame when the deadline expires after streaming starts', async () => {
      const logger = createTestLogger();

      await withAiServer(
        createAiRouter({
          createRuntime: () =>
            createRuntimeStub({
              summarizeStreamFlow: {
                stream: vi.fn().mockReturnValue({
                  output: new Promise<AiSummaryOutput>(() => undefined),
                  stream: createHangingStream('Partial summary.'),
                }),
              },
            }),
          loadConfig: () => createEnabledConfig({ timeoutMs: 5 }),
          logger,
        }),
        async (baseUrl) => {
          const response = await postStreamJson(baseUrl, { text: 'Input' });

          expect(response.status).toBe(200);
          await expect(readStreamEvents(response)).resolves.toEqual([
            { delta: 'Partial summary.', type: 'chunk' },
            {
              error: expect.objectContaining({ code: 'AI_TIMEOUT', retryable: true }),
              type: 'error',
            },
          ]);
        },
      );

      expect(logger.entries[0]).toMatchObject({
        errorCode: 'AI_TIMEOUT',
        httpStatus: 200,
        status: 'timeout',
      });
    });

    it('aborts the flow and records 499 when the streaming client disconnects', async () => {
      const logger = createTestLogger();
      let providerSignal: AbortSignal | undefined;

      await withAiServer(
        createAiRouter({
          createRuntime: () =>
            createRuntimeStub({
              summarizeStreamFlow: {
                stream: (_input, options) => {
                  providerSignal = options?.abortSignal;
                  return {
                    output: new Promise<AiSummaryOutput>(() => undefined),
                    stream: createHangingStream('Sensitive partial output'),
                  };
                },
              },
            }),
          loadConfig: () => createEnabledConfig(),
          logger,
        }),
        async (baseUrl) => {
          await new Promise<void>((resolve) => {
            const request = httpRequest(`${baseUrl}/api/ai/summarize/stream`, {
              headers: { 'Content-Type': 'application/json' },
              method: 'POST',
            });
            request.on('error', () => resolve());
            request.on('response', (clientResponse) => {
              clientResponse.once('data', () => clientResponse.destroy());
              clientResponse.once('close', () => resolve());
            });
            request.write(JSON.stringify({ text: 'Sensitive aborted input' }));
            request.end();
          });

          await vi.waitFor(() => {
            expect(providerSignal?.aborted).toBe(true);
            expect(logger.entries[0]).toMatchObject({ httpStatus: 499, status: 'aborted' });
          });
        },
      );

      expect(JSON.stringify(logger.entries)).not.toMatch(/Sensitive aborted input|partial output/);
    });
  });

  it('records an aborted client request without logging its body', async () => {
    const logger = createTestLogger();
    let providerSignal: AbortSignal | undefined;
    let resolveFlow: ((output: AiSummaryOutput) => void) | undefined;
    const flowResult = new Promise<AiSummaryOutput>((resolve) => {
      resolveFlow = resolve;
    });

    await withAiServer(
      createAiRouter({
        createRuntime: () =>
          createRuntimeStub({
            summarizeFlow: (_input, options) => {
              providerSignal = options?.abortSignal;
              return flowResult;
            },
          }),
        loadConfig: () => createEnabledConfig(),
        logger,
      }),
      async (baseUrl) => {
        await new Promise<void>((resolve) => {
          const request = httpRequest(`${baseUrl}/api/ai/summarize`, {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          });
          request.on('error', () => resolve());
          request.write(JSON.stringify({ text: 'Sensitive aborted input' }));
          request.end();
          setTimeout(() => request.destroy(), 10);
        });

        await vi.waitFor(() => {
          expect(logger.entries[0]).toMatchObject({ httpStatus: 499, status: 'aborted' });
          expect(providerSignal?.aborted).toBe(true);
        });
        resolveFlow?.({ summary: 'Ignored' });
      },
    );

    expect(JSON.stringify(logger.entries)).not.toContain('Sensitive aborted input');
  });
});
