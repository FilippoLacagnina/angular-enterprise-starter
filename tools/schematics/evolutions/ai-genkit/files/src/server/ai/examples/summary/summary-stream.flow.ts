import type { Action, Genkit } from 'genkit';

import { createSummaryGenerationRequest } from './summary.prompt';
import {
  AiSummaryInputSchema,
  AiSummaryOutputSchema,
  AiSummaryStreamChunkSchema,
} from './summary.schema';
import type { AiSummaryInput, AiSummaryOutput } from '../../../../contracts/ai/summary.contract';
import type { AiTextStreamingProvider } from '../../providers/ai-provider';

interface SummaryStreamHandlerOptions {
  abortSignal?: AbortSignal;
  sendChunk(chunk: string): void;
}

export function createSummaryStreamHandler(
  provider: AiTextStreamingProvider,
): (input: AiSummaryInput, options: SummaryStreamHandlerOptions) => Promise<AiSummaryOutput> {
  return async (input, options) => {
    const validatedInput = AiSummaryInputSchema.parse(input);
    const generation = provider.generateTextStream(
      createSummaryGenerationRequest(validatedInput, options.abortSignal),
    );

    try {
      for await (const chunk of generation.stream) {
        options.sendChunk(chunk);
      }

      const summary = await generation.response;

      return AiSummaryOutputSchema.parse({ summary });
    } catch (error: unknown) {
      void generation.response.catch(() => undefined);
      throw error;
    }
  };
}

export function defineSummaryStreamFlow(
  ai: Genkit,
  provider: AiTextStreamingProvider,
): SummaryStreamFlow {
  const handler = createSummaryStreamHandler(provider);

  return ai.defineFlow(
    {
      name: 'summarizeStreamFlow',
      inputSchema: AiSummaryInputSchema,
      outputSchema: AiSummaryOutputSchema,
      streamSchema: AiSummaryStreamChunkSchema,
    },
    (input, { abortSignal, sendChunk }) => handler(input, { abortSignal, sendChunk }),
  );
}

export type SummaryStreamFlow = Action<
  typeof AiSummaryInputSchema,
  typeof AiSummaryOutputSchema,
  typeof AiSummaryStreamChunkSchema
>;
