import { type SchematicContext, type Tree } from '@angular-devkit/schematics';

import { getEvolutionDependencyRequirements } from '../../evolution/evolution-manifest';
import { type EvolutionOptions } from '../../evolution/schema';
import { ensurePackageDependencies } from '../../shared/package-dependency';
import { type EvolutionDefinition } from '../evolution-definition';
import {
  assertDesignSystemComponentsInstallable,
  installDesignSystemComponents,
  updateDesignSystemIndex,
} from '../design-system/design-system.installer';
import { BOOTSTRAP_INDEX_PATH, createBootstrapInstallPlan } from './bootstrap.plan';

const BOOTSTRAP_DEPENDENCIES = getEvolutionDependencyRequirements('bootstrap');
const BOOTSTRAP_STYLE_IMPORT = "@import 'bootstrap/dist/css/bootstrap.min.css';";

export function installBootstrapEvolution(
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
  options: EvolutionOptions,
): void {
  const plan = createBootstrapInstallPlan(options);

  assertDesignSystemComponentsInstallable({ tree, plan, displayName: 'Bootstrap' });
  ensurePackageDependencies(tree, BOOTSTRAP_DEPENDENCIES);
  addBootstrapStyleImport(tree);
  installDesignSystemComponents({ tree, plan, displayName: 'Bootstrap' });
  updateDesignSystemIndex({ tree, plan, indexPath: BOOTSTRAP_INDEX_PATH });

  context.logger.info(`${definition.label} files created.`);
  context.logger.info('Run npm install to update the package lock before running quality checks.');
}

function addBootstrapStyleImport(tree: Tree): void {
  const stylesPath = '/src/styles.scss';

  if (!tree.exists(stylesPath)) {
    tree.create(stylesPath, `${BOOTSTRAP_STYLE_IMPORT}\n`);
    return;
  }

  const stylesContent = tree.readText(stylesPath);

  if (hasBootstrapImport(stylesContent)) {
    return;
  }

  const nextContent = stylesContent.trim()
    ? `${BOOTSTRAP_STYLE_IMPORT}\n\n${stylesContent}`
    : `${BOOTSTRAP_STYLE_IMPORT}\n`;

  tree.overwrite(stylesPath, nextContent);
}

function hasBootstrapImport(stylesContent: string): boolean {
  return /bootstrap\/(dist\/css\/bootstrap(\.min)?\.css|scss\/bootstrap)/.test(stylesContent);
}
