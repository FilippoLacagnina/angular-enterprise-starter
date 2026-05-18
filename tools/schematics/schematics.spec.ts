import { HostTree, type Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { lastValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { evolution } from './evolution';
import { getEvolutionDefinitions } from './evolutions/evolution-registry';
import { ngAdd } from './ng-add';

const runner = new SchematicTestRunner(
  'angular-enterprise-starter',
  'tools/schematics/collection.json',
);

describe('Angular Enterprise Starter schematics', () => {
  it('ng-add validates a compatible starter baseline', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(runner.callRule(ngAdd(), tree));

    expect(result.exists('/.angular-enterprise-starter.json')).toBe(true);
  });

  it('ng-add fails when starter metadata is missing', async () => {
    const tree = new HostTree();

    await expect(lastValueFrom(runner.callRule(ngAdd(), tree))).rejects.toThrow(
      'Missing .angular-enterprise-starter.json',
    );
  });

  it('evolution registers a valid evolution in starter metadata', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(runner.callRule(evolution({ name: 'signal-store' }), tree));
    const metadata = readMetadata(result);
    const packageJson = readPackageJson(result);

    expect(result.exists('/.angular-enterprise-starter.json')).toBe(true);
    expect(result.exists('/src/app/features/dashboard/state/dashboard.state.ts')).toBe(true);
    expect(result.exists('/src/app/features/dashboard/state/dashboard.store.ts')).toBe(true);
    expect(packageJson.dependencies?.['@ngrx/signals']).toBe('^21.1.0');
    expect(metadata.enabledEvolutions).toEqual(['signal-store']);
  });

  it('evolution fails when the selected evolution is already enabled', async () => {
    const tree = createStarterTree(['signal-store']);

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'signal-store' }), tree)),
    ).rejects.toThrow('Evolution "signal-store" is already enabled.');
  });

  it('evolution keeps enabled evolutions sorted', async () => {
    const tree = createStarterTree(['tailwind']);

    const result = await lastValueFrom(runner.callRule(evolution({ name: 'bootstrap' }), tree));
    const metadata = readMetadata(result);

    expect(metadata.enabledEvolutions).toEqual(['bootstrap', 'tailwind']);
  });

  it('evolution preview does not update starter metadata', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(
      runner.callRule(evolution({ name: 'signal-store', preview: true }), tree),
    );
    const metadata = readMetadata(result);
    const packageJson = readPackageJson(result);

    expect(metadata.enabledEvolutions).toEqual([]);
    expect(result.exists('/src/app/features/dashboard/state/dashboard.state.ts')).toBe(false);
    expect(result.exists('/src/app/features/dashboard/state/dashboard.store.ts')).toBe(false);
    expect(packageJson.dependencies?.['@ngrx/signals']).toBeUndefined();
  });

  it('evolution fails before overwriting existing SignalStore files', async () => {
    const tree = createStarterTree();
    tree.create('/src/app/features/dashboard/state/dashboard.state.ts', '');

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'signal-store' }), tree)),
    ).rejects.toThrow(
      'Cannot create /src/app/features/dashboard/state/dashboard.state.ts. File already exists.',
    );
  });

  it('evolution registry exposes one definition for each supported evolution', () => {
    const evolutionNames = getEvolutionDefinitions().map((definition) => definition.name);

    expect(evolutionNames).toEqual([
      'transloco',
      'runtime-config',
      'signal-store',
      'docker-ssr',
      'bootstrap',
      'tailwind',
    ]);
  });
});

function createStarterTree(enabledEvolutions: readonly string[] = []): Tree {
  const tree = new HostTree();

  tree.create(
    '/.angular-enterprise-starter.json',
    JSON.stringify(
      {
        schemaVersion: 1,
        baselineVersion: '0.2.0-alpha.0',
        enabledEvolutions,
      },
      null,
      2,
    ),
  );

  for (const path of [
    '/src/app/core/.gitkeep',
    '/src/app/shared/.gitkeep',
    '/src/app/layout/.gitkeep',
    '/src/app/features/.gitkeep',
  ]) {
    tree.create(path, '');
  }

  tree.create(
    '/package.json',
    JSON.stringify(
      {
        name: 'angular-enterprise-starter',
        dependencies: {
          '@angular/core': '^21.2.0',
        },
      },
      null,
      2,
    ),
  );

  return tree;
}

function readMetadata(tree: Tree): { enabledEvolutions: string[] } {
  const metadata = tree.read('/.angular-enterprise-starter.json');

  if (!metadata) {
    throw new Error('Missing starter metadata in test tree.');
  }

  return JSON.parse(metadata.toString()) as { enabledEvolutions: string[] };
}

function readPackageJson(tree: Tree): { dependencies?: Record<string, string> } {
  const packageJson = tree.read('/package.json');

  if (!packageJson) {
    throw new Error('Missing package.json in test tree.');
  }

  return JSON.parse(packageJson.toString()) as { dependencies?: Record<string, string> };
}
