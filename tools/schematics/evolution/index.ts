import {
  type Rule,
  type SchematicContext,
  SchematicsException,
  type Tree,
} from '@angular-devkit/schematics';

import {
  type EvolutionDefinition,
  type EvolutionPreview,
  EvolutionUserActionRequiredError,
} from '../evolutions/evolution-definition';
import { getEvolutionDefinition } from '../evolutions/evolution-registry';
import {
  readStarterMetadata,
  validateStarterBaseline,
  writeStarterMetadata,
} from '../shared/starter-baseline';
import { type EvolutionOptions } from './schema';

const color = {
  bold: (value: string) => `\x1b[1m${value}\x1b[0m`,
  cyan: (value: string) => `\x1b[36m${value}\x1b[0m`,
  dim: (value: string) => `\x1b[2m${value}\x1b[0m`,
  green: (value: string) => `\x1b[32m${value}\x1b[0m`,
};

export function evolution(options: EvolutionOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    validateStarterBaseline(tree);

    const metadata = readStarterMetadata(tree);
    const definition = getEvolutionDefinition(options.name);
    const isAlreadyEnabled = metadata.enabledEvolutions.includes(options.name);

    if (isAlreadyEnabled && !definition.repeatable) {
      throw new SchematicsException(`Evolution "${options.name}" is already enabled.`);
    }

    if (options.preview) {
      printEvolutionPreview(context, definition, options, tree);
      return tree;
    }

    try {
      definition.install?.(tree, context, definition, options);
    } catch (error) {
      if (error instanceof EvolutionUserActionRequiredError) {
        throw error;
      }

      throw createEvolutionInstallException(definition, error);
    }

    writeStarterMetadata(tree, {
      ...metadata,
      enabledEvolutions: isAlreadyEnabled
        ? metadata.enabledEvolutions
        : [...metadata.enabledEvolutions, definition.name].sort(),
    });

    context.logger.info(`Selected evolution: ${definition.label}`);
    context.logger.info(`Evolution "${definition.name}" has been registered in starter metadata.`);

    if (!definition.install) {
      context.logger.info(
        'File generation will be implemented after the pilot evolution is finalized.',
      );
    }

    return tree;
  };
}

function printEvolutionPreview(
  context: SchematicContext,
  definition: EvolutionDefinition,
  options: EvolutionOptions,
  tree: Tree,
): void {
  const preview = resolveEvolutionPreview(definition, options, tree);

  printPreviewLine(color.bold('Evolution preview'));
  printKeyValue('Evolution', definition.label);
  printPreviewLine('');
  printSection('Dependencies', preview.dependencies);
  printSection('Files to create', preview.creates);
  printSection('Files to update', preview.updates);
  printOptionalSection('Files to delete', preview.deletes);
  printOptionalSection('Existing files detected', preview.existing);
  printOptionalSection('Blocking notes', preview.blockingNotes);
  printSection('Notes', preview.notes);
  printPreviewLine(color.green('No files were changed because preview mode is enabled.'));

  context.logger.info('');
}

function resolveEvolutionPreview(
  definition: EvolutionDefinition,
  options: EvolutionOptions,
  tree: Tree,
): EvolutionPreview {
  return (
    definition.preview?.(options, tree) ?? {
      dependencies: definition.dependencies,
      creates: definition.creates,
      updates: definition.updates,
      notes: definition.notes,
    }
  );
}

function printOptionalSection(title: string, values: readonly string[] | undefined): void {
  if (!values?.length) {
    return;
  }

  printSection(title, values);
}

function createEvolutionInstallException(
  definition: EvolutionDefinition,
  error: unknown,
): SchematicsException {
  const reason = error instanceof Error ? error.message : String(error);

  const referenceBranchHelp =
    definition.referenceBranch && definition.referenceUrl
      ? `
You can still inspect or merge the reference evolution branch manually.

Branch:
${definition.referenceBranch}

GitHub:
${definition.referenceUrl}

Suggested manual flow:
git fetch origin
git merge origin/${definition.referenceBranch}`
      : `
Review the reported reason and restore a compatible starter baseline before retrying.`;

  return new SchematicsException(`Unable to safely install the ${definition.label} evolution.

Reason:
- ${reason}
${referenceBranchHelp}`);
}

function printSection(title: string, values: readonly string[]): void {
  printPreviewLine(color.cyan(title));

  if (values.length === 0) {
    printPreviewLine(`${color.dim('-')} ${color.dim('none')}`);
    printPreviewLine('');
    return;
  }

  for (const value of values) {
    printPreviewLine(`${color.dim('-')} ${color.bold(value)}`);
  }

  printPreviewLine('');
}

function printKeyValue(key: string, value: string): void {
  printPreviewLine(`${color.dim(key)} ${color.bold(value)}`);
}

function printPreviewLine(value: string): void {
  if (process.env['VITEST']) {
    return;
  }

  process.stdout.write(`    ${value}\n`);
}
