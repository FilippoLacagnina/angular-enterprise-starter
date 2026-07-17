import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import {
  AI_API_ERROR_CODES,
  type AiApiError,
  type AiApiErrorCode,
} from '../../../../contracts/ai/ai-api.contract';

const MAX_AI_ERROR_BODY_CHARACTERS = 16_384;

export type AiClientErrorCode = AiApiErrorCode | 'AI_NETWORK_ERROR';

interface AiClientErrorOptions {
  code: AiClientErrorCode;
  httpStatus?: number;
  message: string;
  requestId?: string;
  retryable: boolean;
}

export class AiClientError extends Error {
  readonly code: AiClientErrorCode;
  readonly httpStatus?: number;
  readonly requestId?: string;
  readonly retryable: boolean;

  constructor(options: AiClientErrorOptions) {
    super(options.message);
    this.name = 'AiClientError';
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.requestId = options.requestId;
    this.retryable = options.retryable;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAiApiError(value: unknown): value is AiApiError {
  if (!isRecord(value)) {
    return false;
  }

  return (
    AI_API_ERROR_CODES.some((code) => code === value['code']) &&
    typeof value['message'] === 'string' &&
    typeof value['requestId'] === 'string' &&
    typeof value['retryable'] === 'boolean'
  );
}

function readAiApiError(value: unknown): AiApiError | undefined {
  if (isAiApiError(value)) {
    return value;
  }

  if (typeof value !== 'string' || value.length > MAX_AI_ERROR_BODY_CHARACTERS) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isAiApiError(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function isTimeoutFailure(error: unknown): boolean {
  if (error instanceof TimeoutError) {
    return true;
  }

  if (!(error instanceof HttpErrorResponse) || !isRecord(error.error)) {
    return false;
  }

  return error.error['name'] === 'TimeoutError' || error.error['type'] === 'timeout';
}

function readResponseRequestId(error: HttpErrorResponse): string | undefined {
  return error.headers.get('X-Correlation-Id') ?? undefined;
}

export function mapAiApiErrorToClientError(error: AiApiError, httpStatus?: number): AiClientError {
  return new AiClientError({
    code: error.code,
    httpStatus,
    message: error.message,
    requestId: error.requestId,
    retryable: error.retryable,
  });
}

export function mapAiClientError(error: unknown): AiClientError {
  if (error instanceof AiClientError) {
    return error;
  }

  if (isTimeoutFailure(error)) {
    return new AiClientError({
      code: 'AI_TIMEOUT',
      message: 'The AI request timed out.',
      retryable: true,
    });
  }

  if (error instanceof HttpErrorResponse) {
    const apiError = readAiApiError(error.error);
    if (apiError) {
      return mapAiApiErrorToClientError(apiError, error.status);
    }

    const requestId = readResponseRequestId(error);

    if (error.status === 429) {
      return new AiClientError({
        code: 'AI_RATE_LIMITED',
        httpStatus: error.status,
        message: 'The AI provider rate limit was reached. Try again later.',
        requestId,
        retryable: true,
      });
    }

    if (error.status === 0) {
      return new AiClientError({
        code: 'AI_NETWORK_ERROR',
        message: 'The AI service could not be reached.',
        requestId,
        retryable: true,
      });
    }

    return new AiClientError({
      code: 'AI_PROVIDER_ERROR',
      httpStatus: error.status,
      message: 'The AI service could not complete the request.',
      requestId,
      retryable: error.status >= 500,
    });
  }

  return new AiClientError({
    code: 'AI_PROVIDER_ERROR',
    message: 'The AI service could not complete the request.',
    retryable: false,
  });
}
