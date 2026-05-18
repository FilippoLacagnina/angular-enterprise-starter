import { HostTree, type Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { lastValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { evolution } from './evolution';
import { getEvolutionDefinitions } from './evolutions/evolution-registry';
import { ngAdd } from './ng-add';

const STARTER_METADATA_PATH = '/.angular-enterprise-starter.json';
const PACKAGE_JSON_PATH = '/package.json';
const GLOBAL_STYLES_PATH = '/src/styles.scss';
const DASHBOARD_STATE_PATH = '/src/app/features/dashboard/state/dashboard.state.ts';
const DASHBOARD_STORE_PATH = '/src/app/features/dashboard/state/dashboard.store.ts';
const BOOTSTRAP_STYLE_IMPORT = "@import 'bootstrap/dist/css/bootstrap.min.css';";

const runner = new SchematicTestRunner(
  'angular-enterprise-starter',
  'tools/schematics/collection.json',
);

describe('Angular Enterprise Starter schematics', () => {
  it('ng-add validates a compatible starter baseline', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(runner.callRule(ngAdd(), tree));

    expect(result.exists(STARTER_METADATA_PATH)).toBe(true);
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

    expect(result.exists(STARTER_METADATA_PATH)).toBe(true);
    expect(result.exists(DASHBOARD_STATE_PATH)).toBe(true);
    expect(result.exists(DASHBOARD_STORE_PATH)).toBe(true);
    expect(packageJson.dependencies?.['@ngrx/signals']).toBe('^21.1.0');
    expect(metadata.enabledEvolutions).toEqual(['signal-store']);
  });

  it('evolution installs Docker SSR files and updates starter metadata', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(runner.callRule(evolution({ name: 'docker-ssr' }), tree));
    const metadata = readMetadata(result);

    expect(result.exists('/Dockerfile')).toBe(true);
    expect(result.exists('/.dockerignore')).toBe(true);
    expect(result.readText('/Dockerfile')).toContain(
      'CMD ["node", "dist/angular-enterprise-starter/server/server.mjs"]',
    );
    expect(metadata.enabledEvolutions).toEqual(['docker-ssr']);
  });

  it('evolution installs Bootstrap dependency and preserves existing global styles', async () => {
    const tree = createStarterTree();
    tree.create(GLOBAL_STYLES_PATH, 'body { margin: 0; }\n');

    const result = await lastValueFrom(runner.callRule(evolution({ name: 'bootstrap' }), tree));
    const metadata = readMetadata(result);
    const packageJson = readPackageJson(result);
    const stylesContent = readText(result, GLOBAL_STYLES_PATH);

    expect(packageJson.dependencies?.bootstrap).toBe('^5.3.8');
    expect(stylesContent).toBe(`${BOOTSTRAP_STYLE_IMPORT}\n\nbody { margin: 0; }\n`);
    expect(metadata.enabledEvolutions).toEqual(['bootstrap']);
  });

  it('evolution does not duplicate Bootstrap when dependency and style import already exist', async () => {
    const tree = createStarterTree();
    tree.overwrite(
      PACKAGE_JSON_PATH,
      JSON.stringify(
        {
          name: 'angular-enterprise-starter',
          dependencies: {
            '@angular/core': '^21.2.0',
            bootstrap: '^5.3.8',
          },
        },
        null,
        2,
      ),
    );
    tree.create(GLOBAL_STYLES_PATH, `${BOOTSTRAP_STYLE_IMPORT}\n`);

    const result = await lastValueFrom(runner.callRule(evolution({ name: 'bootstrap' }), tree));
    const packageJson = readPackageJson(result);
    const stylesContent = readText(result, GLOBAL_STYLES_PATH);

    expect(packageJson.dependencies?.bootstrap).toBe('^5.3.8');
    expect(stylesContent).toBe(`${BOOTSTRAP_STYLE_IMPORT}\n`);
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
    expect(result.exists(DASHBOARD_STATE_PATH)).toBe(false);
    expect(result.exists(DASHBOARD_STORE_PATH)).toBe(false);
    expect(packageJson.dependencies?.['@ngrx/signals']).toBeUndefined();
  });

  it('evolution fails before overwriting existing SignalStore files', async () => {
    const tree = createStarterTree();
    tree.create(DASHBOARD_STATE_PATH, '');

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'signal-store' }), tree)),
    ).rejects.toThrow(/evo\/state\/signal-store/);
  });

  it('evolution fails before overwriting existing Docker SSR files', async () => {
    const tree = createStarterTree();
    tree.create('/Dockerfile', '');

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'docker-ssr' }), tree)),
    ).rejects.toThrow(/evo\/deployment\/docker-ssr/);
  });

  it('evolution blocking errors include the reference branch URL', async () => {
    const tree = createStarterTree();
    tree.create('/Dockerfile', '');

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'docker-ssr' }), tree)),
    ).rejects.toThrow(
      'https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/deployment/docker-ssr',
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
    STARTER_METADATA_PATH,
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
    PACKAGE_JSON_PATH,
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
  const metadata = tree.read(STARTER_METADATA_PATH);

  if (!metadata) {
    throw new Error('Missing starter metadata in test tree.');
  }

  return JSON.parse(metadata.toString()) as { enabledEvolutions: string[] };
}

function readPackageJson(tree: Tree): { dependencies?: Record<string, string> } {
  const packageJson = tree.read(PACKAGE_JSON_PATH);

  if (!packageJson) {
    throw new Error('Missing package.json in test tree.');
  }

  return JSON.parse(packageJson.toString()) as { dependencies?: Record<string, string> };
}

function readText(tree: Tree, path: string): string {
  const content = tree.read(path);

  if (!content) {
    throw new Error(`Missing ${path} in test tree.`);
  }

  return content.toString();
}
