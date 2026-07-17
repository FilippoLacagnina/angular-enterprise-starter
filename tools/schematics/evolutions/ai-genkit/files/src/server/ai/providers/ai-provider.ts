import type { z } from 'genkit';

export interface AiGenerationRequest {
  abortSignal?: AbortSignal;
  prompt: string;
  system: string;
  temperature?: number;
}

export interface AiStructuredGenerationRequest<
  TOutputSchema extends z.ZodTypeAny,
> extends AiGenerationRequest {
  outputSchema: TOutputSchema;
}

export interface AiStructuredGenerationProvider {
  generateStructured<TOutputSchema extends z.ZodTypeAny>(
    request: AiStructuredGenerationRequest<TOutputSchema>,
  ): Promise<z.infer<TOutputSchema>>;
}

export interface AiTextGenerationStream {
  readonly response: Promise<string>;
  readonly stream: AsyncIterable<string>;
}

export interface AiTextStreamingProvider {
  generateTextStream(request: AiGenerationRequest): AiTextGenerationStream;
}

export interface AiProviderCapabilities {
  readonly structuredOutput: boolean;
  readonly textStreaming: boolean;
}

export interface AiProvider {
  readonly capabilities: AiProviderCapabilities;
  readonly id: string;
  readonly model: string;
  generateStructured?: AiStructuredGenerationProvider['generateStructured'];
  generateTextStream?: AiTextStreamingProvider['generateTextStream'];
}

export interface AiProviderCapabilityMap {
  readonly structuredOutput: AiStructuredGenerationProvider;
  readonly textStreaming: AiTextStreamingProvider;
}

export type AiProviderWithCapability<TCapability extends keyof AiProviderCapabilityMap> =
  AiProvider & AiProviderCapabilityMap[TCapability];
