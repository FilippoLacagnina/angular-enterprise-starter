import type { AiApiError } from './ai-api.contract';

export interface AiSummaryInput {
  text: string;
}

export interface AiSummaryOutput {
  summary: string;
}

export interface AiSummaryStreamChunkEvent {
  delta: string;
  type: 'chunk';
}

export interface AiSummaryStreamCompleteEvent {
  output: AiSummaryOutput;
  requestId: string;
  type: 'complete';
}

export interface AiSummaryStreamErrorEvent {
  error: AiApiError;
  type: 'error';
}

export type AiSummaryStreamEvent =
  | AiSummaryStreamChunkEvent
  | AiSummaryStreamCompleteEvent
  | AiSummaryStreamErrorEvent;
