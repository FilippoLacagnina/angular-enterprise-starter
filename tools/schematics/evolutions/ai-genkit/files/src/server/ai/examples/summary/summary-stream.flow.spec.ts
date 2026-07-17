import { describe, expect, it, vi } from 'vitest';

import { createSummaryStreamHandler } from './summary-stream.flow';
import type {
  AiGenerationRequest,
  AiTextGenerationStream,
  AiTextStreamingProvider,
} from '../../providers/ai-provider';

async function* createStream(...chunks: string[]): AsyncIterable<string> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

class FakeStreamingProvider implements AiTextStreamingProvider {
  lastRequest: AiGenerationRequest | undefined;

  constructor(private readonly generation: AiTextGenerationStream) {}

  generateTextStream(request: AiGenerationRequest): AiTextGenerationStream {
    this.lastRequest = request;
    return this.generation;
  }
}

describe('createSummaryStreamHandler', () => {
  it('forwards typed chunks and returns the validated final summary', async () => {
    const abortController = new AbortController();
    const provider = new FakeStreamingProvider({
      response: Promise.resolve('Angular summary.'),
      stream: createStream('Angular ', 'summary.'),
    });
    const sendChunk = vi.fn();
    const handler = createSummaryStreamHandler(provider);

    await expect(
      handler({ text: 'A long source text.' }, { abortSignal: abortController.signal, sendChunk }),
    ).resolves.toEqual({ summary: 'Angular summary.' });
    expect(sendChunk.mock.calls).toEqual([['Angular '], ['summary.']]);
    expect(provider.lastRequest).toMatchObject({
      abortSignal: abortController.signal,
      prompt: 'A long source text.',
      temperature: 0.2,
    });
  });

  it('rejects invalid input before invoking the provider', async () => {
    const provider = new FakeStreamingProvider({
      response: Promise.resolve('Unused.'),
      stream: createStream(),
    });
    const handler = createSummaryStreamHandler(provider);

    await expect(handler({ text: '   ' }, { sendChunk: vi.fn() })).rejects.toBeDefined();
    expect(provider.lastRequest).toBeUndefined();
  });

  it('rejects an invalid final provider response', async () => {
    const provider = new FakeStreamingProvider({
      response: Promise.resolve(42 as unknown as string),
      stream: createStream('Partial'),
    });
    const handler = createSummaryStreamHandler(provider);

    await expect(handler({ text: 'Source text.' }, { sendChunk: vi.fn() })).rejects.toBeDefined();
  });
});
