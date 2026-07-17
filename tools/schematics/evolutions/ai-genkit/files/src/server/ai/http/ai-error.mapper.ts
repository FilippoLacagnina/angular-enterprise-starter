import { z } from 'genkit';

import type { AiApiError, AiApiErrorCode } from '../../../contracts/ai/ai-api.contract';
import { AiServerConfigError } from '../config/ai-server.config';
import type { AiRequestStatus } from '../logging/ai-request.logger';
import { AiProviderError } from '../providers/ai-provider.error';
import { AiProviderCapabilityError } from '../providers/ai-provider.registry';

export class AiFoundationDisabledError extends Error {
  constructor() {
    super('The AI foundation is disabled.');
    this.name = 'AiFoundationDisabledError';
  }
}

export class AiHeadersTooLargeError extends Error {
  constructor() {
    super('The request headers are too large.');
    this.name = 'AiHeadersTooLargeError';
  }
}

export class AiRequestTimeoutError extends Error {
  constructor() {
    super('The AI request timed out.');
    this.name = 'AiRequestTimeoutError';
  }
}

export interface MappedAiError {
  body: AiApiError;
  httpStatus: number;
  logStatus: AiRequestStatus;
}

interface ErrorDescriptor {
  code: AiApiErrorCode;
  httpStatus: number;
  logStatus: AiRequestStatus;
  message: string;
  retryable: boolean;
}

function describeProviderError(error: AiProviderError): ErrorDescriptor {
  switch (error.kind) {
    case 'authentication':
      return {
        code: 'AI_CONFIGURATION_ERROR',
        httpStatus: 503,
        logStatus: 'error',
        message: 'The AI service is not configured correctly.',
        retryable: false,
      };
    case 'invalid_request':
      return {
        code: 'AI_PROVIDER_ERROR',
        httpStatus: 502,
        logStatus: 'error',
        message: 'The AI provider rejected the generated request.',
        retryable: false,
      };
    case 'model_unavailable':
      return {
        code: 'AI_MODEL_UNAVAILABLE',
        httpStatus: 503,
        logStatus: 'error',
        message: 'The configured AI model is unavailable.',
        retryable: false,
      };
    case 'rate_limited':
      return {
        code: 'AI_RATE_LIMITED',
        httpStatus: 429,
        logStatus: 'rate_limited',
        message: 'The AI provider rate limit was reached. Try again later.',
        retryable: true,
      };
    case 'temporarily_unavailable':
      return {
        code: 'AI_PROVIDER_UNAVAILABLE',
        httpStatus: 503,
        logStatus: 'error',
        message: 'The AI provider is temporarily unavailable. Try again later.',
        retryable: true,
      };
    case 'invalid_response':
    case 'unknown':
      return {
        code: 'AI_PROVIDER_ERROR',
        httpStatus: 502,
        logStatus: 'error',
        message: 'The AI provider could not complete the request.',
        retryable: true,
      };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasErrorMarker(error: unknown, markers: readonly unknown[]): boolean {
  const visited = new Set<unknown>();
  const pending: unknown[] = [error];

  while (pending.length > 0 && visited.size < 16) {
    const current = pending.shift();

    if (!isRecord(current) || visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (markers.includes(current['status']) || markers.includes(current['statusCode'])) {
      return true;
    }

    if (markers.includes(current['code'])) {
      return true;
    }

    pending.push(current['cause'], current['detail'], current['error']);
  }

  return false;
}

function describeError(error: unknown): ErrorDescriptor {
  if (error instanceof AiFoundationDisabledError) {
    return {
      code: 'AI_DISABLED',
      httpStatus: 503,
      logStatus: 'disabled',
      message: 'The AI service is not enabled.',
      retryable: false,
    };
  }

  if (error instanceof AiServerConfigError || error instanceof AiProviderCapabilityError) {
    return {
      code: 'AI_CONFIGURATION_ERROR',
      httpStatus: 503,
      logStatus: 'error',
      message: 'The AI service is not configured correctly.',
      retryable: false,
    };
  }

  if (error instanceof AiProviderError) {
    return describeProviderError(error);
  }

  if (error instanceof AiHeadersTooLargeError) {
    return {
      code: 'AI_HEADERS_TOO_LARGE',
      httpStatus: 431,
      logStatus: 'rejected',
      message: 'The request headers are too large.',
      retryable: false,
    };
  }

  if (error instanceof z.ZodError || hasErrorMarker(error, [400, '400'])) {
    return {
      code: 'AI_INVALID_REQUEST',
      httpStatus: 400,
      logStatus: 'rejected',
      message: 'The AI request is invalid.',
      retryable: false,
    };
  }

  if (hasErrorMarker(error, [413, '413', 'entity.too.large'])) {
    return {
      code: 'AI_PAYLOAD_TOO_LARGE',
      httpStatus: 413,
      logStatus: 'rejected',
      message: 'The AI request payload is too large.',
      retryable: false,
    };
  }

  if (error instanceof AiRequestTimeoutError) {
    return {
      code: 'AI_TIMEOUT',
      httpStatus: 504,
      logStatus: 'timeout',
      message: 'The AI request timed out.',
      retryable: true,
    };
  }

  return {
    code: 'AI_PROVIDER_ERROR',
    httpStatus: 502,
    logStatus: 'error',
    message: 'The AI provider could not complete the request.',
    retryable: true,
  };
}

export function mapAiError(error: unknown, requestId: string): MappedAiError {
  const descriptor = describeError(error);

  return {
    body: {
      code: descriptor.code,
      message: descriptor.message,
      requestId,
      retryable: descriptor.retryable,
    },
    httpStatus: descriptor.httpStatus,
    logStatus: descriptor.logStatus,
  };
}
