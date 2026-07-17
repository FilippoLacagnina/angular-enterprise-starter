import { EventEmitter } from 'node:events';

import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import {
  AI_STREAM_CONTENT_TYPE,
  AiStreamClosedError,
  prepareAiStreamResponse,
  writeAiStreamEvent,
} from './ai-stream.writer';

interface ResponseStub extends EventEmitter {
  destroyed: boolean;
  flushHeaders: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
  writableEnded: boolean;
  write: ReturnType<typeof vi.fn>;
}

function createResponseStub(): ResponseStub {
  const response = Object.assign(new EventEmitter(), {
    destroyed: false,
    flushHeaders: vi.fn(),
    setHeader: vi.fn(),
    status: vi.fn(),
    writableEnded: false,
    write: vi.fn().mockReturnValue(true),
  });
  response.status.mockReturnValue(response);

  return response;
}

describe('AI stream writer', () => {
  it('sets non-buffering and content-security response headers', () => {
    const response = createResponseStub();

    prepareAiStreamResponse(response as unknown as Response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.setHeader.mock.calls).toEqual([
      ['Cache-Control', 'no-store, no-transform'],
      ['Content-Type', AI_STREAM_CONTENT_TYPE],
      ['X-Accel-Buffering', 'no'],
      ['X-Content-Type-Options', 'nosniff'],
    ]);
    expect(response.flushHeaders).toHaveBeenCalledOnce();
  });

  it('serializes one NDJSON frame per line', async () => {
    const response = createResponseStub();

    await writeAiStreamEvent(response as unknown as Response, {
      delta: 'Partial summary.',
      type: 'chunk',
    });

    expect(response.write).toHaveBeenCalledWith(
      `${JSON.stringify({ delta: 'Partial summary.', type: 'chunk' })}\n`,
    );
  });

  it('waits for drain when Node applies backpressure', async () => {
    const response = createResponseStub();
    response.write.mockReturnValue(false);

    const writePromise = writeAiStreamEvent(response as unknown as Response, {
      delta: 'Partial summary.',
      type: 'chunk',
    });
    response.emit('drain');

    await expect(writePromise).resolves.toBeUndefined();
  });

  it('stops waiting for drain when the request is aborted', async () => {
    const response = createResponseStub();
    const abortController = new AbortController();
    response.write.mockReturnValue(false);

    const writePromise = writeAiStreamEvent(
      response as unknown as Response,
      { delta: 'Partial summary.', type: 'chunk' },
      abortController.signal,
    );
    abortController.abort(new AiStreamClosedError());

    await expect(writePromise).rejects.toBeInstanceOf(AiStreamClosedError);
  });
});
