import { googleAI } from '@genkit-ai/google-genai';
import type { Genkit, z } from 'genkit';

import type {
  AiGenerationRequest,
  AiProvider,
  AiStructuredGenerationRequest,
  AiStructuredGenerationProvider,
  AiTextGenerationStream,
  AiTextStreamingProvider,
} from './ai-provider';
import type { AiProviderReference } from './ai-provider.definition';
import { AiProviderError } from './ai-provider.error';

export const GOOGLE_AI_PROVIDER_ID = 'google-ai';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasErrorMarker(error: unknown, markers: readonly unknown[]): boolean {
  const visited = new Set<unknown>();
  const pending: unknown[] = [error];

  while (pending.length > 0 && visited.size < 16) {
    const current = pending.shift();

    if (!isRecord(current) || visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (
      markers.includes(current['status']) ||
      markers.includes(current['statusCode']) ||
      markers.includes(current['code'])
    ) {
      return true;
    }

    pending.push(current['cause'], current['detail'], current['error']);
  }

  return false;
}

function normalizeGoogleError(error: unknown): AiProviderError {
  if (hasErrorMarker(error, [429, '429', 'RESOURCE_EXHAUSTED'])) {
    return new AiProviderError(GOOGLE_AI_PROVIDER_ID, 'rate_limited');
  }

  if (hasErrorMarker(error, [404, '404', 'NOT_FOUND'])) {
    return new AiProviderError(GOOGLE_AI_PROVIDER_ID, 'model_unavailable');
  }

  if (hasErrorMarker(error, [401, '401', 403, '403', 'UNAUTHENTICATED', 'PERMISSION_DENIED'])) {
    return new AiProviderError(GOOGLE_AI_PROVIDER_ID, 'authentication');
  }

  if (hasErrorMarker(error, [400, '400', 'FAILED_PRECONDITION', 'INVALID_ARGUMENT'])) {
    return new AiProviderError(GOOGLE_AI_PROVIDER_ID, 'invalid_request');
  }

  if (
    hasErrorMarker(error, [
      500,
      '500',
      502,
      '502',
      503,
      '503',
      504,
      '504',
      'DEADLINE_EXCEEDED',
      'INTERNAL',
      'UNAVAILABLE',
    ])
  ) {
    return new AiProviderError(GOOGLE_AI_PROVIDER_ID, 'temporarily_unavailable');
  }

  return new AiProviderError(GOOGLE_AI_PROVIDER_ID, 'unknown');
}

function normalizeGenerationError(error: unknown, abortSignal?: AbortSignal): unknown {
  if (abortSignal?.aborted) {
    return abortSignal.reason ?? error;
  }

  return error instanceof AiProviderError ? error : normalizeGoogleError(error);
}

async function* mapTextChunks(
  stream: AsyncIterable<{ readonly text: string }>,
  abortSignal?: AbortSignal,
): AsyncIterable<string> {
  try {
    for await (const chunk of stream) {
      if (chunk.text.length > 0) {
        yield chunk.text;
      }
    }
  } catch (error: unknown) {
    throw normalizeGenerationError(error, abortSignal);
  }
}

async function readTextResponse(
  response: Promise<{ readonly text: string }>,
  abortSignal?: AbortSignal,
): Promise<string> {
  try {
    const result = await response;

    if (typeof result.text !== 'string') {
      throw new AiProviderError(GOOGLE_AI_PROVIDER_ID, 'invalid_response');
    }

    return result.text;
  } catch (error: unknown) {
    throw normalizeGenerationError(error, abortSignal);
  }
}

export class GoogleGeminiProvider
  implements AiProvider, AiStructuredGenerationProvider, AiTextStreamingProvider
{
  readonly capabilities = {
    structuredOutput: true,
    textStreaming: true,
  } as const;
  readonly id = GOOGLE_AI_PROVIDER_ID;
  readonly model: string;

  constructor(
    private readonly ai: Genkit,
    config: AiProviderReference,
  ) {
    this.model = config.model;
  }

  async generateStructured<TOutputSchema extends z.ZodTypeAny>(
    request: AiStructuredGenerationRequest<TOutputSchema>,
  ): Promise<z.infer<TOutputSchema>> {
    let response: Awaited<ReturnType<Genkit['generate']>>;

    try {
      response = await this.ai.generate({
        abortSignal: request.abortSignal,
        config: {
          temperature: request.temperature,
        },
        model: googleAI.model(this.model),
        output: {
          schema: request.outputSchema,
        },
        prompt: request.prompt,
        system: request.system,
      });
    } catch (error: unknown) {
      throw normalizeGenerationError(error, request.abortSignal);
    }

    if (response.output === null || response.output === undefined) {
      throw new AiProviderError(GOOGLE_AI_PROVIDER_ID, 'invalid_response');
    }

    return response.output;
  }

  generateTextStream(request: AiGenerationRequest): AiTextGenerationStream {
    let generation: ReturnType<Genkit['generateStream']>;

    try {
      generation = this.ai.generateStream({
        abortSignal: request.abortSignal,
        config: {
          temperature: request.temperature,
        },
        model: googleAI.model(this.model),
        prompt: request.prompt,
        system: request.system,
      });
    } catch (error: unknown) {
      throw normalizeGenerationError(error, request.abortSignal);
    }

    return {
      response: readTextResponse(generation.response, request.abortSignal),
      stream: mapTextChunks(generation.stream, request.abortSignal),
    };
  }
}
