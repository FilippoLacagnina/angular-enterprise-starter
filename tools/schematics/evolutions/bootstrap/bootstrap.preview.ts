import { type Tree } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import { type EvolutionPreview } from '../evolution-definition';
import { createDesignSystemPreview } from '../design-system/design-system.preview';
import { BOOTSTRAP_INDEX_PATH, createBootstrapInstallPlan } from './bootstrap.plan';

export function getBootstrapPreview(options: EvolutionOptions, tree: Tree): EvolutionPreview {
  const plan = createBootstrapInstallPlan(options);

  return createDesignSystemPreview({
    tree,
    plan,
    indexPath: BOOTSTRAP_INDEX_PATH,
    dependencies: ['bootstrap'],
    updates: ['package.json', 'src/styles.scss', '.angular-enterprise-starter.json'],
    notes: [
      `Bootstrap mode: ${plan.mode}.`,
      `Selected components: ${plan.components.map((component) => component.name).join(', ')}.`,
      'Generates starter-owned Angular standalone wrappers under shared/components/bootstrap.',
      'Does not modify existing layout or feature templates.',
    ],
  });
}
