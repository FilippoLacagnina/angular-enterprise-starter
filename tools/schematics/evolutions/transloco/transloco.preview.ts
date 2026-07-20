import { type Tree } from '@angular-devkit/schematics';

import { getEvolutionDependencyRequirement } from '../../evolution/evolution-manifest';
import { type EvolutionOptions } from '../../evolution/schema';
import { createPackageDependenciesPreview } from '../../shared/package-dependency';
import { type EvolutionPreview } from '../evolution-definition';
import { getTranslocoPreflightBlockingNotes } from './transloco.installer';

const TRANSLOCO_DEPENDENCY = getEvolutionDependencyRequirement('transloco', '@jsverse/transloco');
const TRANSLATION_FILES = [
  'src/app/core/i18n/i18n.provider.ts',
  'src/app/core/i18n/transloco-http-loader.ts',
  'src/assets/i18n/en.json',
  'src/assets/i18n/it.json',
] as const;

export function getTranslocoPreview(_options: EvolutionOptions, tree: Tree): EvolutionPreview {
  const existing = TRANSLATION_FILES.filter((path) => tree.exists(`/${path}`));
  const dependencyPreview = createPackageDependenciesPreview(tree, [TRANSLOCO_DEPENDENCY]);
  const blockingNotes = existing.map(
    (path) => `${path} already exists and will not be overwritten.`,
  );

  blockingNotes.push(...getTranslocoPreflightBlockingNotes(tree));
  blockingNotes.push(...dependencyPreview.blockingNotes);

  return {
    dependencies: dependencyPreview.dependencies,
    creates: TRANSLATION_FILES.filter((path) => !existing.includes(path)),
    updates: [
      'package.json',
      'angular.json',
      'src/app/app.config.ts',
      '.angular-enterprise-starter.json',
    ],
    existing,
    blockingNotes,
    notes: [
      'Adds a Transloco runtime i18n provider and HTTP loader.',
      'Creates EN/IT translation assets with uppercase and nested key examples.',
      ...dependencyPreview.notes,
      'Does not modify existing layout or feature templates.',
      'Run npm install after applying the evolution.',
    ],
  };
}
