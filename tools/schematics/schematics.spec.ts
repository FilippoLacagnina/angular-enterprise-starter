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
const APP_STATE_PATH = '/src/app/core/state/app.state.ts';
const APP_STORE_PATH = '/src/app/core/state/app.store.ts';
const DASHBOARD_ROUTES_PATH = '/src/app/features/dashboard/dashboard.routes.ts';
const BOOTSTRAP_INDEX_PATH = '/src/app/shared/components/bootstrap/index.ts';
const BOOTSTRAP_ALERT_PATH = '/src/app/shared/components/bootstrap/alert/alert.ts';
const BOOTSTRAP_BADGE_PATH = '/src/app/shared/components/bootstrap/badge/badge.ts';
const BOOTSTRAP_BUTTON_PATH = '/src/app/shared/components/bootstrap/button/button.ts';
const BOOTSTRAP_CARD_PATH = '/src/app/shared/components/bootstrap/card/card.ts';
const BOOTSTRAP_CARD_TEMPLATE_PATH = '/src/app/shared/components/bootstrap/card/card.html';
const BOOTSTRAP_INPUT_PATH = '/src/app/shared/components/bootstrap/input/input.ts';
const BOOTSTRAP_INPUT_TEMPLATE_PATH = '/src/app/shared/components/bootstrap/input/input.html';
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
    expect(readText(result, DASHBOARD_ROUTES_PATH)).toContain(
      "import { DashboardStore } from './state/dashboard.store';",
    );
    expect(readText(result, DASHBOARD_ROUTES_PATH)).toContain('providers: [DashboardStore]');
    expect(packageJson.dependencies?.['@ngrx/signals']).toBe('^21.1.0');
    expect(metadata.enabledEvolutions).toEqual(['signal-store']);
  });

  it('evolution installs a root SignalStore when requested', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(
      runner.callRule(evolution({ name: 'signal-store', storeScope: 'root' }), tree),
    );
    const metadata = readMetadata(result);

    expect(result.exists(APP_STATE_PATH)).toBe(true);
    expect(result.exists(APP_STORE_PATH)).toBe(true);
    expect(readText(result, APP_STORE_PATH)).toContain("{ providedIn: 'root' }");
    expect(metadata.enabledEvolutions).toEqual(['signal-store']);
  });

  it('evolution installs a named root SignalStore when requested', async () => {
    const tree = createStarterTree(['signal-store']);

    const result = await lastValueFrom(
      runner.callRule(
        evolution({ name: 'signal-store', storeScope: 'root', storeName: 'session' }),
        tree,
      ),
    );
    const metadata = readMetadata(result);

    expect(result.exists('/src/app/core/state/session.state.ts')).toBe(true);
    expect(result.exists('/src/app/core/state/session.store.ts')).toBe(true);
    expect(readText(result, '/src/app/core/state/session.store.ts')).toContain(
      'export const SessionStore = signalStore',
    );
    expect(metadata.enabledEvolutions).toEqual(['signal-store']);
  });

  it('evolution can create a feature SignalStore with a new feature component', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(
      runner.callRule(
        evolution({
          name: 'signal-store',
          storeScope: 'feature',
          featureName: 'orders',
          featureComponent: 'create',
        }),
        tree,
      ),
    );

    expect(result.exists('/src/app/features/orders/state/orders.state.ts')).toBe(true);
    expect(result.exists('/src/app/features/orders/state/orders.store.ts')).toBe(true);
    expect(result.exists('/src/app/features/orders/orders.routes.ts')).toBe(true);
    expect(result.exists('/src/app/features/orders/views/orders/orders.component.ts')).toBe(true);
    expect(readText(result, '/src/app/features/orders/orders.routes.ts')).toContain(
      'export const ordersRoutes',
    );
    expect(readText(result, '/src/app/features/orders/views/orders/orders.component.ts')).toContain(
      'export class OrdersComponent',
    );
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
    expect(result.exists(BOOTSTRAP_ALERT_PATH)).toBe(true);
    expect(result.exists(BOOTSTRAP_BADGE_PATH)).toBe(true);
    expect(result.exists(BOOTSTRAP_BUTTON_PATH)).toBe(true);
    expect(result.exists(BOOTSTRAP_CARD_PATH)).toBe(true);
    expect(result.exists(BOOTSTRAP_INPUT_PATH)).toBe(true);
    expect(readText(result, BOOTSTRAP_BUTTON_PATH)).toContain("selector: 'aes-bootstrap-button'");
    expect(readText(result, BOOTSTRAP_BUTTON_PATH)).toContain('readonly variant = input');
    expect(readText(result, BOOTSTRAP_CARD_PATH)).toContain('readonly imageSrc = input');
    expect(readText(result, BOOTSTRAP_CARD_TEMPLATE_PATH)).toContain('card-img-top');
    expect(readText(result, BOOTSTRAP_INPUT_PATH)).toContain('readonly label = input');
    expect(readText(result, BOOTSTRAP_INPUT_TEMPLATE_PATH)).toContain('class="form-label"');
    expect(readText(result, BOOTSTRAP_INPUT_TEMPLATE_PATH)).toContain('[attr.aria-label]');
    expect(readText(result, BOOTSTRAP_INDEX_PATH)).toContain(
      "export { BootstrapButton } from './button/button';",
    );
    expect(metadata.enabledEvolutions).toEqual(['bootstrap']);
  });

  it('evolution installs only selected Bootstrap components when requested', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(
      runner.callRule(
        evolution({
          name: 'bootstrap',
          bootstrapMode: 'select',
          bootstrapComponents: 'button,input',
        }),
        tree,
      ),
    );

    expect(result.exists(BOOTSTRAP_BUTTON_PATH)).toBe(true);
    expect(result.exists(BOOTSTRAP_INPUT_PATH)).toBe(true);
    expect(result.exists(BOOTSTRAP_CARD_PATH)).toBe(false);
    expect(readText(result, BOOTSTRAP_INDEX_PATH)).toContain(
      "export { BootstrapButton } from './button/button';",
    );
    expect(readText(result, BOOTSTRAP_INDEX_PATH)).toContain(
      "export { BootstrapInput } from './input/input';",
    );
    expect(readText(result, BOOTSTRAP_INDEX_PATH)).not.toContain('BootstrapCard');
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

  it('evolution can add another Bootstrap component after the capability is enabled', async () => {
    const tree = createStarterTree(['bootstrap']);

    const firstResult = await lastValueFrom(
      runner.callRule(
        evolution({
          name: 'bootstrap',
          bootstrapMode: 'select',
          bootstrapComponents: 'button',
        }),
        tree,
      ),
    );
    const secondResult = await lastValueFrom(
      runner.callRule(
        evolution({
          name: 'bootstrap',
          bootstrapMode: 'select',
          bootstrapComponents: 'card',
        }),
        firstResult,
      ),
    );
    const metadata = readMetadata(secondResult);
    const indexContent = readText(secondResult, BOOTSTRAP_INDEX_PATH);

    expect(secondResult.exists(BOOTSTRAP_BUTTON_PATH)).toBe(true);
    expect(secondResult.exists(BOOTSTRAP_CARD_PATH)).toBe(true);
    expect(indexContent).toContain("export { BootstrapButton } from './button/button';");
    expect(indexContent).toContain("export { BootstrapCard } from './card/card';");
    expect(metadata.enabledEvolutions).toEqual(['bootstrap']);
  });

  it('evolution skips complete Bootstrap components and creates missing components', async () => {
    const tree = createStarterTree();

    const firstResult = await lastValueFrom(
      runner.callRule(
        evolution({
          name: 'bootstrap',
          bootstrapMode: 'select',
          bootstrapComponents: 'button,input',
        }),
        tree,
      ),
    );
    const secondResult = await lastValueFrom(
      runner.callRule(evolution({ name: 'bootstrap', bootstrapMode: 'all' }), firstResult),
    );
    const metadata = readMetadata(secondResult);
    const indexContent = readText(secondResult, BOOTSTRAP_INDEX_PATH);

    expect(secondResult.exists(BOOTSTRAP_ALERT_PATH)).toBe(true);
    expect(secondResult.exists(BOOTSTRAP_BADGE_PATH)).toBe(true);
    expect(secondResult.exists(BOOTSTRAP_BUTTON_PATH)).toBe(true);
    expect(secondResult.exists(BOOTSTRAP_CARD_PATH)).toBe(true);
    expect(secondResult.exists(BOOTSTRAP_INPUT_PATH)).toBe(true);
    expect(countOccurrences(indexContent, 'BootstrapButton')).toBe(1);
    expect(countOccurrences(indexContent, 'BootstrapInput')).toBe(1);
    expect(metadata.enabledEvolutions).toEqual(['bootstrap']);
  });

  it('evolution can generate another SignalStore after the capability is enabled', async () => {
    const tree = createStarterTree(['signal-store']);

    const result = await lastValueFrom(
      runner.callRule(
        evolution({
          name: 'signal-store',
          storeScope: 'feature',
          featureName: 'orders',
          featureComponent: 'create',
        }),
        tree,
      ),
    );
    const metadata = readMetadata(result);

    expect(result.exists('/src/app/features/orders/state/orders.state.ts')).toBe(true);
    expect(result.exists('/src/app/features/orders/state/orders.store.ts')).toBe(true);
    expect(readText(result, '/src/app/features/orders/orders.routes.ts')).toContain(
      'providers: [OrdersStore]',
    );
    expect(metadata.enabledEvolutions).toEqual(['signal-store']);
  });

  it('evolution fails when a non-repeatable evolution is already enabled', async () => {
    const tree = createStarterTree(['docker-ssr']);

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'docker-ssr' }), tree)),
    ).rejects.toThrow('Evolution "docker-ssr" is already enabled.');
  });

  it('evolution fails before completing a partially installed Bootstrap component', async () => {
    const tree = createStarterTree();
    tree.create(BOOTSTRAP_BUTTON_PATH, '');

    await expect(
      lastValueFrom(
        runner.callRule(
          evolution({
            name: 'bootstrap',
            bootstrapMode: 'select',
            bootstrapComponents: 'button',
          }),
          tree,
        ),
      ),
    ).rejects.toThrow('Bootstrap component installation is incomplete');
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
    ).rejects.toThrow('A SignalStore already exists for feature "dashboard".');
  });

  it('evolution asks for user action before overwriting an existing root SignalStore', async () => {
    const tree = createStarterTree(['signal-store']);
    tree.create(APP_STORE_PATH, '');

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'signal-store', storeScope: 'root' }), tree)),
    ).rejects.toThrow('A root SignalStore named "app" already exists under src/app/core/state.');
  });

  it('evolution user action errors do not include branch fallback guidance', async () => {
    const tree = createStarterTree(['signal-store']);
    tree.create(APP_STORE_PATH, '');

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'signal-store', storeScope: 'root' }), tree)),
    ).rejects.not.toThrow('evo/state/signal-store');
  });

  it('evolution fails before overwriting existing feature component files', async () => {
    const tree = createStarterTree();

    await expect(
      lastValueFrom(
        runner.callRule(
          evolution({
            name: 'signal-store',
            storeScope: 'feature',
            featureName: 'dashboard',
            featureComponent: 'create',
          }),
          tree,
        ),
      ),
    ).rejects.toThrow('Feature component files already exist for feature "dashboard".');
  });

  it('evolution fails when a feature route is missing for an existing component', async () => {
    const tree = createStarterTree();
    tree.delete(DASHBOARD_ROUTES_PATH);

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'signal-store' }), tree)),
    ).rejects.toThrow('Missing route file for feature "dashboard".');
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
        baselineVersion: '0.3.0-alpha.0',
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
    DASHBOARD_ROUTES_PATH,
    `import { type Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/dashboard/dashboard.component').then(
        (component) => component.DashboardComponent,
      ),
  },
];
`,
  );

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

function countOccurrences(value: string, searchValue: string): number {
  return value.split(searchValue).length - 1;
}
