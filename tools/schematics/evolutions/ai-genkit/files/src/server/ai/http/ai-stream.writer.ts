import type { Response } from 'express';

export const AI_STREAM_CONTENT_TYPE = 'application/x-ndjson; charset=utf-8';

export class AiStreamClosedError extends Error {
  constructor() {
    super('The AI response stream is closed.');
    this.name = 'AiStreamClosedError';
  }
}

function readAbortReason(abortSignal?: AbortSignal): unknown {
  return abortSignal?.reason ?? new AiStreamClosedError();
}

function assertWritable(response: Response, abortSignal?: AbortSignal): void {
  if (abortSignal?.aborted) {
    throw readAbortReason(abortSignal);
  }

  if (response.destroyed || response.writableEnded) {
    throw new AiStreamClosedError();
  }
}

function waitForDrain(response: Response, abortSignal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const cleanup = (): void => {
      response.off('close', onClose);
      response.off('drain', onDrain);
      abortSignal?.removeEventListener('abort', onAbort);
    };
    const onAbort = (): void => {
      cleanup();
      reject(readAbortReason(abortSignal));
    };
    const onClose = (): void => {
      cleanup();
      reject(new AiStreamClosedError());
    };
    const onDrain = (): void => {
      cleanup();
      resolve();
    };

    response.once('close', onClose);
    response.once('drain', onDrain);
    abortSignal?.addEventListener('abort', onAbort, { once: true });

    if (abortSignal?.aborted || response.destroyed || response.writableEnded) {
      onAbort();
    }
  });
}

export function prepareAiStreamResponse(response: Response): void {
  response.status(200);
  response.setHeader('Cache-Control', 'no-store, no-transform');
  response.setHeader('Content-Type', AI_STREAM_CONTENT_TYPE);
  response.setHeader('X-Accel-Buffering', 'no');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.flushHeaders();
}

export async function writeAiStreamEvent<TEvent>(
  response: Response,
  event: TEvent,
  abortSignal?: AbortSignal,
): Promise<void> {
  assertWritable(response, abortSignal);

  if (!response.write(`${JSON.stringify(event)}\n`)) {
    await waitForDrain(response, abortSignal);
  }
}
