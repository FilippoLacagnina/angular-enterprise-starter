import type { Action, Genkit } from 'genkit';

import { createSummaryGenerationRequest } from './summary.prompt';
import { AiSummaryInputSchema, AiSummaryOutputSchema } from './summary.schema';
import type { AiSummaryInput, AiSummaryOutput } from '../../../../contracts/ai/summary.contract';
import type { AiStructuredGenerationProvider } from '../../providers/ai-provider';

interface SummaryHandlerOptions {
  abortSignal?: AbortSignal;
}

export function createSummaryHandler(
  provider: AiStructuredGenerationProvider,
): (input: AiSummaryInput, options?: SummaryHandlerOptions) => Promise<AiSummaryOutput> {
  return async (input, options) => {
    const validatedInput = AiSummaryInputSchema.parse(input);
    const output = await provider.generateStructured({
      ...createSummaryGenerationRequest(validatedInput, options?.abortSignal),
      outputSchema: AiSummaryOutputSchema,
    });

    return AiSummaryOutputSchema.parse(output);
  };
}

export function defineSummaryFlow(
  ai: Genkit,
  provider: AiStructuredGenerationProvider,
): SummaryFlow {
  const handler = createSummaryHandler(provider);

  return ai.defineFlow(
    {
      name: 'summarizeFlow',
      inputSchema: AiSummaryInputSchema,
      outputSchema: AiSummaryOutputSchema,
    },
    (input, { abortSignal }) => handler(input, { abortSignal }),
  );
}

export type SummaryFlow = Action<typeof AiSummaryInputSchema, typeof AiSummaryOutputSchema>;
