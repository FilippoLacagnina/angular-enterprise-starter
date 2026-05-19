import {
  type Rule,
  type SchematicContext,
  SchematicsException,
  type Tree,
} from '@angular-devkit/schematics';

import { type EvolutionDefinition } from '../evolutions/evolution-definition';
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

    if (metadata.enabledEvolutions.includes(options.name)) {
      throw new SchematicsException(`Evolution "${options.name}" is already enabled.`);
    }

    const definition = getEvolutionDefinition(options.name);

    if (options.preview) {
      printEvolutionPreview(context, definition);
      return tree;
    }

    try {
      definition.install?.(tree, context, definition);
    } catch (error) {
      throw createEvolutionInstallException(definition, error);
    }

    writeStarterMetadata(tree, {
      ...metadata,
      enabledEvolutions: [...metadata.enabledEvolutions, definition.name].sort(),
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

function printEvolutionPreview(context: SchematicContext, definition: EvolutionDefinition): void {
  printPreviewLine(color.bold('Evolution preview'));
  printKeyValue('Evolution', definition.label);
  printPreviewLine('');
  printSection('Dependencies', definition.dependencies);
  printSection('Files to create', definition.creates);
  printSection('Files to update', definition.updates);
  printSection('Notes', definition.notes);
  printPreviewLine(color.green('No files were changed because preview mode is enabled.'));

  context.logger.info('');
}

function createEvolutionInstallException(
  definition: EvolutionDefinition,
  error: unknown,
): SchematicsException {
  const reason = error instanceof Error ? error.message : String(error);

  return new SchematicsException(`Unable to safely install the ${definition.label} evolution.

Reason:
- ${reason}

You can still inspect or merge the reference evolution branch manually.

Branch:
${definition.referenceBranch}

GitHub:
${definition.referenceUrl}

Suggested manual flow:
git fetch origin
git merge origin/${definition.referenceBranch}`);
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
