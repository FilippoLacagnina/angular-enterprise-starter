import { type Tree } from '@angular-devkit/schematics';

import { type EvolutionPreview } from '../evolution-definition';
import { inspectLayoutShellBaseline } from './layout-shell.baseline';
import { type LayoutShellEvolutionOptions } from './layout-shell.model';
import { createLayoutShellInstallPlan } from './layout-shell.plan';

export function getLayoutShellPreview(
  options: LayoutShellEvolutionOptions,
  tree: Tree,
): EvolutionPreview {
  const plan = createLayoutShellInstallPlan(options);
  const inspection = inspectLayoutShellBaseline(tree, plan);

  return {
    dependencies: [],
    creates: inspection.creates.map(toDisplayPath),
    updates: [...inspection.updates.map(toDisplayPath), '.angular-enterprise-starter.json'],
    deletes: inspection.deletes.map(toDisplayPath),
    existing: inspection.existing.map(toDisplayPath),
    blockingNotes: inspection.blockingNotes,
    notes: [
      `Uses the ${plan.mode} layout selection mode.`,
      plan.components.length > 0
        ? `Installs layout components: ${plan.components.join(', ')}.`
        : 'Uses RouterOutlet directly without application layout components.',
      'Keeps layout behavior independent from Bootstrap, Tailwind and other design systems.',
      'Preserves customized or partially present layout files by blocking automatic changes.',
    ],
  };
}

function toDisplayPath(path: string): string {
  return path.replace(/^\//, '');
}
