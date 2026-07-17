import { genkit, type Genkit } from 'genkit';

import type { EnabledAiServerConfig } from './config/ai-server.config';
import { configureSecureGenkitLogging } from './logging/genkit-logging';
import { AiProviderRegistry } from './providers/ai-provider.registry';

export interface AiRuntime {
  ai: Genkit;
  providers: AiProviderRegistry;
}

export function createAiRuntime(config: EnabledAiServerConfig): AiRuntime {
  configureSecureGenkitLogging();
  const ai = genkit({
    plugins: config.providers.map((provider) => provider.createPlugin()),
  });
  const providers = new AiProviderRegistry(
    config.providers.map((provider) => provider.createProvider(ai)),
    config.defaultProvider.id,
  );

  return {
    ai,
    providers,
  };
}
