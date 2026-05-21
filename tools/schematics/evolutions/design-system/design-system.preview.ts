import { type Tree } from '@angular-devkit/schematics';

import { type EvolutionPreview } from '../evolution-definition';
import {
  type DesignSystemComponentDefinition,
  type DesignSystemInstallPlan,
} from './design-system.model';
import { getDesignSystemComponentStatuses, getDesignSystemExportLines } from './design-system.plan';

export interface CreateDesignSystemPreviewOptions<
  TComponent extends DesignSystemComponentDefinition = DesignSystemComponentDefinition,
> {
  readonly tree: Tree;
  readonly plan: DesignSystemInstallPlan<string, TComponent>;
  readonly indexPath: string;
  readonly dependencies: readonly string[];
  readonly updates: readonly string[];
  readonly notes: readonly string[];
}

export function createDesignSystemPreview<TComponent extends DesignSystemComponentDefinition>({
  tree,
  plan,
  indexPath,
  dependencies,
  updates,
  notes,
}: CreateDesignSystemPreviewOptions<TComponent>): EvolutionPreview {
  const componentStatuses = getDesignSystemComponentStatuses((path) => tree.exists(path), plan);
  const missingComponentStatuses = componentStatuses.filter(
    (componentStatus) => componentStatus.status === 'missing',
  );
  const completeComponentStatuses = componentStatuses.filter(
    (componentStatus) => componentStatus.status === 'complete',
  );
  const partialComponentStatuses = componentStatuses.filter(
    (componentStatus) => componentStatus.status === 'partial',
  );
  const indexExists = tree.exists(indexPath);
  const missingExportLines = getMissingExportLines(tree, indexPath, plan);

  const creates = [
    ...missingComponentStatuses.flatMap((componentStatus) =>
      componentStatus.missingFiles.map((file) => file.path),
    ),
    ...(indexExists ? [] : [indexPath]),
  ].map(toDisplayPath);

  return {
    dependencies,
    creates,
    updates: [
      ...updates,
      ...(indexExists && missingExportLines.length ? [toDisplayPath(indexPath)] : []),
    ],
    existing: createExistingNotes(completeComponentStatuses),
    blockingNotes: createBlockingNotes(partialComponentStatuses),
    notes: [...notes, ...createSkippedNotes(completeComponentStatuses)],
  };
}

function getMissingExportLines<TComponent extends DesignSystemComponentDefinition>(
  tree: Tree,
  indexPath: string,
  plan: DesignSystemInstallPlan<string, TComponent>,
): readonly string[] {
  if (!tree.exists(indexPath)) {
    return getDesignSystemExportLines(plan);
  }

  const indexContent = tree.readText(indexPath);

  return getDesignSystemExportLines(plan).filter(
    (exportLine) => !indexContent.includes(exportLine),
  );
}

function createExistingNotes<TComponent extends DesignSystemComponentDefinition>(
  completeComponentStatuses: ReturnType<typeof getDesignSystemComponentStatuses<TComponent>>,
): string[] {
  return completeComponentStatuses.map(
    (componentStatus) =>
      `${componentStatus.component.label} already installed; apply will skip it.`,
  );
}

function createSkippedNotes<TComponent extends DesignSystemComponentDefinition>(
  completeComponentStatuses: ReturnType<typeof getDesignSystemComponentStatuses<TComponent>>,
): string[] {
  if (!completeComponentStatuses.length) {
    return [];
  }

  return [
    `Already installed components will be skipped: ${completeComponentStatuses
      .map((componentStatus) => componentStatus.component.name)
      .join(', ')}.`,
  ];
}

function createBlockingNotes<TComponent extends DesignSystemComponentDefinition>(
  partialComponentStatuses: ReturnType<typeof getDesignSystemComponentStatuses<TComponent>>,
): string[] {
  return partialComponentStatuses.map((componentStatus) => {
    const existingPaths = componentStatus.existingFiles.map((file) => toDisplayPath(file.path));
    const missingPaths = componentStatus.missingFiles.map((file) => toDisplayPath(file.path));

    return `${componentStatus.component.label} is partially installed. Existing: ${existingPaths.join(
      ', ',
    )}. Missing: ${missingPaths.join(', ')}.`;
  });
}

function toDisplayPath(path: string): string {
  return path.replace(/^\//, '');
}
