import { type Tree } from '@angular-devkit/schematics';

import { getEvolutionDependencyRequirements } from '../../evolution/evolution-manifest';
import { type EvolutionOptions } from '../../evolution/schema';
import { createPackageDependenciesPreview } from '../../shared/package-dependency';
import { type EvolutionPreview } from '../evolution-definition';
import { createDesignSystemPreview } from '../design-system/design-system.preview';
import { BOOTSTRAP_INDEX_PATH, createBootstrapInstallPlan } from './bootstrap.plan';

const BOOTSTRAP_DEPENDENCIES = getEvolutionDependencyRequirements('bootstrap');

export function getBootstrapPreview(options: EvolutionOptions, tree: Tree): EvolutionPreview {
  const plan = createBootstrapInstallPlan(options);
  const dependencyPreview = createPackageDependenciesPreview(tree, BOOTSTRAP_DEPENDENCIES);

  return createDesignSystemPreview({
    tree,
    plan,
    indexPath: BOOTSTRAP_INDEX_PATH,
    dependencies: dependencyPreview.dependencies,
    blockingNotes: dependencyPreview.blockingNotes,
    updates: ['package.json', 'src/styles.scss', '.angular-enterprise-starter.json'],
    notes: [
      `Bootstrap mode: ${plan.mode}.`,
      `Selected components: ${plan.components.map((component) => component.name).join(', ')}.`,
      ...dependencyPreview.notes,
      'Generates starter-owned Angular standalone wrappers under shared/components/bootstrap.',
      'Does not modify existing layout or feature templates.',
    ],
  });
}
