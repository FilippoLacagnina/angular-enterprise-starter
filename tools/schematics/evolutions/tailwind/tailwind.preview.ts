import { type Tree } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import { type EvolutionPreview } from '../evolution-definition';
import { createDesignSystemPreview } from '../design-system/design-system.preview';
import { TAILWIND_INDEX_PATH, createTailwindInstallPlan } from './tailwind.plan';

export function getTailwindPreview(options: EvolutionOptions, tree: Tree): EvolutionPreview {
  const plan = createTailwindInstallPlan(options);

  return createDesignSystemPreview({
    tree,
    plan,
    indexPath: TAILWIND_INDEX_PATH,
    dependencies: ['tailwindcss', '@tailwindcss/postcss', 'postcss'],
    updates: [
      'package.json',
      '.postcssrc.json',
      'src/styles.scss',
      '.angular-enterprise-starter.json',
    ],
    notes: [
      `Tailwind mode: ${plan.mode}.`,
      `Selected components: ${plan.components.map((component) => component.name).join(', ')}.`,
      'Generates starter-owned Angular standalone wrappers under shared/components/tailwind.',
      'Adds Tailwind CSS v4 with PostCSS integration and global CSS import.',
      'Does not modify existing layout or feature templates.',
    ],
  });
}
