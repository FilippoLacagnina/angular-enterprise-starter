import type { Genkit } from 'genkit';
import type { GenkitPlugin, GenkitPluginV2 } from 'genkit/plugin';

import type { AiProvider } from './ai-provider';

export type AiEnvironment = Readonly<Record<string, string | undefined>>;

export interface AiProviderReference {
  id: string;
  model: string;
}

export interface AiProviderRegistration extends AiProviderReference {
  createPlugin(): GenkitPlugin | GenkitPluginV2;
  createProvider(ai: Genkit): AiProvider;
}

export interface AiProviderDefinition {
  readonly id: string;
  configure(environment: AiEnvironment): AiProviderRegistration | undefined;
  getReference(environment: AiEnvironment): AiProviderReference;
}

export class AiProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiProviderConfigurationError';
  }
}
