import { type Tree } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import { createPackageDependenciesPreview } from '../../shared/package-dependency';
import { type EvolutionPreview } from '../evolution-definition';
import { getAiGenkitDependencyRequirements } from './ai-genkit.dependencies';
import { getAiGenkitSummaryWiringBlockingNotes } from './ai-genkit.installer';
import {
  AI_GENKIT_CORE_FILES,
  AI_GENKIT_PROVIDER_CATALOG_PATH,
  AI_GENKIT_PROVIDER_INSTALLERS,
  AI_GENKIT_SUMMARY_EXAMPLE_FILES,
} from './ai-genkit.model';
import { createAiGenkitInstallPlan } from './ai-genkit.plan';

export function getAiGenkitPreview(options: EvolutionOptions, tree: Tree): EvolutionPreview {
  const plan = createAiGenkitInstallPlan(options);
  const providerInstaller = AI_GENKIT_PROVIDER_INSTALLERS[plan.provider];
  const dependencyPreview = createPackageDependenciesPreview(
    tree,
    getAiGenkitDependencyRequirements(providerInstaller),
  );
  const existing = plan.files.filter((path) => tree.exists(path));
  const blockingNotes = [
    ...getPartialStateNote(tree, AI_GENKIT_CORE_FILES, 'AI Genkit core'),
    ...getPartialStateNote(
      tree,
      providerInstaller.files,
      `${plan.provider} AI Genkit provider adapter`,
    ),
    ...(plan.example === 'summary'
      ? getPartialStateNote(tree, AI_GENKIT_SUMMARY_EXAMPLE_FILES, 'AI summary example')
      : []),
    ...(plan.example === 'summary' ? getAiGenkitSummaryWiringBlockingNotes(tree) : []),
  ];

  if (!tree.exists('/src/server.ts')) {
    blockingNotes.push('The starter Node SSR backend at src/server.ts is required.');
  }

  return {
    dependencies: dependencyPreview.dependencies,
    creates: plan.files.filter((path) => !existing.includes(path)).map(toDisplayPath),
    updates: [
      'package.json',
      '.env.example',
      '.gitignore',
      ...(tree.exists(AI_GENKIT_PROVIDER_CATALOG_PATH)
        ? [AI_GENKIT_PROVIDER_CATALOG_PATH.replace(/^\//, '')]
        : []),
      ...(plan.example === 'summary' ? ['src/server.ts', 'src/app/app.routes.ts'] : []),
      '.angular-enterprise-starter.json',
    ],
    existing: existing.map(toDisplayPath),
    blockingNotes: [...blockingNotes, ...dependencyPreview.blockingNotes],
    notes: [
      `Configures the ${plan.provider} provider with model ${plan.model}.`,
      'Credentials remain server-side and are never written by the installer.',
      ...dependencyPreview.notes,
      plan.example === 'summary'
        ? 'Adds a removable standard and streaming summary example at /ai-summary.'
        : 'Installs only the server-side foundation without application examples.',
      'Run npm install after apply.',
    ],
  };
}

function getPartialStateNote(tree: Tree, paths: readonly string[], label: string): string[] {
  const existingCount = paths.filter((path) => tree.exists(path)).length;

  return existingCount > 0 && existingCount < paths.length
    ? [`${label} is only partially present and blocks safe installation.`]
    : [];
}

function toDisplayPath(path: string): string {
  return path.replace(/^\//, '');
}
