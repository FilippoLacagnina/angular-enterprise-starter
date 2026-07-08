import { type Tree } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import { type EvolutionPreview } from '../evolution-definition';
import { collectUnsupportedEnvironmentConfigReferences } from './runtime-config.installer';

const RUNTIME_CONFIG_FILES = [
  'src/app/core/runtime-config/runtime-config.model.ts',
  'src/app/core/runtime-config/runtime-config.parser.ts',
  'src/app/core/runtime-config/runtime-config.provider.ts',
  'src/app/core/runtime-config/runtime-config.service.ts',
  'src/app/core/runtime-config/runtime-config.token.ts',
  'src/assets/config/values.yml',
] as const;

export function getRuntimeConfigPreview(_options: EvolutionOptions, tree: Tree): EvolutionPreview {
  const existing = RUNTIME_CONFIG_FILES.filter((path) => tree.exists(`/${path}`));
  const unsupportedReferences = collectUnsupportedEnvironmentConfigReferences(tree);

  return {
    dependencies: ['yaml'],
    creates: RUNTIME_CONFIG_FILES.filter((path) => !existing.includes(path)),
    updates: [
      'package.json',
      'angular.json',
      'src/app/app.config.ts',
      'src/app/features/dashboard/services/dashboard.service.ts',
      'tsconfig.spec.json',
      '.angular-enterprise-starter.json',
    ],
    existing,
    blockingNotes: [
      ...existing.map((path) => `${path} already exists and will not be overwritten.`),
      ...unsupportedReferences.map((path) => {
        return `${path.replace(/^\//, '')} still references the environment-based configuration.`;
      }),
    ],
    notes: [
      'Replaces Angular environment-file configuration with runtime values.yml loading.',
      'Removes baseline core/config and src/environments files when present.',
      'Registers src/assets and allows the yaml CommonJS dependency for Angular builds.',
      'Updates the baseline DashboardService only when it still uses the default APP_CONFIG pattern.',
      'Does not modify layout templates.',
      'Select this evolution early because it changes the application configuration strategy.',
      'Run npm install after applying the evolution.',
    ],
  };
}
