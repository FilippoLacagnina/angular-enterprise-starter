import { describe, expect, it } from 'vitest';

import { BOOTSTRAP_COMPONENT_DEFINITIONS } from '../bootstrap/bootstrap.registry';
import { TAILWIND_COMPONENT_DEFINITIONS } from '../tailwind/tailwind.registry';
import { DESIGN_SYSTEM_CATALOG_SCHEMA_VERSION, designSystemCatalog } from './design-system-catalog';

describe('Design System Catalog', () => {
  it('is JSON-serializable and uses the supported schema version', () => {
    const serializedCatalog = JSON.stringify(designSystemCatalog);

    expect(JSON.parse(serializedCatalog)).toEqual(designSystemCatalog);
    expect(designSystemCatalog.schemaVersion).toBe(DESIGN_SYSTEM_CATALOG_SCHEMA_VERSION);
  });

  it.each([
    ['bootstrap', BOOTSTRAP_COMPONENT_DEFINITIONS],
    ['tailwind', TAILWIND_COMPONENT_DEFINITIONS],
  ] as const)('matches the registered %s components and selectors', (providerId, definitions) => {
    const provider = designSystemCatalog.providers.find((entry) => entry.id === providerId);

    expect(provider).toBeDefined();
    expect(provider?.components.map((component) => component.id)).toEqual(
      definitions.map((definition) => definition.name),
    );

    for (const definition of definitions) {
      const component = provider?.components.find((entry) => entry.id === definition.name);
      const componentSource = definition.files.find((file) => file.path.endsWith('.ts'))?.content;

      expect(component).toBeDefined();
      expect(componentSource).toContain(`selector: '${component?.selector}'`);
      expect(component?.className).toBe(definition.className);

      for (const input of component?.inputs ?? []) {
        const initializer = input.twoWay ? 'model' : 'input';

        expect(componentSource).toContain(`readonly ${input.name} = ${initializer}`);
      }

      for (const output of component?.outputs ?? []) {
        expect(componentSource).toContain(`readonly ${output.name} = output`);
      }
    }
  });

  it('uses unique provider, component, binding and example identifiers', () => {
    expectUnique(designSystemCatalog.providers.map((provider) => provider.id));

    for (const provider of designSystemCatalog.providers) {
      expectUnique(provider.components.map((component) => component.id));

      for (const component of provider.components) {
        expectUnique(component.inputs.map((input) => input.name));
        expectUnique(component.outputs.map((output) => output.name));
        expectUnique(component.examples.map((example) => example.id));

        const inputNames = new Set(component.inputs.map((input) => input.name));

        for (const example of component.examples) {
          expect(Object.keys(example.inputs).every((inputName) => inputNames.has(inputName))).toBe(
            true,
          );
        }
      }
    }
  });

  it('keeps the semantic component contract aligned across providers', () => {
    const [bootstrap, tailwind] = designSystemCatalog.providers;

    expect(bootstrap?.components.map(toSemanticContract)).toEqual(
      tailwind?.components.map(toSemanticContract),
    );
  });
});

function expectUnique(values: readonly string[]): void {
  expect(new Set(values).size).toBe(values.length);
}

function toSemanticContract(
  component: (typeof designSystemCatalog.providers)[number]['components'][number],
) {
  return {
    id: component.id,
    projectedContent: component.projectedContent,
    inputs: component.inputs,
    outputs: component.outputs,
    examples: component.examples,
  };
}
