import { SchematicsException, type SchematicContext, type Tree } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import { type EvolutionDefinition } from '../evolution-definition';
import {
  installDesignSystemComponents,
  updateDesignSystemIndex,
} from '../design-system/design-system.installer';
import { TAILWIND_INDEX_PATH, createTailwindInstallPlan } from './tailwind.plan';

const TAILWIND_VERSION = '^4.3.0';
const TAILWIND_POSTCSS_VERSION = '^4.3.0';
const POSTCSS_VERSION = '^8.5.14';
const TAILWIND_STYLE_IMPORT = "@use 'tailwindcss';";
const POSTCSS_CONFIG_PATH = '/.postcssrc.json';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export function installTailwindEvolution(
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
  options: EvolutionOptions,
): void {
  const plan = createTailwindInstallPlan(options);

  addDevPackageDependency(tree, 'tailwindcss', TAILWIND_VERSION);
  addDevPackageDependency(tree, '@tailwindcss/postcss', TAILWIND_POSTCSS_VERSION);
  addDevPackageDependency(tree, 'postcss', POSTCSS_VERSION);
  createPostcssConfig(tree);
  addTailwindStyleImport(tree);
  installDesignSystemComponents({ tree, plan, displayName: 'Tailwind' });
  updateDesignSystemIndex({ tree, plan, indexPath: TAILWIND_INDEX_PATH });

  context.logger.info(`${definition.label} files created.`);
  context.logger.info('Run npm install to update the package lock before running quality checks.');
}

function addDevPackageDependency(tree: Tree, packageName: string, version: string): void {
  const packageJsonPath = '/package.json';

  if (!tree.exists(packageJsonPath)) {
    throw new SchematicsException('Missing package.json. Cannot add Tailwind dependency.');
  }

  const packageJson = JSON.parse(tree.readText(packageJsonPath)) as PackageJson;

  if (packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName]) {
    return;
  }

  packageJson.devDependencies = sortObject({
    ...packageJson.devDependencies,
    [packageName]: version,
  });

  tree.overwrite(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function createPostcssConfig(tree: Tree): void {
  const postcssConfigContent = `${JSON.stringify(
    {
      plugins: {
        '@tailwindcss/postcss': {},
      },
    },
    null,
    2,
  )}\n`;

  if (!tree.exists(POSTCSS_CONFIG_PATH)) {
    tree.create(POSTCSS_CONFIG_PATH, postcssConfigContent);
    return;
  }

  const postcssConfig = JSON.parse(tree.readText(POSTCSS_CONFIG_PATH)) as {
    plugins?: Record<string, unknown>;
  };

  if (postcssConfig.plugins?.['@tailwindcss/postcss']) {
    return;
  }

  tree.overwrite(
    POSTCSS_CONFIG_PATH,
    `${JSON.stringify(
      {
        ...postcssConfig,
        plugins: {
          ...postcssConfig.plugins,
          '@tailwindcss/postcss': {},
        },
      },
      null,
      2,
    )}\n`,
  );
}

function addTailwindStyleImport(tree: Tree): void {
  const stylesPath = '/src/styles.scss';

  if (!tree.exists(stylesPath)) {
    tree.create(stylesPath, `${TAILWIND_STYLE_IMPORT}\n`);
    return;
  }

  const stylesContent = tree.readText(stylesPath);

  if (hasTailwindImport(stylesContent)) {
    return;
  }

  const nextContent = stylesContent.trim()
    ? `${TAILWIND_STYLE_IMPORT}\n\n${stylesContent}`
    : `${TAILWIND_STYLE_IMPORT}\n`;

  tree.overwrite(stylesPath, nextContent);
}

function hasTailwindImport(stylesContent: string): boolean {
  return /(@use|@import)\s+['"]tailwindcss['"]/.test(stylesContent);
}

function sortObject(value: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).sort(([first], [second]) => first.localeCompare(second)),
  );
}
