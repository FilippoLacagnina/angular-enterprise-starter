import { SchematicsException, type Tree } from '@angular-devkit/schematics';
import { subset, validRange } from 'semver';

import { EvolutionUserActionRequiredError } from '../evolutions/evolution-definition';

const PACKAGE_JSON_PATH = '/package.json';

export type PackageDependencyTarget = 'dependencies' | 'devDependencies';

export interface PackageDependencyRequirement {
  readonly name: string;
  readonly versionRange: string;
  readonly target: PackageDependencyTarget;
}

export interface PackageDependencyInspection {
  readonly requirement: PackageDependencyRequirement;
  readonly status: 'missing' | 'compatible' | 'blocked';
  readonly existingRange?: string;
  readonly existingTarget?: PackageDependencyTarget;
  readonly blockingReason?: string;
}

export interface PackageDependenciesPreview {
  readonly dependencies: readonly string[];
  readonly blockingNotes: readonly string[];
  readonly notes: readonly string[];
}

interface PackageJson {
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
  [key: string]: unknown;
}

export function inspectPackageDependency(
  tree: Tree,
  requirement: PackageDependencyRequirement,
): PackageDependencyInspection {
  validateRequiredRange(requirement);

  const packageJsonResult = readPackageJson(tree);

  if ('blockingReason' in packageJsonResult) {
    return {
      requirement,
      status: 'blocked',
      blockingReason: packageJsonResult.blockingReason,
    };
  }

  const packageJson = packageJsonResult.packageJson;
  const dependencyRange = packageJson.dependencies?.[requirement.name];
  const devDependencyRange = packageJson.devDependencies?.[requirement.name];

  if (dependencyRange !== undefined && devDependencyRange !== undefined) {
    return createBlockedInspection(
      requirement,
      `${requirement.name} is declared in both dependencies and devDependencies. Keep a single declaration in ${requirement.target} before continuing.`,
    );
  }

  const existingTarget =
    dependencyRange !== undefined
      ? 'dependencies'
      : devDependencyRange !== undefined
        ? 'devDependencies'
        : undefined;
  const existingRange = dependencyRange ?? devDependencyRange;

  if (existingRange === undefined || !existingTarget) {
    return { requirement, status: 'missing' };
  }

  if (typeof existingRange !== 'string' || !existingRange.trim()) {
    return createBlockedInspection(
      requirement,
      `${requirement.name} has an invalid version declaration in ${existingTarget}.`,
      existingTarget,
    );
  }

  if (existingTarget !== requirement.target) {
    return createBlockedInspection(
      requirement,
      `${requirement.name} is declared in ${existingTarget}, but this evolution requires it in ${requirement.target}. Move the dependency explicitly before continuing.`,
      existingTarget,
      existingRange,
    );
  }

  if (!validRange(existingRange)) {
    return createBlockedInspection(
      requirement,
      `${requirement.name} uses an unsupported version declaration "${existingRange}". Declare a valid semver range compatible with ${requirement.versionRange} before continuing.`,
      existingTarget,
      existingRange,
    );
  }

  if (!subset(existingRange, requirement.versionRange)) {
    return createBlockedInspection(
      requirement,
      `${requirement.name} ${existingRange} is not compatible with the required ${requirement.versionRange} range.`,
      existingTarget,
      existingRange,
    );
  }

  return {
    requirement,
    status: 'compatible',
    existingTarget,
    existingRange,
  };
}

export function ensurePackageDependency(
  tree: Tree,
  requirement: PackageDependencyRequirement,
): PackageDependencyInspection {
  const inspection = inspectPackageDependency(tree, requirement);

  if (inspection.status === 'blocked') {
    throw new EvolutionUserActionRequiredError(inspection.blockingReason);
  }

  if (inspection.status === 'compatible') {
    return inspection;
  }

  const packageJsonResult = readPackageJson(tree);

  if ('blockingReason' in packageJsonResult) {
    throw new SchematicsException(packageJsonResult.blockingReason);
  }

  const packageJson = packageJsonResult.packageJson;
  const currentDependencies = packageJson[requirement.target] ?? {};

  packageJson[requirement.target] = sortObject({
    ...currentDependencies,
    [requirement.name]: requirement.versionRange,
  });

  tree.overwrite(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);

  return inspection;
}

export function ensurePackageDependencies(
  tree: Tree,
  requirements: readonly PackageDependencyRequirement[],
): readonly PackageDependencyInspection[] {
  const inspections = requirements.map((requirement) =>
    inspectPackageDependency(tree, requirement),
  );
  const blockedInspection = inspections.find((inspection) => inspection.status === 'blocked');

  if (blockedInspection) {
    throw new EvolutionUserActionRequiredError(blockedInspection.blockingReason);
  }

  for (const inspection of inspections) {
    if (inspection.status === 'missing') {
      ensurePackageDependency(tree, inspection.requirement);
    }
  }

  return inspections;
}

export function createPackageDependenciesPreview(
  tree: Tree,
  requirements: readonly PackageDependencyRequirement[],
): PackageDependenciesPreview {
  const inspections = requirements.map((requirement) =>
    inspectPackageDependency(tree, requirement),
  );

  return {
    dependencies: requirements.map(formatPackageDependencyRequirement),
    blockingNotes: inspections.flatMap((inspection) =>
      inspection.blockingReason ? [inspection.blockingReason] : [],
    ),
    notes: inspections.flatMap((inspection) => {
      if (inspection.status === 'compatible') {
        return [`Preserves the compatible existing ${inspection.requirement.name} declaration.`];
      }

      if (inspection.status === 'missing') {
        return [
          `Adds ${formatPackageDependencyRequirement(inspection.requirement)} to ${inspection.requirement.target}.`,
        ];
      }

      return [];
    }),
  };
}

export function formatPackageDependencyRequirement(
  requirement: PackageDependencyRequirement,
): string {
  return `${requirement.name} ${requirement.versionRange}`;
}

function validateRequiredRange(requirement: PackageDependencyRequirement): void {
  if (!validRange(requirement.versionRange)) {
    throw new SchematicsException(
      `Invalid required semver range for ${requirement.name}: ${requirement.versionRange}.`,
    );
  }
}

function readPackageJson(
  tree: Tree,
): { readonly packageJson: PackageJson } | { readonly blockingReason: string } {
  if (!tree.exists(PACKAGE_JSON_PATH)) {
    return { blockingReason: 'Missing package.json. Cannot manage package dependencies.' };
  }

  try {
    const packageJson = JSON.parse(tree.readText(PACKAGE_JSON_PATH)) as unknown;

    if (!isRecord(packageJson)) {
      return { blockingReason: 'Invalid package.json. Expected a JSON object.' };
    }

    if (
      (packageJson['dependencies'] !== undefined && !isRecord(packageJson['dependencies'])) ||
      (packageJson['devDependencies'] !== undefined && !isRecord(packageJson['devDependencies']))
    ) {
      return {
        blockingReason:
          'Invalid package.json. dependencies and devDependencies must be JSON objects.',
      };
    }

    return { packageJson };
  } catch {
    return { blockingReason: 'Invalid package.json. Cannot parse package dependencies.' };
  }
}

function createBlockedInspection(
  requirement: PackageDependencyRequirement,
  blockingReason: string,
  existingTarget?: PackageDependencyTarget,
  existingRange?: string,
): PackageDependencyInspection {
  return {
    requirement,
    status: 'blocked',
    existingTarget,
    existingRange,
    blockingReason,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sortObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).sort(([first], [second]) => first.localeCompare(second)),
  );
}
