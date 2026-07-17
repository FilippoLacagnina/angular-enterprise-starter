import { type Genkit, z } from 'genkit';
import { describe, expect, it, vi } from 'vitest';

import type { AiProviderReference } from './ai-provider.definition';
import { AiProviderError } from './ai-provider.error';
import { GoogleGeminiProvider } from './google-gemini.provider';

const TestStructuredOutputSchema = z.object({ summary: z.string() });

async function collectStream(stream: AsyncIterable<string>): Promise<string[]> {
  const chunks: string[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return chunks;
}

async function* createTextChunks(...chunks: string[]): AsyncIterable<{ text: string }> {
  for (const text of chunks) {
    yield { text };
  }
}

async function* createFailingTextChunks(error: unknown): AsyncIterable<{ text: string }> {
  yield { text: 'Partial' };
  throw error;
}

const config: AiProviderReference = {
  id: 'google-ai',
  model: 'gemini-test-model',
};

describe('GoogleGeminiProvider', () => {
  it('uses the configured model and returns structured output', async () => {
    const abortController = new AbortController();
    const generate = vi.fn().mockResolvedValue({
      output: { summary: 'A concise summary.' },
    });
    const ai = { generate } as unknown as Genkit;
    const provider = new GoogleGeminiProvider(ai, config);

    await expect(
      provider.generateStructured({
        abortSignal: abortController.signal,
        outputSchema: TestStructuredOutputSchema,
        prompt: 'Source text.',
        system: 'Summarize safely.',
        temperature: 0.2,
      }),
    ).resolves.toEqual({ summary: 'A concise summary.' });
    expect(generate).toHaveBeenCalledOnce();
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        abortSignal: abortController.signal,
        prompt: 'Source text.',
        system: 'Summarize safely.',
      }),
    );
  });

  it('fails when Gemini returns no structured output', async () => {
    const ai = {
      generate: vi.fn().mockResolvedValue({ output: null }),
    } as unknown as Genkit;
    const provider = new GoogleGeminiProvider(ai, config);

    const error = await provider
      .generateStructured({
        outputSchema: TestStructuredOutputSchema,
        prompt: 'Source text.',
        system: 'Summarize safely.',
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AiProviderError);
    expect(error).toMatchObject({
      kind: 'invalid_response',
      providerId: 'google-ai',
    });
  });

  it('normalizes nested Gemini quota errors without retaining provider details', async () => {
    const ai = {
      generate: vi.fn().mockRejectedValue({
        detail: {
          error: {
            code: 429,
            message: 'sensitive provider detail',
            status: 'RESOURCE_EXHAUSTED',
          },
        },
      }),
    } as unknown as Genkit;
    const provider = new GoogleGeminiProvider(ai, config);

    const error = await provider
      .generateStructured({
        outputSchema: TestStructuredOutputSchema,
        prompt: 'Source text.',
        system: 'Summarize safely.',
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AiProviderError);
    expect(error).toMatchObject({ kind: 'rate_limited', providerId: 'google-ai' });
    expect(JSON.stringify(error)).not.toContain('sensitive provider detail');
  });

  it('streams text chunks and resolves the final Gemini response', async () => {
    const abortController = new AbortController();
    const generateStream = vi.fn().mockReturnValue({
      response: Promise.resolve({ text: 'Complete summary.' }),
      stream: createTextChunks('Complete ', '', 'summary.'),
    });
    const ai = { generateStream } as unknown as Genkit;
    const provider = new GoogleGeminiProvider(ai, config);

    const generation = provider.generateTextStream({
      abortSignal: abortController.signal,
      prompt: 'Source text.',
      system: 'Summarize safely.',
      temperature: 0.2,
    });

    await expect(collectStream(generation.stream)).resolves.toEqual(['Complete ', 'summary.']);
    await expect(generation.response).resolves.toBe('Complete summary.');
    expect(generateStream).toHaveBeenCalledWith(
      expect.objectContaining({
        abortSignal: abortController.signal,
        prompt: 'Source text.',
        system: 'Summarize safely.',
      }),
    );
  });

  it('normalizes failures raised while consuming a Gemini stream', async () => {
    const generateStream = vi.fn().mockReturnValue({
      response: Promise.reject({ code: 503, status: 'UNAVAILABLE' }),
      stream: createFailingTextChunks({ code: 503, status: 'UNAVAILABLE' }),
    });
    const ai = { generateStream } as unknown as Genkit;
    const provider = new GoogleGeminiProvider(ai, config);
    const generation = provider.generateTextStream({
      prompt: 'Source text.',
      system: 'Summarize safely.',
    });

    await expect(collectStream(generation.stream)).rejects.toMatchObject({
      kind: 'temporarily_unavailable',
      providerId: 'google-ai',
    });
    await expect(generation.response).rejects.toMatchObject({
      kind: 'temporarily_unavailable',
      providerId: 'google-ai',
    });
  });

  it('preserves an abort reason instead of converting it to a provider failure', async () => {
    const abortController = new AbortController();
    const abortReason = new Error('request aborted');
    const ai = {
      generate: vi.fn().mockImplementation(async () => {
        abortController.abort(abortReason);
        throw { code: 503, status: 'UNAVAILABLE' };
      }),
    } as unknown as Genkit;
    const provider = new GoogleGeminiProvider(ai, config);

    await expect(
      provider.generateStructured({
        abortSignal: abortController.signal,
        outputSchema: TestStructuredOutputSchema,
        prompt: 'Source text.',
        system: 'Summarize safely.',
      }),
    ).rejects.toBe(abortReason);
  });
});
