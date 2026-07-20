import { SchematicsException } from '@angular-devkit/schematics';

import {
  type PackageDependencyRequirement,
  type PackageDependencyTarget,
} from '../shared/package-dependency';
import { type EvolutionName } from './schema';

import evolutionManifest = require('./evolution-manifest.json');

interface EvolutionManifestDependency {
  readonly name: string;
  readonly versionRange: string;
  readonly target: PackageDependencyTarget;
}

interface EvolutionManifestEntry {
  readonly name: EvolutionName;
  readonly label: string;
  readonly repeatable: boolean;
  readonly referenceBranch: string;
  readonly dependencies: readonly EvolutionManifestDependency[];
}

interface EvolutionManifest {
  readonly schemaVersion: number;
  readonly evolutions: readonly EvolutionManifestEntry[];
}

const manifest = evolutionManifest as unknown as EvolutionManifest;

export function getEvolutionDependencyRequirement(
  evolutionName: EvolutionName,
  dependencyName: string,
): PackageDependencyRequirement {
  const dependency = getEvolutionDependencyRequirements(evolutionName).find(
    (candidate) => candidate.name === dependencyName,
  );

  if (!dependency) {
    throw new SchematicsException(
      `Evolution manifest does not define dependency "${dependencyName}" for "${evolutionName}".`,
    );
  }

  return dependency;
}

export function getEvolutionDependencyRequirements(
  evolutionName: EvolutionName,
): readonly PackageDependencyRequirement[] {
  return getEvolutionManifestEntry(evolutionName).dependencies;
}

export function getEvolutionManifestEntry(evolutionName: EvolutionName): EvolutionManifestEntry {
  const evolution = manifest.evolutions.find((candidate) => candidate.name === evolutionName);

  if (!evolution) {
    throw new SchematicsException(
      `Evolution manifest does not define evolution "${evolutionName}".`,
    );
  }

  return evolution;
}
