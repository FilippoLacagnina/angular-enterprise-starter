import { type SchematicContext, type Tree } from '@angular-devkit/schematics';

import {
  type EvolutionDefinition,
  EvolutionUserActionRequiredError,
} from '../evolution-definition';
import { APP_SPEC_PATH, inspectLayoutShellBaseline } from './layout-shell.baseline';
import { type LayoutShellEvolutionOptions } from './layout-shell.model';
import { createLayoutShellInstallPlan } from './layout-shell.plan';
import {
  createContentOnlyAppFiles,
  createLayoutShellGeneratedFiles,
  type LayoutGeneratedFile,
} from './layout-shell.templates';

export function installLayoutShellEvolution(
  tree: Tree,
  _context: SchematicContext,
  _definition: EvolutionDefinition,
  options: LayoutShellEvolutionOptions,
): void {
  const plan = createLayoutShellInstallPlan(options);
  const inspection = inspectLayoutShellBaseline(tree, plan);

  if (inspection.blockingNotes.length > 0) {
    throw new EvolutionUserActionRequiredError(
      `Layout Shell preflight failed:\n- ${inspection.blockingNotes.join('\n- ')}`,
    );
  }

  const generatedFiles =
    plan.mode === 'content-only'
      ? createContentOnlyAppFiles(tree.exists(APP_SPEC_PATH))
      : createLayoutShellGeneratedFiles(plan);

  for (const file of generatedFiles) {
    writeGeneratedFile(tree, file);
  }

  for (const path of inspection.deletes) {
    tree.delete(path);
  }
}

function writeGeneratedFile(tree: Tree, file: LayoutGeneratedFile): void {
  if (tree.exists(file.path)) {
    tree.overwrite(file.path, file.content);
    return;
  }

  tree.create(file.path, file.content);
}
