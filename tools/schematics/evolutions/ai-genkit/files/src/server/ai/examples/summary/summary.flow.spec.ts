import type { z } from 'genkit';
import { describe, expect, it } from 'vitest';

import { createSummaryHandler } from './summary.flow';
import type {
  AiStructuredGenerationProvider,
  AiStructuredGenerationRequest,
} from '../../providers/ai-provider';

class FakeAiProvider implements AiStructuredGenerationProvider {
  lastRequest: AiStructuredGenerationRequest<z.ZodTypeAny> | undefined;

  constructor(private readonly output: unknown) {}

  generateStructured<TOutputSchema extends z.ZodTypeAny>(
    request: AiStructuredGenerationRequest<TOutputSchema>,
  ): Promise<z.infer<TOutputSchema>> {
    this.lastRequest = request;

    return Promise.resolve(this.output as z.infer<TOutputSchema>);
  }
}

describe('createSummaryHandler', () => {
  it('returns schema-validated output from an injected provider', async () => {
    const abortController = new AbortController();
    const provider = new FakeAiProvider({ summary: 'A concise summary.' });
    const handler = createSummaryHandler(provider);

    await expect(
      handler({ text: 'A long source text.' }, { abortSignal: abortController.signal }),
    ).resolves.toEqual({
      summary: 'A concise summary.',
    });
    expect(provider.lastRequest?.abortSignal).toBe(abortController.signal);
    expect(provider.lastRequest?.prompt).toBe('A long source text.');
    expect(provider.lastRequest?.temperature).toBe(0.2);
  });

  it('rejects invalid input before invoking the provider', async () => {
    const provider = new FakeAiProvider({ summary: 'Unused.' });
    const handler = createSummaryHandler(provider);

    await expect(handler({ text: '   ' })).rejects.toBeDefined();
    expect(provider.lastRequest).toBeUndefined();
  });

  it('rejects an invalid provider response', async () => {
    const provider = new FakeAiProvider({ summary: 42 });
    const handler = createSummaryHandler(provider);

    await expect(handler({ text: 'Source text.' })).rejects.toBeDefined();
  });
});
