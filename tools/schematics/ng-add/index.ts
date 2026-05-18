import { type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';

import { validateStarterBaseline } from '../shared/starter-baseline';

export function ngAdd(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    validateStarterBaseline(tree);

    context.logger.info('Angular Enterprise Starter tooling is enabled.');
    context.logger.info(
      'Run `ng generate @filippo/angular-enterprise-starter:evolution` to add an evolution.',
    );

    return tree;
  };
}
