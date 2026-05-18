import {
  type Rule,
  type SchematicContext,
  SchematicsException,
  type Tree,
} from '@angular-devkit/schematics';

import {
  readStarterMetadata,
  validateStarterBaseline,
  writeStarterMetadata,
} from '../shared/starter-baseline';
import { getEvolutionDefinition } from '../evolutions/evolution-registry';
import { type EvolutionOptions } from './schema';

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

    definition.install?.(tree, context, definition);

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

function printEvolutionPreview(
  context: SchematicContext,
  definition: ReturnType<typeof getEvolutionDefinition>,
): void {
  context.logger.info(`Evolution preview: ${definition.label}`);
  printSection(context, 'Dependencies', definition.dependencies);
  printSection(context, 'Files to create', definition.creates);
  printSection(context, 'Files to update', definition.updates);
  printSection(context, 'Notes', definition.notes);
  context.logger.info('No files were changed because preview mode is enabled.');
}

function printSection(context: SchematicContext, title: string, values: readonly string[]): void {
  context.logger.info(`${title}:`);

  if (values.length === 0) {
    context.logger.info('- none');
    return;
  }

  for (const value of values) {
    context.logger.info(`- ${value}`);
  }
}
