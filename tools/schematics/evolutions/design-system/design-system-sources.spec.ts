import { describe, expect, it } from 'vitest';

import { getEvolutionDependencyRequirements } from '../../evolution/evolution-manifest';
import { BOOTSTRAP_COMPONENT_DEFINITIONS } from '../bootstrap/bootstrap.registry';
import { TAILWIND_COMPONENT_DEFINITIONS } from '../tailwind/tailwind.registry';
import { designSystemCatalog } from './design-system-catalog';
import {
  type DesignSystemComponentDefinition,
  type DesignSystemFileDefinition,
} from './design-system.model';
import {
  createDesignSystemSources,
  type DesignSystemSourceProviderDefinition,
} from './design-system-sources.factory';
import {
  DESIGN_SYSTEM_SOURCES_HASH_ALGORITHM,
  DESIGN_SYSTEM_SOURCES_SCHEMA_VERSION,
  designSystemSources,
} from './design-system-sources';

const PROVIDER_DEFINITIONS = [
  {
    id: 'bootstrap',
    evolutionName: 'bootstrap',
    style: {
      strategy: 'package-css',
      dependencies: getEvolutionDependencyRequirements('bootstrap'),
      entryPoint: 'bootstrap/dist/css/bootstrap.min.css',
    },
    components: BOOTSTRAP_COMPONENT_DEFINITIONS,
  },
  {
    id: 'tailwind',
    evolutionName: 'tailwind',
    style: {
      strategy: 'tailwind-postcss',
      dependencies: getEvolutionDependencyRequirements('tailwind'),
      entryPoint: 'tailwindcss',
      postcssPlugin: '@tailwindcss/postcss',
    },
    components: TAILWIND_COMPONENT_DEFINITIONS,
  },
] as const satisfies readonly DesignSystemSourceProviderDefinition[];

describe('Design System Sources', () => {
  it('is JSON-serializable and identifies its schema and hash algorithm', () => {
    expect(JSON.parse(JSON.stringify(designSystemSources))).toEqual(designSystemSources);
    expect(designSystemSources.schemaVersion).toBe(DESIGN_SYSTEM_SOURCES_SCHEMA_VERSION);
    expect(designSystemSources.hashAlgorithm).toBe(DESIGN_SYSTEM_SOURCES_HASH_ALGORITHM);
  });

  it('derives providers, components and runtime files from the existing registries', () => {
    expect(designSystemSources.providers.map((provider) => provider.id)).toEqual(
      PROVIDER_DEFINITIONS.map((provider) => provider.id),
    );

    for (const providerDefinition of PROVIDER_DEFINITIONS) {
      const provider = designSystemSources.providers.find(
        (candidate) => candidate.id === providerDefinition.id,
      );

      expect(provider?.components.map((component) => component.id)).toEqual(
        providerDefinition.components.map((component) => component.name),
      );

      for (const componentDefinition of providerDefinition.components) {
        const component = provider?.components.find(
          (candidate) => candidate.id === componentDefinition.name,
        );

        expect(component).toMatchObject({
          className: componentDefinition.className,
          exportPath: componentDefinition.exportPath,
        });
        expect(component?.files).toEqual(
          componentDefinition.files
            .map((file) => ({
              relativePath: file.path.replace(
                `/src/app/shared/components/${providerDefinition.id}/`,
                '',
              ),
              content: file.content,
            }))
            .sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
        );

        for (const supplementalFile of componentDefinition.supplementalFiles ?? []) {
          const supplementalRelativePath = supplementalFile.path.replace(
            `/src/app/shared/components/${providerDefinition.id}/`,
            '',
          );

          expect(component?.files.map((file) => file.relativePath)).not.toContain(
            supplementalRelativePath,
          );
        }

        expect(component?.sourceHash).toMatch(/^[a-f0-9]{64}$/);
      }

      expect(provider?.sourceHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('keeps provider and component metadata aligned with the catalog', () => {
    expect(
      designSystemSources.providers.map((provider) => ({
        id: provider.id,
        evolutionName: provider.evolutionName,
        components: provider.components.map(({ id, className }) => ({ id, className })),
      })),
    ).toEqual(
      designSystemCatalog.providers.map((provider) => ({
        id: provider.id,
        evolutionName: provider.evolutionName,
        components: provider.components.map(({ id, className }) => ({ id, className })),
      })),
    );
  });

  it('keeps catalog selectors and bindings represented in the generated source', () => {
    for (const catalogProvider of designSystemCatalog.providers) {
      const sourceProvider = designSystemSources.providers.find(
        (provider) => provider.id === catalogProvider.id,
      );

      for (const catalogComponent of catalogProvider.components) {
        const source = sourceProvider?.components
          .find((component) => component.id === catalogComponent.id)
          ?.files.find((file) => file.relativePath.endsWith('.ts'))?.content;

        expect(source).toContain(`selector: '${catalogComponent.selector}'`);

        for (const input of catalogComponent.inputs) {
          expect(source).toContain(`readonly ${input.name} = ${input.twoWay ? 'model' : 'input'}`);
        }

        for (const output of catalogComponent.outputs) {
          expect(source).toContain(`readonly ${output.name} = output`);
        }
      }
    }
  });

  it('derives style dependencies from the evolution manifest', () => {
    for (const provider of designSystemSources.providers) {
      const providerDefinition = PROVIDER_DEFINITIONS.find(
        (candidate) => candidate.id === provider.id,
      );

      expect(providerDefinition).toBeDefined();
      expect(provider.style.dependencies).toEqual(
        [...(providerDefinition?.style.dependencies ?? [])]
          .map((dependency) => ({ ...dependency }))
          .sort(
            (left, right) =>
              left.target.localeCompare(right.target) || left.name.localeCompare(right.name),
          ),
      );
    }
  });

  it('produces deterministic hashes independent of runtime file ordering', () => {
    const first = createDesignSystemSources(PROVIDER_DEFINITIONS);
    const reorderedFiles = cloneProviders(PROVIDER_DEFINITIONS);

    reorderedFiles[0] = {
      ...reorderedFiles[0],
      components: reorderedFiles[0].components.map((component) => ({
        ...component,
        files: [...component.files].reverse(),
      })),
    };

    const second = createDesignSystemSources(reorderedFiles);

    expect(second).toEqual(first);
  });

  it('changes component and provider hashes when runtime source changes', () => {
    const changedProviders = cloneProviders(PROVIDER_DEFINITIONS);
    const originalProvider = designSystemSources.providers[0];
    const originalComponent = originalProvider?.components[0];
    const firstDefinition = changedProviders[0]?.components[0];

    expect(originalProvider).toBeDefined();
    expect(originalComponent).toBeDefined();
    expect(firstDefinition).toBeDefined();

    if (!firstDefinition || !changedProviders[0]) {
      return;
    }

    changedProviders[0].components[0] = {
      ...firstDefinition,
      files: firstDefinition.files.map((file, index) =>
        index === 0 ? { ...file, content: `${file.content}\n// Runtime change.` } : file,
      ),
    };

    const changed = createDesignSystemSources(changedProviders);

    expect(changed.providers[0]?.components[0]?.sourceHash).not.toBe(originalComponent?.sourceHash);
    expect(changed.providers[0]?.sourceHash).not.toBe(originalProvider?.sourceHash);
  });

  it('changes only the provider hash when its normalized style changes', () => {
    const changedProviders = cloneProviders(PROVIDER_DEFINITIONS);
    const originalProvider = designSystemSources.providers[0];

    changedProviders[0] = {
      ...changedProviders[0],
      style: {
        strategy: 'package-css',
        dependencies: changedProviders[0]?.style.dependencies ?? [],
        entryPoint: 'bootstrap/dist/css/bootstrap.css',
      },
    };

    const changedProvider = createDesignSystemSources(changedProviders).providers[0];

    expect(changedProvider?.components).toEqual(originalProvider?.components);
    expect(changedProvider?.sourceHash).not.toBe(originalProvider?.sourceHash);
  });

  it('does not change hashes when supplemental tests change', () => {
    const changedProviders = cloneProviders(PROVIDER_DEFINITIONS);
    const firstDefinition = changedProviders[0]?.components[0];

    if (!firstDefinition || !changedProviders[0]) {
      return;
    }

    changedProviders[0].components[0] = {
      ...firstDefinition,
      supplementalFiles: [
        ...(firstDefinition.supplementalFiles ?? []),
        { path: '/supplemental.spec.ts', content: 'supplemental test change' },
      ],
    };

    expect(createDesignSystemSources(changedProviders)).toEqual(designSystemSources);
  });

  it('normalizes CRLF content before hashing and emission', () => {
    const providers = createSingleProvider([
      createComponent('/src/app/shared/components/test/button/button.ts', 'line one\r\nline two\r'),
    ]);
    const normalized = createDesignSystemSources(providers);

    expect(normalized.providers[0]?.components[0]?.files[0]?.content).toBe('line one\nline two\n');
    expect(normalized).toEqual(
      createDesignSystemSources(
        createSingleProvider([
          createComponent(
            '/src/app/shared/components/test/button/button.ts',
            'line one\nline two\n',
          ),
        ]),
      ),
    );
  });

  it.each([
    '/src/app/shared/components/test/button/../outside.ts',
    '/src/app/shared/components/other/button/button.ts',
    'src/app/shared/components/test/button/button.ts',
    '/src/app/shared/components/test/button\\button.ts',
  ])('rejects unsafe or non-normalized source path %s', (sourcePath) => {
    expect(() =>
      createDesignSystemSources(createSingleProvider([createComponent(sourcePath, 'source')])),
    ).toThrow(/source path/);
  });

  it('rejects duplicate normalized runtime paths', () => {
    const component = createComponent('/src/app/shared/components/test/button/button.ts', 'source');

    expect(() => createDesignSystemSources(createSingleProvider([component, component]))).toThrow(
      /Duplicate runtime file path/,
    );
  });

  it('allows empty SCSS but rejects empty TypeScript and templates', () => {
    expect(() =>
      createDesignSystemSources(
        createSingleProvider([
          createComponent('/src/app/shared/components/test/button/button.scss', ''),
        ]),
      ),
    ).not.toThrow();

    for (const extension of ['ts', 'html']) {
      expect(() =>
        createDesignSystemSources(
          createSingleProvider([
            createComponent(`/src/app/shared/components/test/button/button.${extension}`, ''),
          ]),
        ),
      ).toThrow(/cannot be empty/);
    }
  });
});

function cloneProviders(
  definitions: readonly DesignSystemSourceProviderDefinition[],
): MutableProviderDefinition[] {
  return definitions.map((provider) => ({
    ...provider,
    style: {
      ...provider.style,
      dependencies: provider.style.dependencies.map((item) => ({ ...item })),
    },
    components: provider.components.map((component) => ({
      ...component,
      files: component.files.map((file) => ({ ...file })),
      supplementalFiles: component.supplementalFiles?.map((file) => ({ ...file })),
    })),
  }));
}

function createSingleProvider(
  files: readonly DesignSystemFileDefinition[],
): MutableProviderDefinition[] {
  return [
    {
      id: 'test',
      evolutionName: 'test',
      style: { strategy: 'package-css', dependencies: [], entryPoint: 'test/index.css' },
      components: [
        {
          name: 'button',
          label: 'Button',
          className: 'TestButton',
          exportPath: './button/button',
          files,
        },
      ],
    },
  ];
}

function createComponent(path: string, content: string) {
  return { path, content };
}

interface MutableProviderDefinition {
  id: string;
  evolutionName: string;
  style: DesignSystemSourceProviderDefinition['style'];
  components: DesignSystemComponentDefinition[];
}
