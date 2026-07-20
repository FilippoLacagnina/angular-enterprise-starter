import { type SchematicContext, type Tree } from '@angular-devkit/schematics';

import { getEvolutionDependencyRequirements } from '../../evolution/evolution-manifest';
import { type EvolutionOptions } from '../../evolution/schema';
import { ensurePackageDependencies } from '../../shared/package-dependency';
import {
  type EvolutionDefinition,
  EvolutionUserActionRequiredError,
} from '../evolution-definition';
import {
  assertDesignSystemComponentsInstallable,
  installDesignSystemComponents,
  updateDesignSystemIndex,
} from '../design-system/design-system.installer';
import { TAILWIND_INDEX_PATH, createTailwindInstallPlan } from './tailwind.plan';

const TAILWIND_DEPENDENCIES = getEvolutionDependencyRequirements('tailwind');
const TAILWIND_STYLE_IMPORT = "@use 'tailwindcss';";
const POSTCSS_CONFIG_PATH = '/.postcssrc.json';

export function installTailwindEvolution(
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
  options: EvolutionOptions,
): void {
  const plan = createTailwindInstallPlan(options);

  assertDesignSystemComponentsInstallable({ tree, plan, displayName: 'Tailwind' });
  assertPostcssConfigCompatible(tree);
  ensurePackageDependencies(tree, TAILWIND_DEPENDENCIES);
  createPostcssConfig(tree);
  addTailwindStyleImport(tree);
  installDesignSystemComponents({ tree, plan, displayName: 'Tailwind' });
  updateDesignSystemIndex({ tree, plan, indexPath: TAILWIND_INDEX_PATH });

  context.logger.info(`${definition.label} files created.`);
  context.logger.info('Run npm install to update the package lock before running quality checks.');
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

export function getPostcssConfigBlockingNotes(tree: Tree): string[] {
  if (!tree.exists(POSTCSS_CONFIG_PATH)) {
    return [];
  }

  try {
    const postcssConfig = JSON.parse(tree.readText(POSTCSS_CONFIG_PATH)) as unknown;

    if (!isRecord(postcssConfig)) {
      return ['.postcssrc.json must contain a JSON object.'];
    }

    if (postcssConfig['plugins'] !== undefined && !isRecord(postcssConfig['plugins'])) {
      return ['.postcssrc.json plugins must be a JSON object.'];
    }

    return [];
  } catch {
    return ['.postcssrc.json contains invalid JSON.'];
  }
}

function assertPostcssConfigCompatible(tree: Tree): void {
  const blockingNotes = getPostcssConfigBlockingNotes(tree);

  if (blockingNotes.length) {
    throw new EvolutionUserActionRequiredError(blockingNotes.join('\n'));
  }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
