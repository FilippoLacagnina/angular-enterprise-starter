import {
  type DesignSystemComponentDefinition,
  type DesignSystemComponentStatus,
  type DesignSystemInstallPlan,
} from './design-system.model';

export function getDesignSystemComponentFiles<TComponent extends DesignSystemComponentDefinition>(
  plan: DesignSystemInstallPlan<string, TComponent>,
) {
  return plan.components.flatMap((component) => [
    ...component.files,
    ...(component.supplementalFiles ?? []),
  ]);
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
    const supplementalFiles = component.supplementalFiles ?? [];
    const existingRequiredFiles = component.files.filter((file) => hasFile(file.path));
    const missingRequiredFiles = component.files.filter((file) => !hasFile(file.path));
    const existingSupplementalFiles = supplementalFiles.filter((file) => hasFile(file.path));
    const missingSupplementalFiles = supplementalFiles.filter((file) => !hasFile(file.path));

    return {
      component,
      existingFiles: [...existingRequiredFiles, ...existingSupplementalFiles],
      missingFiles: [...missingRequiredFiles, ...missingSupplementalFiles],
      existingRequiredFiles,
      missingRequiredFiles,
      existingSupplementalFiles,
      missingSupplementalFiles,
      status: resolveDesignSystemComponentStatus(
        existingRequiredFiles.length,
        missingRequiredFiles.length,
        existingSupplementalFiles.length,
      ),
    };
  });
}

function resolveDesignSystemComponentStatus(
  existingRequiredFileCount: number,
  missingRequiredFileCount: number,
  existingSupplementalFileCount: number,
): DesignSystemComponentStatus['status'] {
  if (existingRequiredFileCount === 0 && existingSupplementalFileCount === 0) {
    return 'missing';
  }

  if (missingRequiredFileCount === 0) {
    return 'complete';
  }

  return 'partial';
}
