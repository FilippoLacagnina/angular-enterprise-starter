import { SchematicsException } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import {
  type TailwindComponentDefinition,
  type TailwindComponentName,
  type TailwindInstallPlan,
  type TailwindMode,
} from './tailwind.model';
import {
  getDesignSystemComponentFiles,
  getDesignSystemComponentStatuses,
  getDesignSystemExportLines,
} from '../design-system/design-system.plan';
import {
  getTailwindComponentDefinition,
  TAILWIND_COMPONENT_DEFINITIONS,
  TAILWIND_COMPONENT_NAMES,
} from './tailwind.registry';

export const TAILWIND_INDEX_PATH = '/src/app/shared/components/tailwind/index.ts';

export function createTailwindInstallPlan(options: EvolutionOptions): TailwindInstallPlan {
  const mode = options.tailwindMode ?? 'all';

  return {
    mode,
    components: resolveTailwindComponents(mode, options.tailwindComponents),
  };
}

export function getTailwindComponentFiles(plan: TailwindInstallPlan) {
  return getDesignSystemComponentFiles(plan);
}

export function getTailwindExportLines(plan: TailwindInstallPlan): string[] {
  return getDesignSystemExportLines(plan);
}

export function getTailwindComponentStatuses(
  hasFile: (path: string) => boolean,
  plan: TailwindInstallPlan,
): ReturnType<typeof getDesignSystemComponentStatuses<TailwindComponentDefinition>> {
  return getDesignSystemComponentStatuses(hasFile, plan);
}

function resolveTailwindComponents(
  mode: TailwindMode,
  selectedComponents: string | undefined,
): readonly TailwindComponentDefinition[] {
  if (mode === 'all') {
    return TAILWIND_COMPONENT_DEFINITIONS;
  }

  const componentNames = parseTailwindComponentNames(selectedComponents);

  return componentNames.map((componentName) => {
    const definition = getTailwindComponentDefinition(componentName);

    if (!definition) {
      throw new SchematicsException(`Unsupported Tailwind component: ${componentName}.`);
    }

    return definition;
  });
}

function parseTailwindComponentNames(value: string | undefined): TailwindComponentName[] {
  if (!value?.trim()) {
    throw new SchematicsException(
      'Tailwind component selection is required when using --tailwind-mode select.',
    );
  }

  const componentNames = value
    .split(',')
    .map((component) => component.trim().toLowerCase())
    .filter(Boolean);

  const unsupportedComponents = componentNames.filter(
    (componentName) => !TAILWIND_COMPONENT_NAMES.includes(componentName as TailwindComponentName),
  );

  if (unsupportedComponents.length) {
    throw new SchematicsException(
      `Unsupported Tailwind component selection: ${unsupportedComponents.join(', ')}.`,
    );
  }

  return [...new Set(componentNames)] as TailwindComponentName[];
}
