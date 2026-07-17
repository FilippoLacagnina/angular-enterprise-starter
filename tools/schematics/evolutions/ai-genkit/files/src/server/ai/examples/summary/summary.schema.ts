import { z } from 'genkit';

import type { AiSummaryInput, AiSummaryOutput } from '../../../../contracts/ai/summary.contract';

export const AiSummaryInputSchema: z.ZodType<AiSummaryInput> = z.object({
  text: z.string().trim().min(1).max(20_000),
});

// Keep the provider-facing output schema simple for broad model compatibility.
export const AiSummaryOutputSchema: z.ZodType<AiSummaryOutput> = z.object({
  summary: z.string(),
});

export const AiSummaryStreamChunkSchema: z.ZodType<string> = z.string();
