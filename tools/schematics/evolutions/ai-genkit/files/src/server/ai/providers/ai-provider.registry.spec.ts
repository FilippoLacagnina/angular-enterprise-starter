import { describe, expect, it } from 'vitest';

import type { AiProvider, AiProviderCapabilities } from './ai-provider';
import { AiProviderRegistry } from './ai-provider.registry';

function createProvider(
  id: string,
  capabilities: Partial<AiProviderCapabilities> = {},
): AiProvider {
  return {
    capabilities: {
      structuredOutput: true,
      textStreaming: true,
      ...capabilities,
    },
    generateStructured: () => Promise.resolve({}),
    generateTextStream: () => ({
      response: Promise.resolve(''),
      stream: (async function* (): AsyncIterable<string> {
        yield '';
      })(),
    }),
    id,
    model: `${id}-model`,
  };
}

describe('AiProviderRegistry', () => {
  it('resolves the configured default provider and providers by ID', () => {
    const google = createProvider('google-ai');
    const secondary = createProvider('secondary');
    const registry = new AiProviderRegistry([google, secondary], 'secondary');

    expect(registry.getDefault()).toBe(secondary);
    expect(registry.get('google-ai')).toBe(google);
    expect(registry.list()).toEqual([google, secondary]);
  });

  it('rejects duplicate provider identifiers', () => {
    expect(
      () =>
        new AiProviderRegistry(
          [createProvider('duplicate'), createProvider('duplicate')],
          'duplicate',
        ),
    ).toThrow('AI provider identifiers must be unique.');
  });

  it('rejects an unregistered default provider', () => {
    expect(() => new AiProviderRegistry([createProvider('google-ai')], 'missing')).toThrow(
      'The default AI provider "missing" is not registered.',
    );
  });

  it('rejects lookup of an unregistered provider', () => {
    const registry = new AiProviderRegistry([createProvider('google-ai')], 'google-ai');

    expect(() => registry.get('missing')).toThrow('The AI provider "missing" is not registered.');
  });

  it('rejects a provider that does not support a required capability', () => {
    const registry = new AiProviderRegistry(
      [createProvider('limited', { textStreaming: false })],
      'limited',
    );

    expect(() => registry.getDefault('textStreaming')).toThrow(
      'The AI provider "limited" does not support "textStreaming".',
    );
  });

  it('supports providers that implement only their declared capabilities', () => {
    const structuredOnly: AiProvider = {
      capabilities: {
        structuredOutput: true,
        textStreaming: false,
      },
      generateStructured: () => Promise.resolve({ value: 'structured' }),
      id: 'structured-only',
      model: 'structured-model',
    };
    const registry = new AiProviderRegistry([structuredOnly], structuredOnly.id);

    expect(registry.getDefault('structuredOutput')).toBe(structuredOnly);
    expect(() => registry.getDefault('textStreaming')).toThrow(
      'The AI provider "structured-only" does not support "textStreaming".',
    );
  });

  it('rejects inconsistent capability declarations', () => {
    const inconsistent: AiProvider = {
      capabilities: {
        structuredOutput: true,
        textStreaming: false,
      },
      id: 'inconsistent',
      model: 'inconsistent-model',
    };
    const registry = new AiProviderRegistry([inconsistent], inconsistent.id);

    expect(() => registry.getDefault('structuredOutput')).toThrow(
      'The AI provider "inconsistent" does not support "structuredOutput".',
    );
  });
});
