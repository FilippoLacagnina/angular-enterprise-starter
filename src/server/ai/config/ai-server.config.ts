import type {
  AiEnvironment,
  AiProviderDefinition,
  AiProviderReference,
  AiProviderRegistration,
} from '../providers/ai-provider.definition';
import { AiProviderConfigurationError } from '../providers/ai-provider.definition';
import { INSTALLED_AI_PROVIDER_DEFINITIONS } from '../providers/installed-ai-providers';

export const DEFAULT_AI_TIMEOUT_MS = 30_000;
export type { AiEnvironment, AiProviderReference };

const MIN_AI_TIMEOUT_MS = 1_000;
const MAX_AI_TIMEOUT_MS = 120_000;
interface AiServerConfigBase {
  defaultProvider: AiProviderReference;
  timeoutMs: number;
}

export interface DisabledAiServerConfig extends AiServerConfigBase {
  enabled: false;
}

export interface EnabledAiServerConfig extends AiServerConfigBase {
  enabled: true;
  providers: readonly AiProviderRegistration[];
}

export type AiServerConfig = DisabledAiServerConfig | EnabledAiServerConfig;

export class AiServerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiServerConfigError';
  }
}

function readEnabled(value: string | undefined): boolean {
  if (value === undefined || value === 'false') {
    return false;
  }

  if (value === 'true') {
    return true;
  }

  throw new AiServerConfigError('AI_GENKIT_ENABLED must be either true or false.');
}

function readDefaultProviderDefinition(
  value: string | undefined,
  definitions: readonly AiProviderDefinition[],
): AiProviderDefinition {
  const providerId = value?.trim() || definitions[0]?.id;

  if (!providerId || !/^[a-z0-9][a-z0-9._-]*$/i.test(providerId)) {
    throw new AiServerConfigError('AI_GENKIT_DEFAULT_PROVIDER is invalid.');
  }

  const definition = definitions.find((candidate) => candidate.id === providerId);
  if (!definition) {
    throw new AiServerConfigError(
      `AI_GENKIT_DEFAULT_PROVIDER references the uninstalled provider "${providerId}".`,
    );
  }

  return definition;
}

function validateProviderDefinitions(definitions: readonly AiProviderDefinition[]): void {
  const providerIds = definitions.map((definition) => definition.id);

  if (new Set(providerIds).size !== providerIds.length) {
    throw new AiServerConfigError('Installed AI provider identifiers must be unique.');
  }
}

function ensureSafeTelemetryConfiguration(environment: AiEnvironment): void {
  const metricsExporters =
    environment['OTEL_METRICS_EXPORTER']
      ?.split(',')
      .map((exporter) => exporter.trim().toLowerCase()) ?? [];

  if (metricsExporters.includes('prometheus')) {
    throw new AiServerConfigError(
      'The Prometheus OpenTelemetry exporter is not supported by this AI foundation.',
    );
  }

  const unsupportedFlags = [
    'ENABLE_FIREBASE_MONITORING',
    'GENKIT_OTEL_ENABLE_LOGS',
    'GENKIT_ENABLE_REALTIME_TELEMETRY',
  ] as const;

  for (const variable of unsupportedFlags) {
    if (environment[variable]?.trim().toLowerCase() === 'true') {
      throw new AiServerConfigError(`${variable} is not supported by this AI foundation.`);
    }
  }

  if (environment['GENKIT_TELEMETRY_SERVER']?.trim()) {
    throw new AiServerConfigError(
      'GENKIT_TELEMETRY_SERVER is not supported by this AI foundation.',
    );
  }
}

function readTimeout(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return DEFAULT_AI_TIMEOUT_MS;
  }

  const timeoutMs = Number(value);

  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < MIN_AI_TIMEOUT_MS ||
    timeoutMs > MAX_AI_TIMEOUT_MS
  ) {
    throw new AiServerConfigError(
      `AI_GENKIT_TIMEOUT_MS must be an integer between ${MIN_AI_TIMEOUT_MS} and ${MAX_AI_TIMEOUT_MS}.`,
    );
  }

  return timeoutMs;
}

function readProviderConfiguration<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error: unknown) {
    if (error instanceof AiProviderConfigurationError) {
      throw new AiServerConfigError(error.message);
    }

    throw error;
  }
}

export function loadAiServerConfig(
  environment: AiEnvironment = process.env,
  providerDefinitions: readonly AiProviderDefinition[] = INSTALLED_AI_PROVIDER_DEFINITIONS,
): AiServerConfig {
  validateProviderDefinitions(providerDefinitions);
  const enabled = readEnabled(environment['AI_GENKIT_ENABLED']);
  const defaultProviderDefinition = readDefaultProviderDefinition(
    environment['AI_GENKIT_DEFAULT_PROVIDER'],
    providerDefinitions,
  );
  const defaultProvider = readProviderConfiguration(() =>
    defaultProviderDefinition.getReference(environment),
  );
  const baseConfig: AiServerConfigBase = {
    defaultProvider,
    timeoutMs: readTimeout(environment['AI_GENKIT_TIMEOUT_MS']),
  };

  if (!enabled) {
    return {
      ...baseConfig,
      enabled: false,
    };
  }

  ensureSafeTelemetryConfiguration(environment);
  const providers = providerDefinitions
    .map((definition) => {
      const provider = readProviderConfiguration(() => definition.configure(environment));

      if (provider && provider.id !== definition.id) {
        throw new AiServerConfigError(
          `AI provider definition "${definition.id}" returned the mismatched provider "${provider.id}".`,
        );
      }

      return provider;
    })
    .filter((provider): provider is AiProviderRegistration => provider !== undefined);

  if (!providers.some((provider) => provider.id === defaultProvider.id)) {
    throw new AiServerConfigError(
      `The default AI provider "${defaultProvider.id}" must be enabled.`,
    );
  }

  return {
    ...baseConfig,
    enabled: true,
    providers,
  };
}
