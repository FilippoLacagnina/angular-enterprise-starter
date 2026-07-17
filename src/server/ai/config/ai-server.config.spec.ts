import { describe, expect, it } from 'vitest';

import { AiServerConfigError, DEFAULT_AI_TIMEOUT_MS, loadAiServerConfig } from './ai-server.config';
import type {
  AiEnvironment,
  AiProviderDefinition,
  AiProviderReference,
  AiProviderRegistration,
} from '../providers/ai-provider.definition';
import { UNCONFIGURED_GOOGLE_AI_MODEL } from '../providers/google-gemini.provider.definition';

const ENABLED_GOOGLE_ENVIRONMENT: AiEnvironment = {
  AI_GENKIT_DEFAULT_PROVIDER: 'google-ai',
  AI_GENKIT_ENABLED: 'true',
  AI_GENKIT_GOOGLE_AI_ENABLED: 'true',
  AI_GENKIT_GOOGLE_AI_MODEL: 'gemini-3.5-flash',
  AI_GENKIT_TIMEOUT_MS: '45000',
  GEMINI_API_KEY: 'server-secret',
};

function createFakeProviderDefinition(id: string): AiProviderDefinition {
  const getReference = (environment: AiEnvironment): AiProviderReference => ({
    id,
    model: environment[`TEST_${id}_MODEL`]?.trim() || `${id}-model`,
  });

  return {
    id,
    configure(environment): AiProviderRegistration | undefined {
      if (environment[`TEST_${id}_ENABLED`] !== 'true') {
        return undefined;
      }

      return {
        ...getReference(environment),
        createPlugin: () => {
          throw new Error('The test provider plugin must not be created while loading config.');
        },
        createProvider: () => {
          throw new Error('The test provider must not be created while loading config.');
        },
      };
    },
    getReference,
  };
}

describe('loadAiServerConfig', () => {
  it('keeps the AI foundation disabled by default', () => {
    expect(loadAiServerConfig({})).toEqual({
      defaultProvider: {
        id: 'google-ai',
        model: UNCONFIGURED_GOOGLE_AI_MODEL,
      },
      enabled: false,
      timeoutMs: DEFAULT_AI_TIMEOUT_MS,
    });
  });

  it('loads enabled providers without exposing credentials in the config data', () => {
    const config = loadAiServerConfig(ENABLED_GOOGLE_ENVIRONMENT);

    expect(config).toMatchObject({
      defaultProvider: {
        id: 'google-ai',
        model: 'gemini-3.5-flash',
      },
      enabled: true,
      timeoutMs: 45_000,
    });
    expect(config.enabled && config.providers.map(({ id, model }) => ({ id, model }))).toEqual([
      {
        id: 'google-ai',
        model: 'gemini-3.5-flash',
      },
    ]);
    expect(JSON.stringify(config)).not.toContain('server-secret');
  });

  it('loads multiple enabled definitions and selects the configured default provider', () => {
    const first = createFakeProviderDefinition('first');
    const second = createFakeProviderDefinition('second');
    const config = loadAiServerConfig(
      {
        AI_GENKIT_DEFAULT_PROVIDER: 'second',
        AI_GENKIT_ENABLED: 'true',
        TEST_first_ENABLED: 'true',
        TEST_second_ENABLED: 'true',
        TEST_second_MODEL: 'second-custom-model',
      },
      [first, second],
    );

    expect(config.defaultProvider).toEqual({
      id: 'second',
      model: 'second-custom-model',
    });
    expect(config.enabled && config.providers.map((provider) => provider.id)).toEqual([
      'first',
      'second',
    ]);
  });

  it('requires credentials only when the Google AI provider is enabled', () => {
    expect(() =>
      loadAiServerConfig({
        AI_GENKIT_ENABLED: 'true',
        AI_GENKIT_GOOGLE_AI_ENABLED: 'true',
      }),
    ).toThrow(AiServerConfigError);

    expect(
      loadAiServerConfig({
        AI_GENKIT_GOOGLE_AI_ENABLED: 'true',
      }).enabled,
    ).toBe(false);
  });

  it('requires an explicit model when the Google AI provider is enabled', () => {
    expect(() =>
      loadAiServerConfig({
        AI_GENKIT_ENABLED: 'true',
        AI_GENKIT_GOOGLE_AI_ENABLED: 'true',
        GEMINI_API_KEY: 'server-secret',
      }),
    ).toThrow('AI_GENKIT_GOOGLE_AI_MODEL is required');
  });

  it('requires the configured default provider to be enabled', () => {
    expect(() =>
      loadAiServerConfig({
        AI_GENKIT_DEFAULT_PROVIDER: 'google-ai',
        AI_GENKIT_ENABLED: 'true',
        AI_GENKIT_GOOGLE_AI_ENABLED: 'false',
      }),
    ).toThrow('The default AI provider "google-ai" must be enabled.');
  });

  it('rejects duplicate installed provider definitions', () => {
    expect(() =>
      loadAiServerConfig({}, [
        createFakeProviderDefinition('duplicate'),
        createFakeProviderDefinition('duplicate'),
      ]),
    ).toThrow('Installed AI provider identifiers must be unique.');
  });

  it.each([
    ['AI_GENKIT_ENABLED', { AI_GENKIT_ENABLED: 'yes' }],
    ['AI_GENKIT_DEFAULT_PROVIDER', { AI_GENKIT_DEFAULT_PROVIDER: 'uninstalled-provider' }],
    [
      'AI_GENKIT_GOOGLE_AI_ENABLED',
      { AI_GENKIT_ENABLED: 'true', AI_GENKIT_GOOGLE_AI_ENABLED: 'yes' },
    ],
    ['AI_GENKIT_GOOGLE_AI_MODEL', { AI_GENKIT_GOOGLE_AI_MODEL: 'gemini model' }],
    ['AI_GENKIT_TIMEOUT_MS', { AI_GENKIT_TIMEOUT_MS: '999' }],
    ['AI_GENKIT_TIMEOUT_MS', { AI_GENKIT_TIMEOUT_MS: '120001' }],
  ])('rejects an invalid %s value', (_variable, environment) => {
    expect(() => loadAiServerConfig(environment)).toThrow(AiServerConfigError);
  });

  it.each([
    ['OTEL_METRICS_EXPORTER', 'otlp,prometheus'],
    ['ENABLE_FIREBASE_MONITORING', 'true'],
    ['GENKIT_OTEL_ENABLE_LOGS', 'true'],
    ['GENKIT_ENABLE_REALTIME_TELEMETRY', 'true'],
    ['GENKIT_TELEMETRY_SERVER', 'https://telemetry.example.com'],
  ])('rejects unsupported telemetry through %s when enabled', (variable, value) => {
    expect(() =>
      loadAiServerConfig({
        ...ENABLED_GOOGLE_ENVIRONMENT,
        [variable]: value,
      }),
    ).toThrow(AiServerConfigError);
  });

  it('ignores telemetry variables while the optional foundation is disabled', () => {
    expect(
      loadAiServerConfig({
        ENABLE_FIREBASE_MONITORING: 'true',
        OTEL_METRICS_EXPORTER: 'prometheus',
      }).enabled,
    ).toBe(false);
  });
});
