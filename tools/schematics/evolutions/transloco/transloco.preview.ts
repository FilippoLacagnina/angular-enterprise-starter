import { type Tree } from '@angular-devkit/schematics';

import { getEvolutionDependencyRequirement } from '../../evolution/evolution-manifest';
import { type EvolutionOptions } from '../../evolution/schema';
import { createPackageDependenciesPreview } from '../../shared/package-dependency';
import { type EvolutionPreview } from '../evolution-definition';
import { getTranslocoPreflightBlockingNotes } from './transloco.installer';
import { createTranslocoInstallPlan, getTranslocoGeneratedFiles } from './transloco.plan';

const TRANSLOCO_DEPENDENCY = getEvolutionDependencyRequirement('transloco', '@jsverse/transloco');

export function getTranslocoPreview(options: EvolutionOptions, tree: Tree): EvolutionPreview {
  const plan = createTranslocoInstallPlan(options);
  const generatedFiles = getTranslocoGeneratedFiles(plan).map((path) => path.slice(1));
  const existing = generatedFiles.filter((path) => tree.exists(`/${path}`));
  const dependencyPreview = createPackageDependenciesPreview(tree, [TRANSLOCO_DEPENDENCY]);
  const blockingNotes = existing.map(
    (path) => `${path} already exists and will not be overwritten.`,
  );

  blockingNotes.push(...getTranslocoPreflightBlockingNotes(tree));
  blockingNotes.push(...dependencyPreview.blockingNotes);

  return {
    dependencies: dependencyPreview.dependencies,
    creates: generatedFiles.filter((path) => !existing.includes(path)),
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
      `Selected languages: ${plan.languages.map((language) => `${language.label} (${language.code})`).join(', ')}.`,
      `Default and fallback language: ${plan.defaultLanguage}.`,
      'Creates one translation asset per selected language with uppercase and nested key examples.',
      ...dependencyPreview.notes,
      'Does not modify existing layout or feature templates.',
      'Run npm install after applying the evolution.',
    ],
  };
}
