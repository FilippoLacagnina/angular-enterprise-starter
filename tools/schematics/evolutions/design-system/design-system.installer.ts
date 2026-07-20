import { type Tree } from '@angular-devkit/schematics';

import { EvolutionUserActionRequiredError } from '../evolution-definition';
import {
  type DesignSystemComponentDefinition,
  type DesignSystemInstallPlan,
} from './design-system.model';
import { getDesignSystemComponentStatuses, getDesignSystemExportLines } from './design-system.plan';

export interface InstallDesignSystemComponentsOptions<
  TComponent extends DesignSystemComponentDefinition = DesignSystemComponentDefinition,
> {
  readonly tree: Tree;
  readonly plan: DesignSystemInstallPlan<string, TComponent>;
  readonly displayName: string;
}

export interface UpdateDesignSystemIndexOptions<
  TComponent extends DesignSystemComponentDefinition = DesignSystemComponentDefinition,
> {
  readonly tree: Tree;
  readonly plan: DesignSystemInstallPlan<string, TComponent>;
  readonly indexPath: string;
}

export function installDesignSystemComponents<TComponent extends DesignSystemComponentDefinition>({
  tree,
  plan,
  displayName,
}: InstallDesignSystemComponentsOptions<TComponent>): void {
  assertDesignSystemComponentsInstallable({ tree, plan, displayName });

  const componentStatuses = getDesignSystemComponentStatuses((path) => tree.exists(path), plan);

  for (const componentStatus of componentStatuses) {
    if (componentStatus.status === 'complete') {
      continue;
    }

    for (const file of componentStatus.missingFiles) {
      tree.create(file.path, file.content);
    }
  }
}

export function assertDesignSystemComponentsInstallable<
  TComponent extends DesignSystemComponentDefinition,
>({ tree, plan, displayName }: InstallDesignSystemComponentsOptions<TComponent>): void {
  const componentStatuses = getDesignSystemComponentStatuses((path) => tree.exists(path), plan);
  const partiallyInstalledComponents = componentStatuses.filter(
    (componentStatus) => componentStatus.status === 'partial',
  );

  if (partiallyInstalledComponents.length) {
    throw new EvolutionUserActionRequiredError(
      `${displayName} component installation is incomplete: ${partiallyInstalledComponents
        .map((componentStatus) => {
          const existingPaths = componentStatus.existingFiles.map((file) =>
            toDisplayPath(file.path),
          );
          const missingPaths = componentStatus.missingFiles.map((file) => toDisplayPath(file.path));

          return `${componentStatus.component.label} has existing files (${existingPaths.join(
            ', ',
          )}) and missing files (${missingPaths.join(', ')})`;
        })
        .join('; ')}.`,
    );
  }
}

export function updateDesignSystemIndex<TComponent extends DesignSystemComponentDefinition>({
  tree,
  plan,
  indexPath,
}: UpdateDesignSystemIndexOptions<TComponent>): void {
  const exportLines = getDesignSystemExportLines(plan);

  if (!tree.exists(indexPath)) {
    tree.create(indexPath, `${exportLines.join('\n')}\n`);
    return;
  }

  const indexContent = tree.readText(indexPath);
  const missingExportLines = exportLines.filter((exportLine) => !indexContent.includes(exportLine));

  if (!missingExportLines.length) {
    return;
  }

  const nextContent = indexContent.endsWith('\n') ? indexContent : `${indexContent}\n`;

  tree.overwrite(indexPath, `${nextContent}${missingExportLines.join('\n')}\n`);
}

function toDisplayPath(path: string): string {
  return path.replace(/^\//, '');
}
