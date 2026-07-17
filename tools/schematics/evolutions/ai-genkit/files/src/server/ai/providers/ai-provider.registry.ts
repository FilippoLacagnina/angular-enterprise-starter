import type { AiProvider, AiProviderCapabilities, AiProviderWithCapability } from './ai-provider';

export type AiProviderCapability = keyof AiProviderCapabilities;

export class AiProviderCapabilityError extends Error {
  constructor(providerId: string, capability: AiProviderCapability) {
    super(`The AI provider "${providerId}" does not support "${capability}".`);
    this.name = 'AiProviderCapabilityError';
  }
}

export class AiProviderRegistry {
  private readonly defaultProvider: AiProvider;
  private readonly providers: ReadonlyMap<string, AiProvider>;

  constructor(providers: readonly AiProvider[], defaultProviderId: string) {
    const entries = providers.map((provider) => [provider.id, provider] as const);
    const providerMap = new Map(entries);

    if (providerMap.size !== providers.length) {
      throw new Error('AI provider identifiers must be unique.');
    }

    const defaultProvider = providerMap.get(defaultProviderId);
    if (!defaultProvider) {
      throw new Error(`The default AI provider "${defaultProviderId}" is not registered.`);
    }

    this.defaultProvider = defaultProvider;
    this.providers = providerMap;
  }

  get(providerId: string): AiProvider;
  get<TCapability extends AiProviderCapability>(
    providerId: string,
    requiredCapability: TCapability,
  ): AiProviderWithCapability<TCapability>;
  get(providerId: string, requiredCapability?: AiProviderCapability): AiProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`The AI provider "${providerId}" is not registered.`);
    }

    if (requiredCapability) {
      const methodAvailable =
        requiredCapability === 'structuredOutput'
          ? typeof provider.generateStructured === 'function'
          : typeof provider.generateTextStream === 'function';

      if (!provider.capabilities[requiredCapability] || !methodAvailable) {
        throw new AiProviderCapabilityError(providerId, requiredCapability);
      }
    }

    return provider;
  }

  getDefault(): AiProvider;
  getDefault<TCapability extends AiProviderCapability>(
    requiredCapability: TCapability,
  ): AiProviderWithCapability<TCapability>;
  getDefault(requiredCapability?: AiProviderCapability): AiProvider {
    return requiredCapability
      ? this.get(this.defaultProvider.id, requiredCapability)
      : this.get(this.defaultProvider.id);
  }

  list(): readonly AiProvider[] {
    return [...this.providers.values()];
  }
}
