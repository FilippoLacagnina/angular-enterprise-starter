import { googleAI } from '@genkit-ai/google-genai';

import type {
  AiEnvironment,
  AiProviderDefinition,
  AiProviderReference,
  AiProviderRegistration,
} from './ai-provider.definition';
import { AiProviderConfigurationError } from './ai-provider.definition';
import { GOOGLE_AI_PROVIDER_ID, GoogleGeminiProvider } from './google-gemini.provider';

export const UNCONFIGURED_GOOGLE_AI_MODEL = 'unconfigured';

const GOOGLE_AI_ENABLED_VARIABLE = 'AI_GENKIT_GOOGLE_AI_ENABLED';
const GOOGLE_AI_MODEL_VARIABLE = 'AI_GENKIT_GOOGLE_AI_MODEL';

function readEnabled(value: string | undefined): boolean {
  if (value === undefined || value === 'false') {
    return false;
  }

  if (value === 'true') {
    return true;
  }

  throw new AiProviderConfigurationError(
    `${GOOGLE_AI_ENABLED_VARIABLE} must be either true or false.`,
  );
}

function readModel(value: string | undefined, required = false): string {
  const model = value?.trim();

  if (!model) {
    if (required) {
      throw new AiProviderConfigurationError(
        `${GOOGLE_AI_MODEL_VARIABLE} is required when the Google AI provider is enabled.`,
      );
    }

    return UNCONFIGURED_GOOGLE_AI_MODEL;
  }

  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(model)) {
    throw new AiProviderConfigurationError(
      `${GOOGLE_AI_MODEL_VARIABLE} contains unsupported characters.`,
    );
  }

  return model;
}

function getReference(environment: AiEnvironment): AiProviderReference {
  return {
    id: GOOGLE_AI_PROVIDER_ID,
    model: readModel(environment[GOOGLE_AI_MODEL_VARIABLE]),
  };
}

function configure(environment: AiEnvironment): AiProviderRegistration | undefined {
  if (!readEnabled(environment[GOOGLE_AI_ENABLED_VARIABLE])) {
    return undefined;
  }

  const apiKey = environment['GEMINI_API_KEY']?.trim();
  if (!apiKey) {
    throw new AiProviderConfigurationError(
      'GEMINI_API_KEY is required when the Google AI provider is enabled.',
    );
  }

  const reference = {
    id: GOOGLE_AI_PROVIDER_ID,
    model: readModel(environment[GOOGLE_AI_MODEL_VARIABLE], true),
  };

  return {
    ...reference,
    createPlugin: () => googleAI({ apiKey }),
    createProvider: (ai) => new GoogleGeminiProvider(ai, reference),
  };
}

export const googleGeminiProviderDefinition: AiProviderDefinition = {
  id: GOOGLE_AI_PROVIDER_ID,
  configure,
  getReference,
};
