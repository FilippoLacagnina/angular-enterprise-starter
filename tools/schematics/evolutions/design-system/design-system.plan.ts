import {
  type DesignSystemComponentDefinition,
  type DesignSystemComponentStatus,
  type DesignSystemInstallPlan,
} from './design-system.model';

export function getDesignSystemComponentFiles<TComponent extends DesignSystemComponentDefinition>(
  plan: DesignSystemInstallPlan<string, TComponent>,
) {
  return plan.components.flatMap((component) => component.files);
}

export function getDesignSystemExportLines<TComponent extends DesignSystemComponentDefinition>(
  plan: DesignSystemInstallPlan<string, TComponent>,
): string[] {
  return plan.components
    .map((component) => `export { ${component.className} } from '${component.exportPath}';`)
    .sort((first, second) => first.localeCompare(second));
}

export function getDesignSystemComponentStatuses<
  TComponent extends DesignSystemComponentDefinition,
>(
  hasFile: (path: string) => boolean,
  plan: DesignSystemInstallPlan<string, TComponent>,
): readonly DesignSystemComponentStatus<TComponent>[] {
  return plan.components.map((component) => {
    const existingFiles = component.files.filter((file) => hasFile(file.path));
    const missingFiles = component.files.filter((file) => !hasFile(file.path));

    return {
      component,
      existingFiles,
      missingFiles,
      status: resolveDesignSystemComponentStatus(existingFiles.length, missingFiles.length),
    };
  });
}

function resolveDesignSystemComponentStatus(
  existingFileCount: number,
  missingFileCount: number,
): DesignSystemComponentStatus['status'] {
  if (existingFileCount === 0) {
    return 'missing';
  }

  if (missingFileCount === 0) {
    return 'complete';
  }

  return 'partial';
}
