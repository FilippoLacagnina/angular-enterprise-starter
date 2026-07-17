import { z } from 'genkit';
import { describe, expect, it } from 'vitest';

import {
  AiFoundationDisabledError,
  AiHeadersTooLargeError,
  AiRequestTimeoutError,
  mapAiError,
} from './ai-error.mapper';
import { AiServerConfigError } from '../config/ai-server.config';
import { AiProviderError } from '../providers/ai-provider.error';
import { AiProviderCapabilityError } from '../providers/ai-provider.registry';

describe('mapAiError', () => {
  it.each([
    [new AiFoundationDisabledError(), 503, 'AI_DISABLED', false],
    [new AiServerConfigError('secret configuration detail'), 503, 'AI_CONFIGURATION_ERROR', false],
    [
      new AiProviderCapabilityError('limited-provider', 'textStreaming'),
      503,
      'AI_CONFIGURATION_ERROR',
      false,
    ],
    [new AiHeadersTooLargeError(), 431, 'AI_HEADERS_TOO_LARGE', false],
    [new AiRequestTimeoutError(), 504, 'AI_TIMEOUT', true],
    [z.object({ text: z.string() }).safeParse({}).error, 400, 'AI_INVALID_REQUEST', false],
  ])('maps a known error without exposing its details', (error, status, code, retryable) => {
    const result = mapAiError(error, 'request-123');

    expect(result.httpStatus).toBe(status);
    expect(result.body).toMatchObject({
      code,
      requestId: 'request-123',
      retryable,
    });
    expect(JSON.stringify(result)).not.toContain('secret configuration detail');
  });

  it('maps a normalized provider rate-limit error', () => {
    const result = mapAiError(new AiProviderError('google-ai', 'rate_limited'), 'request-429');

    expect(result).toEqual({
      body: {
        code: 'AI_RATE_LIMITED',
        message: 'The AI provider rate limit was reached. Try again later.',
        requestId: 'request-429',
        retryable: true,
      },
      httpStatus: 429,
      logStatus: 'rate_limited',
    });
  });

  it('maps a normalized unavailable-model error as non-retryable', () => {
    const result = mapAiError(new AiProviderError('google-ai', 'model_unavailable'), 'request-404');

    expect(result).toEqual({
      body: {
        code: 'AI_MODEL_UNAVAILABLE',
        message: 'The configured AI model is unavailable.',
        requestId: 'request-404',
        retryable: false,
      },
      httpStatus: 503,
      logStatus: 'error',
    });
  });

  it('maps a normalized temporarily unavailable provider error as retryable', () => {
    const result = mapAiError(
      new AiProviderError('google-ai', 'temporarily_unavailable'),
      'request-503',
    );

    expect(result).toEqual({
      body: {
        code: 'AI_PROVIDER_UNAVAILABLE',
        message: 'The AI provider is temporarily unavailable. Try again later.',
        requestId: 'request-503',
        retryable: true,
      },
      httpStatus: 503,
      logStatus: 'error',
    });
  });

  it.each([
    ['authentication', 503, 'AI_CONFIGURATION_ERROR', false],
    ['invalid_request', 502, 'AI_PROVIDER_ERROR', false],
    ['invalid_response', 502, 'AI_PROVIDER_ERROR', true],
    ['unknown', 502, 'AI_PROVIDER_ERROR', true],
  ] as const)(
    'maps a normalized %s provider error without provider-specific structures',
    (kind, status, code, retryable) => {
      const result = mapAiError(new AiProviderError('provider-id', kind), 'request-provider');

      expect(result).toMatchObject({
        body: { code, retryable },
        httpStatus: status,
      });
    },
  );

  it('maps body-parser payload errors before generic provider failures', () => {
    expect(mapAiError({ status: 413, type: 'entity.too.large' }, 'request-413')).toMatchObject({
      body: { code: 'AI_PAYLOAD_TOO_LARGE' },
      httpStatus: 413,
      logStatus: 'rejected',
    });
  });

  it('does not expose unknown provider details', () => {
    const result = mapAiError(new Error('prompt and provider secret'), 'request-500');

    expect(result.httpStatus).toBe(502);
    expect(result.body.code).toBe('AI_PROVIDER_ERROR');
    expect(JSON.stringify(result)).not.toContain('prompt and provider secret');
  });
});
