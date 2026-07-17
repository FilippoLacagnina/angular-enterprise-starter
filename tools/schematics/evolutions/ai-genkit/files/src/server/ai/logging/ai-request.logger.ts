import type { AiApiErrorCode } from '../../../contracts/ai/ai-api.contract';

export type AiRequestStatus =
  | 'aborted'
  | 'disabled'
  | 'error'
  | 'rate_limited'
  | 'rejected'
  | 'success'
  | 'timeout';

export interface AiRequestLogEntry {
  durationMs: number;
  errorCode?: AiApiErrorCode;
  event: 'ai_request_completed';
  httpStatus: number;
  model: string;
  provider: string;
  requestId: string;
  status: AiRequestStatus;
}

export interface AiRequestLogger {
  log(entry: AiRequestLogEntry): void;
}

export const consoleAiRequestLogger: AiRequestLogger = {
  log(entry): void {
    console.info(JSON.stringify(entry));
  },
};
