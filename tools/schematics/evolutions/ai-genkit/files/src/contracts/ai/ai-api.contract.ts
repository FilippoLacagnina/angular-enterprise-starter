export const AI_API_ERROR_CODES = [
  'AI_CONFIGURATION_ERROR',
  'AI_DISABLED',
  'AI_HEADERS_TOO_LARGE',
  'AI_INVALID_REQUEST',
  'AI_MODEL_UNAVAILABLE',
  'AI_PAYLOAD_TOO_LARGE',
  'AI_PROVIDER_ERROR',
  'AI_PROVIDER_UNAVAILABLE',
  'AI_RATE_LIMITED',
  'AI_TIMEOUT',
] as const;

export type AiApiErrorCode = (typeof AI_API_ERROR_CODES)[number];

export interface AiApiError {
  code: AiApiErrorCode;
  message: string;
  requestId: string;
  retryable: boolean;
}
