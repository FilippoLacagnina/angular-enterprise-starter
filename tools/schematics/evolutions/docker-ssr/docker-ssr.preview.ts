import { type Tree } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import { type EvolutionPreview } from '../evolution-definition';
import { DOCKER_SSR_FILES, inspectDockerSsrEvolution } from './docker-ssr.installer';

export function getDockerSsrPreview(_options: EvolutionOptions, tree: Tree): EvolutionPreview {
  const inspection = inspectDockerSsrEvolution(tree);

  return {
    dependencies: [],
    creates: DOCKER_SSR_FILES.filter((file) => !inspection.existingFiles.includes(file.path)).map(
      (file) => toDisplayPath(file.path),
    ),
    updates: ['.angular-enterprise-starter.json'],
    existing: inspection.existingFiles.map(toDisplayPath),
    blockingNotes: inspection.blockingNotes,
    notes: [
      'Adds a multi-stage Node container for the production Angular SSR build.',
      'Validates the npm lockfile, build script and Angular SSR entry before writing files.',
      'Does not overwrite existing Docker files.',
    ],
  };
}

function toDisplayPath(path: string): string {
  return path.replace(/^\//, '');
}
