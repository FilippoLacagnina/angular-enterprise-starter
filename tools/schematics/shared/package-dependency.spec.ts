import { HostTree, SchematicsException, type Tree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import { EvolutionUserActionRequiredError } from '../evolutions/evolution-definition';
import {
  ensurePackageDependencies,
  ensurePackageDependency,
  inspectPackageDependency,
  type PackageDependencyRequirement,
} from './package-dependency';

const REQUIREMENT: PackageDependencyRequirement = {
  name: '@jsverse/transloco',
  versionRange: '^8.3.0',
  target: 'dependencies',
};

describe('package dependency guard', () => {
  it('adds a missing dependency to the required section', () => {
    const tree = createTree({
      dependencies: {
        rxjs: '~7.8.0',
      },
    });

    expect(ensurePackageDependency(tree, REQUIREMENT).status).toBe('missing');
    expect(readPackageJson(tree).dependencies).toEqual({
      '@jsverse/transloco': '^8.3.0',
      rxjs: '~7.8.0',
    });
  });

  it('preserves a compatible dependency declaration', () => {
    const tree = createTree({
      dependencies: {
        '@jsverse/transloco': '^8.4.0',
      },
    });
    const originalPackageJson = tree.readText('/package.json');

    expect(ensurePackageDependency(tree, REQUIREMENT)).toMatchObject({
      status: 'compatible',
      existingRange: '^8.4.0',
      existingTarget: 'dependencies',
    });
    expect(tree.readText('/package.json')).toBe(originalPackageJson);
  });

  it('blocks ranges that include unsupported versions', () => {
    const tree = createTree({
      dependencies: {
        '@jsverse/transloco': '^8.0.0',
      },
    });

    expect(inspectPackageDependency(tree, REQUIREMENT)).toMatchObject({
      status: 'blocked',
      existingRange: '^8.0.0',
      blockingReason: '@jsverse/transloco ^8.0.0 is not compatible with the required ^8.3.0 range.',
    });
    expect(() => ensurePackageDependency(tree, REQUIREMENT)).toThrow(
      EvolutionUserActionRequiredError,
    );
  });

  it('blocks dependencies declared in the wrong section or in both sections', () => {
    const wrongSectionTree = createTree({
      devDependencies: {
        '@jsverse/transloco': '^8.3.0',
      },
    });
    const duplicateTree = createTree({
      dependencies: {
        '@jsverse/transloco': '^8.3.0',
      },
      devDependencies: {
        '@jsverse/transloco': '^8.3.0',
      },
    });

    expect(inspectPackageDependency(wrongSectionTree, REQUIREMENT).blockingReason).toContain(
      'is declared in devDependencies',
    );
    expect(inspectPackageDependency(duplicateTree, REQUIREMENT).blockingReason).toContain(
      'is declared in both dependencies and devDependencies',
    );
  });

  it('blocks unsupported declarations and malformed package files', () => {
    const unsupportedRangeTree = createTree({
      dependencies: {
        '@jsverse/transloco': 'workspace:^8.3.0',
      },
    });
    const malformedTree = new HostTree();
    malformedTree.create('/package.json', '{');

    expect(inspectPackageDependency(unsupportedRangeTree, REQUIREMENT).blockingReason).toContain(
      'uses an unsupported version declaration',
    );
    expect(inspectPackageDependency(malformedTree, REQUIREMENT).blockingReason).toBe(
      'Invalid package.json. Cannot parse package dependencies.',
    );
  });

  it('rejects an invalid required range as an implementation error', () => {
    const tree = createTree({});

    expect(() =>
      inspectPackageDependency(tree, {
        ...REQUIREMENT,
        versionRange: 'not-semver',
      }),
    ).toThrow(SchematicsException);
  });

  it('validates all dependencies before applying bulk changes', () => {
    const tree = createTree({
      dependencies: {
        '@genkit-ai/google-genai': '^1.39.0',
      },
    });
    const originalPackageJson = tree.readText('/package.json');

    expect(() =>
      ensurePackageDependencies(tree, [
        {
          name: 'genkit',
          versionRange: '^1.40.0',
          target: 'dependencies',
        },
        {
          name: '@genkit-ai/google-genai',
          versionRange: '^1.40.0',
          target: 'dependencies',
        },
      ]),
    ).toThrow('@genkit-ai/google-genai ^1.39.0 is not compatible with the required ^1.40.0 range.');
    expect(tree.readText('/package.json')).toBe(originalPackageJson);
  });
});

function createTree(packageJson: Record<string, unknown>): Tree {
  const tree = new HostTree();
  tree.create('/package.json', `${JSON.stringify(packageJson, null, 2)}\n`);

  return tree;
}

function readPackageJson(tree: Tree): {
  readonly dependencies?: Record<string, string>;
} {
  return JSON.parse(tree.readText('/package.json')) as {
    readonly dependencies?: Record<string, string>;
  };
}
