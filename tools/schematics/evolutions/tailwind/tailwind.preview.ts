import { type Tree } from '@angular-devkit/schematics';

import { getEvolutionDependencyRequirements } from '../../evolution/evolution-manifest';
import { type EvolutionOptions } from '../../evolution/schema';
import { createPackageDependenciesPreview } from '../../shared/package-dependency';
import { type EvolutionPreview } from '../evolution-definition';
import { createDesignSystemPreview } from '../design-system/design-system.preview';
import { getPostcssConfigBlockingNotes } from './tailwind.installer';
import { TAILWIND_INDEX_PATH, createTailwindInstallPlan } from './tailwind.plan';

const TAILWIND_DEPENDENCIES = getEvolutionDependencyRequirements('tailwind');

export function getTailwindPreview(options: EvolutionOptions, tree: Tree): EvolutionPreview {
  const plan = createTailwindInstallPlan(options);
  const dependencyPreview = createPackageDependenciesPreview(tree, TAILWIND_DEPENDENCIES);

  return createDesignSystemPreview({
    tree,
    plan,
    indexPath: TAILWIND_INDEX_PATH,
    dependencies: dependencyPreview.dependencies,
    blockingNotes: [...dependencyPreview.blockingNotes, ...getPostcssConfigBlockingNotes(tree)],
    updates: [
      'package.json',
      '.postcssrc.json',
      'src/styles.scss',
      '.angular-enterprise-starter.json',
    ],
    notes: [
      `Tailwind mode: ${plan.mode}.`,
      `Selected components: ${plan.components.map((component) => component.name).join(', ')}.`,
      ...dependencyPreview.notes,
      'Generates starter-owned Angular standalone wrappers under shared/components/tailwind.',
      'Adds Tailwind CSS v4 with PostCSS integration and global CSS import.',
      'Does not modify existing layout or feature templates.',
    ],
  });
}
