import { SchematicsException } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import {
  type BootstrapComponentDefinition,
  type BootstrapComponentName,
  type BootstrapInstallPlan,
  type BootstrapMode,
} from './bootstrap.model';
import {
  getDesignSystemComponentFiles,
  getDesignSystemComponentStatuses,
  getDesignSystemExportLines,
} from '../design-system/design-system.plan';
import {
  BOOTSTRAP_COMPONENT_DEFINITIONS,
  BOOTSTRAP_COMPONENT_NAMES,
  getBootstrapComponentDefinition,
} from './bootstrap.registry';

export const BOOTSTRAP_INDEX_PATH = '/src/app/shared/components/bootstrap/index.ts';

export function createBootstrapInstallPlan(options: EvolutionOptions): BootstrapInstallPlan {
  const mode = options.bootstrapMode ?? 'all';

  return {
    mode,
    components: resolveBootstrapComponents(mode, options.bootstrapComponents),
  };
}

export function getBootstrapComponentFiles(plan: BootstrapInstallPlan) {
  return getDesignSystemComponentFiles(plan);
}

export function getBootstrapExportLines(plan: BootstrapInstallPlan): string[] {
  return getDesignSystemExportLines(plan);
}

export function getBootstrapComponentStatuses(
  hasFile: (path: string) => boolean,
  plan: BootstrapInstallPlan,
): ReturnType<typeof getDesignSystemComponentStatuses<BootstrapComponentDefinition>> {
  return getDesignSystemComponentStatuses(hasFile, plan);
}

function resolveBootstrapComponents(
  mode: BootstrapMode,
  selectedComponents: string | undefined,
): readonly BootstrapComponentDefinition[] {
  if (mode === 'all') {
    return BOOTSTRAP_COMPONENT_DEFINITIONS;
  }

  const componentNames = parseBootstrapComponentNames(selectedComponents);

  return componentNames.map((componentName) => {
    const definition = getBootstrapComponentDefinition(componentName);

    if (!definition) {
      throw new SchematicsException(`Unsupported Bootstrap component: ${componentName}.`);
    }

    return definition;
  });
}

function parseBootstrapComponentNames(value: string | undefined): BootstrapComponentName[] {
  if (!value?.trim()) {
    throw new SchematicsException(
      'Bootstrap component selection is required when using --bootstrap-mode select.',
    );
  }

  const componentNames = value
    .split(',')
    .map((component) => component.trim().toLowerCase())
    .filter(Boolean);

  const unsupportedComponents = componentNames.filter(
    (componentName) => !BOOTSTRAP_COMPONENT_NAMES.includes(componentName as BootstrapComponentName),
  );

  if (unsupportedComponents.length) {
    throw new SchematicsException(
      `Unsupported Bootstrap component selection: ${unsupportedComponents.join(', ')}.`,
    );
  }

  return [...new Set(componentNames)] as BootstrapComponentName[];
}
