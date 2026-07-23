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
const BOOTSTRAP_STYLE_DIRECTIVE = "@use 'bootstrap/dist/css/bootstrap.min.css';";

export function installBootstrapEvolution(
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
  options: EvolutionOptions,
): void {
  const plan = createBootstrapInstallPlan(options);

  assertDesignSystemComponentsInstallable({ tree, plan, displayName: 'Bootstrap' });
  ensurePackageDependencies(tree, BOOTSTRAP_DEPENDENCIES);
  addBootstrapStyleDirective(tree);
  installDesignSystemComponents({ tree, plan, displayName: 'Bootstrap' });
  updateDesignSystemIndex({ tree, plan, indexPath: BOOTSTRAP_INDEX_PATH });

  context.logger.info(`${definition.label} files created.`);
  context.logger.info('Run npm install to update the package lock before running quality checks.');
}

function addBootstrapStyleDirective(tree: Tree): void {
  const stylesPath = '/src/styles.scss';

  if (!tree.exists(stylesPath)) {
    tree.create(stylesPath, `${BOOTSTRAP_STYLE_DIRECTIVE}\n`);
    return;
  }

  const stylesContent = tree.readText(stylesPath);

  if (hasBootstrapStyleReference(stylesContent)) {
    return;
  }

  const nextContent = stylesContent.trim()
    ? `${BOOTSTRAP_STYLE_DIRECTIVE}\n\n${stylesContent}`
    : `${BOOTSTRAP_STYLE_DIRECTIVE}\n`;

  tree.overwrite(stylesPath, nextContent);
}

function hasBootstrapStyleReference(stylesContent: string): boolean {
  return /bootstrap\/(dist\/css\/bootstrap(\.min)?\.css|scss\/bootstrap)/.test(stylesContent);
}
