import { SchematicsException, type SchematicContext, type Tree } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import { type EvolutionDefinition } from '../evolution-definition';
import {
  installDesignSystemComponents,
  updateDesignSystemIndex,
} from '../design-system/design-system.installer';
import { BOOTSTRAP_INDEX_PATH, createBootstrapInstallPlan } from './bootstrap.plan';

const BOOTSTRAP_VERSION = '^5.3.8';
const BOOTSTRAP_STYLE_IMPORT = "@import 'bootstrap/dist/css/bootstrap.min.css';";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export function installBootstrapEvolution(
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
  options: EvolutionOptions,
): void {
  const plan = createBootstrapInstallPlan(options);

  addPackageDependency(tree, 'bootstrap', BOOTSTRAP_VERSION);
  addBootstrapStyleImport(tree);
  installDesignSystemComponents({ tree, plan, displayName: 'Bootstrap' });
  updateDesignSystemIndex({ tree, plan, indexPath: BOOTSTRAP_INDEX_PATH });

  context.logger.info(`${definition.label} files created.`);
  context.logger.info('Run npm install to update the package lock before running quality checks.');
}

function addPackageDependency(tree: Tree, packageName: string, version: string): void {
  const packageJsonPath = '/package.json';

  if (!tree.exists(packageJsonPath)) {
    throw new SchematicsException('Missing package.json. Cannot add Bootstrap dependency.');
  }

  const packageJson = JSON.parse(tree.readText(packageJsonPath)) as PackageJson;

  if (packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName]) {
    return;
  }

  packageJson.dependencies = sortObject({
    ...packageJson.dependencies,
    [packageName]: version,
  });

  tree.overwrite(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
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

function sortObject(value: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).sort(([first], [second]) => first.localeCompare(second)),
  );
}
