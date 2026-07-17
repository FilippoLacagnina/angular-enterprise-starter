import { AI_API_ERROR_CODES, type AiApiError } from '../../../../contracts/ai/ai-api.contract';
import type {
  AiSummaryOutput,
  AiSummaryStreamEvent,
} from '../../../../contracts/ai/summary.contract';

const DEFAULT_MAX_FRAME_CHARACTERS = 65_536;
const INVALID_STREAM_MESSAGE = 'The AI service returned an invalid streaming response.';

export class AiStreamProtocolError extends Error {
  constructor() {
    super(INVALID_STREAM_MESSAGE);
    this.name = 'AiStreamProtocolError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAiSummaryOutput(value: unknown): value is AiSummaryOutput {
  return isRecord(value) && typeof value['summary'] === 'string';
}

function isAiApiError(value: unknown): value is AiApiError {
  return (
    isRecord(value) &&
    AI_API_ERROR_CODES.some((code) => code === value['code']) &&
    typeof value['message'] === 'string' &&
    typeof value['requestId'] === 'string' &&
    typeof value['retryable'] === 'boolean'
  );
}

function parseEvent(line: string): AiSummaryStreamEvent {
  let value: unknown;

  try {
    value = JSON.parse(line) as unknown;
  } catch {
    throw new AiStreamProtocolError();
  }

  if (!isRecord(value)) {
    throw new AiStreamProtocolError();
  }

  if (value['type'] === 'chunk' && typeof value['delta'] === 'string') {
    return { delta: value['delta'], type: 'chunk' };
  }

  if (
    value['type'] === 'complete' &&
    isAiSummaryOutput(value['output']) &&
    typeof value['requestId'] === 'string'
  ) {
    return {
      output: value['output'],
      requestId: value['requestId'],
      type: 'complete',
    };
  }

  if (value['type'] === 'error' && isAiApiError(value['error'])) {
    return { error: value['error'], type: 'error' };
  }

  throw new AiStreamProtocolError();
}

export class AiSummaryNdjsonParser {
  private buffer = '';
  private finished = false;
  private previousCumulativeText = '';
  private terminalEventReceived = false;

  constructor(private readonly maxFrameCharacters = DEFAULT_MAX_FRAME_CHARACTERS) {
    if (!Number.isSafeInteger(maxFrameCharacters) || maxFrameCharacters < 1) {
      throw new RangeError('maxFrameCharacters must be a positive safe integer.');
    }
  }

  pushCumulativeText(cumulativeText: string): AiSummaryStreamEvent[] {
    if (this.finished || !cumulativeText.startsWith(this.previousCumulativeText)) {
      throw new AiStreamProtocolError();
    }

    const appendedText = cumulativeText.slice(this.previousCumulativeText.length);
    this.previousCumulativeText = cumulativeText;

    if (appendedText.length === 0) {
      return [];
    }

    if (this.terminalEventReceived) {
      throw new AiStreamProtocolError();
    }

    this.buffer += appendedText;

    const events: AiSummaryStreamEvent[] = [];
    let newlineIndex = this.buffer.indexOf('\n');

    while (newlineIndex >= 0) {
      const line = this.buffer.slice(0, newlineIndex).replace(/\r$/, '');
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.trim().length > 0) {
        events.push(this.parseLine(line));
      }

      newlineIndex = this.buffer.indexOf('\n');
    }

    this.assertFrameSize(this.buffer);

    return events;
  }

  finish(cumulativeText?: string): AiSummaryStreamEvent[] {
    if (this.finished) {
      throw new AiStreamProtocolError();
    }

    const events = cumulativeText === undefined ? [] : this.pushCumulativeText(cumulativeText);

    if (this.buffer.trim().length > 0) {
      const line = this.buffer.replace(/\r$/, '');
      this.buffer = '';
      events.push(this.parseLine(line));
    }

    this.finished = true;

    if (!this.terminalEventReceived) {
      throw new AiStreamProtocolError();
    }

    return events;
  }

  private assertFrameSize(line: string): void {
    if (line.length > this.maxFrameCharacters) {
      throw new AiStreamProtocolError();
    }
  }

  private parseLine(line: string): AiSummaryStreamEvent {
    this.assertFrameSize(line);
    const event = parseEvent(line);

    if (this.terminalEventReceived) {
      throw new AiStreamProtocolError();
    }

    if (event.type === 'complete' || event.type === 'error') {
      this.terminalEventReceived = true;
    }

    return event;
  }
}
