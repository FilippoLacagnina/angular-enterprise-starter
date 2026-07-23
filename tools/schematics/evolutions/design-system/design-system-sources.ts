import { getEvolutionDependencyRequirements } from '../../evolution/evolution-manifest';
import { BOOTSTRAP_COMPONENT_DEFINITIONS } from '../bootstrap/bootstrap.registry';
import { TAILWIND_COMPONENT_DEFINITIONS } from '../tailwind/tailwind.registry';
import { createDesignSystemSources } from './design-system-sources.factory';

export const DESIGN_SYSTEM_SOURCES_SCHEMA_VERSION = 1 as const;
export const DESIGN_SYSTEM_SOURCES_HASH_ALGORITHM = 'sha256' as const;

export interface DesignSystemSourceDependency {
  readonly name: string;
  readonly versionRange: string;
  readonly target: 'dependencies' | 'devDependencies';
}

export type DesignSystemSourceStyle =
  | {
      readonly strategy: 'package-css';
      readonly dependencies: readonly DesignSystemSourceDependency[];
      readonly entryPoint: string;
    }
  | {
      readonly strategy: 'tailwind-postcss';
      readonly dependencies: readonly DesignSystemSourceDependency[];
      readonly entryPoint: 'tailwindcss';
      readonly postcssPlugin: '@tailwindcss/postcss';
    };

export interface DesignSystemSourceFile {
  readonly relativePath: string;
  readonly content: string;
}

export interface DesignSystemComponentSources {
  readonly id: string;
  readonly className: string;
  readonly exportPath: string;
  readonly sourceHash: string;
  readonly files: readonly DesignSystemSourceFile[];
}

export interface DesignSystemProviderSources {
  readonly id: string;
  readonly evolutionName: string;
  readonly style: DesignSystemSourceStyle;
  readonly components: readonly DesignSystemComponentSources[];
  readonly sourceHash: string;
}

export interface DesignSystemSources {
  readonly schemaVersion: typeof DESIGN_SYSTEM_SOURCES_SCHEMA_VERSION;
  readonly hashAlgorithm: typeof DESIGN_SYSTEM_SOURCES_HASH_ALGORITHM;
  readonly providers: readonly DesignSystemProviderSources[];
}

export const designSystemSources: DesignSystemSources = createDesignSystemSources([
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
]);

export default designSystemSources;
