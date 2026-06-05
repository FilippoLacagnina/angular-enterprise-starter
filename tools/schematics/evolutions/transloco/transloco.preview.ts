import { type Tree } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import { type EvolutionPreview } from '../evolution-definition';

const TRANSLATION_FILES = [
  'src/app/core/i18n/i18n.provider.ts',
  'src/app/core/i18n/transloco-http-loader.ts',
  'src/assets/i18n/en.json',
  'src/assets/i18n/it.json',
] as const;

export function getTranslocoPreview(_options: EvolutionOptions, tree: Tree): EvolutionPreview {
  const existing = TRANSLATION_FILES.filter((path) => tree.exists(`/${path}`));

  return {
    dependencies: ['@jsverse/transloco'],
    creates: TRANSLATION_FILES.filter((path) => !existing.includes(path)),
    updates: [
      'package.json',
      'angular.json',
      'src/app/app.config.ts',
      '.angular-enterprise-starter.json',
    ],
    existing,
    blockingNotes: existing.map((path) => `${path} already exists and will not be overwritten.`),
    notes: [
      'Adds a Transloco runtime i18n provider and HTTP loader.',
      'Creates EN/IT translation assets with uppercase and nested key examples.',
      'Does not modify existing layout or feature templates.',
      'Run npm install after applying the evolution.',
    ],
  };
}
