import { HostTree, type Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { lastValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { evolution } from './evolution';
import { getEvolutionDefinitions } from './evolutions/evolution-registry';
import { ngAdd } from './ng-add';

const STARTER_METADATA_PATH = '/.angular-enterprise-starter.json';
const PACKAGE_JSON_PATH = '/package.json';
const ANGULAR_JSON_PATH = '/angular.json';
const APP_CONFIG_PATH = '/src/app/app.config.ts';
const TSCONFIG_SPEC_PATH = '/tsconfig.spec.json';
const GLOBAL_STYLES_PATH = '/src/styles.scss';
const APP_CONFIG_MODEL_PATH = '/src/app/core/config/app-config.model.ts';
const ENVIRONMENT_PATH = '/src/environments/environment.ts';
const I18N_PROVIDER_PATH = '/src/app/core/i18n/i18n.provider.ts';
const TRANSLOCO_LOADER_PATH = '/src/app/core/i18n/transloco-http-loader.ts';
const EN_TRANSLATION_PATH = '/src/assets/i18n/en.json';
const IT_TRANSLATION_PATH = '/src/assets/i18n/it.json';
const RUNTIME_CONFIG_MODEL_PATH = '/src/app/core/runtime-config/runtime-config.model.ts';
const RUNTIME_CONFIG_PARSER_PATH = '/src/app/core/runtime-config/runtime-config.parser.ts';
const RUNTIME_CONFIG_PROVIDER_PATH = '/src/app/core/runtime-config/runtime-config.provider.ts';
const RUNTIME_CONFIG_SERVICE_PATH = '/src/app/core/runtime-config/runtime-config.service.ts';
const RUNTIME_CONFIG_TOKEN_PATH = '/src/app/core/runtime-config/runtime-config.token.ts';
const RUNTIME_VALUES_PATH = '/src/assets/config/values.yml';
const DASHBOARD_SERVICE_PATH = '/src/app/features/dashboard/services/dashboard.service.ts';
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
const TAILWIND_INDEX_PATH = '/src/app/shared/components/tailwind/index.ts';
const TAILWIND_ALERT_PATH = '/src/app/shared/components/tailwind/alert/alert.ts';
const TAILWIND_BADGE_PATH = '/src/app/shared/components/tailwind/badge/badge.ts';
const TAILWIND_BUTTON_PATH = '/src/app/shared/components/tailwind/button/button.ts';
const TAILWIND_CARD_PATH = '/src/app/shared/components/tailwind/card/card.ts';
const TAILWIND_CARD_TEMPLATE_PATH = '/src/app/shared/components/tailwind/card/card.html';
const TAILWIND_INPUT_PATH = '/src/app/shared/components/tailwind/input/input.ts';
const TAILWIND_INPUT_TEMPLATE_PATH = '/src/app/shared/components/tailwind/input/input.html';
const TAILWIND_STYLE_IMPORT = "@use 'tailwindcss';";
const POSTCSS_CONFIG_PATH = '/.postcssrc.json';
const SERVER_PATH = '/src/server.ts';
const APP_ROUTES_PATH = '/src/app/app.routes.ts';
const AI_RUNTIME_PATH = '/src/server/ai/ai.runtime.ts';
const AI_PROVIDER_REGISTRY_PATH = '/src/server/ai/providers/ai-provider.registry.ts';
const AI_PROVIDER_CATALOG_PATH = '/src/server/ai/providers/installed-ai-providers.ts';
const GOOGLE_AI_PROVIDER_PATH = '/src/server/ai/providers/google-gemini.provider.ts';
const AI_SUMMARY_ROUTE_PATH = '/src/server/ai/examples/summary/summary.routes.ts';
const AI_SUMMARY_COMPONENT_PATH =
  '/src/app/features/ai-summary/views/ai-summary/ai-summary.component.ts';

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
    expect(readText(result, STARTER_METADATA_PATH)).toBe(
      [
        '{',
        '  "schemaVersion": 1,',
        '  "baselineVersion": "0.5.0-alpha.0",',
        '  "enabledEvolutions": ["signal-store"]',
        '}',
        '',
      ].join('\n'),
    );
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

  it('evolution installs Transloco i18n baseline', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(runner.callRule(evolution({ name: 'transloco' }), tree));
    const metadata = readMetadata(result);
    const packageJson = readPackageJson(result);
    const angularJson = JSON.parse(readText(result, ANGULAR_JSON_PATH)) as {
      projects: Record<string, { architect: { build: { options: { assets: unknown[] } } } }>;
    };
    const assets =
      angularJson.projects['angular-enterprise-starter'].architect.build.options.assets;

    expect(packageJson.dependencies?.['@jsverse/transloco']).toBe('^8.3.0');
    expect(result.exists(I18N_PROVIDER_PATH)).toBe(true);
    expect(result.exists(TRANSLOCO_LOADER_PATH)).toBe(true);
    expect(result.exists(EN_TRANSLATION_PATH)).toBe(true);
    expect(result.exists(IT_TRANSLATION_PATH)).toBe(true);
    expect(readText(result, I18N_PROVIDER_PATH)).toContain('provideTransloco');
    expect(readText(result, TRANSLOCO_LOADER_PATH)).toContain('./assets/i18n/${lang}.json');
    expect(readText(result, EN_TRANSLATION_PATH)).toContain('"EXAMPLE_GROUP"');
    expect(readText(result, APP_CONFIG_PATH)).toContain(
      "import { provideI18n } from '@core/i18n/i18n.provider';",
    );
    expect(readText(result, APP_CONFIG_PATH)).toContain('provideI18n(),');
    expect(assets).toContainEqual({ glob: '**/*', input: 'src/assets', output: 'assets' });
    expect(metadata.enabledEvolutions).toEqual(['transloco']);
  });

  it('evolution installs runtime config baseline', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(
      runner.callRule(evolution({ name: 'runtime-config' }), tree),
    );
    const metadata = readMetadata(result);
    const packageJson = readPackageJson(result);
    const angularJson = JSON.parse(readText(result, ANGULAR_JSON_PATH)) as {
      projects: Record<
        string,
        {
          architect: {
            build: {
              options: { assets: unknown[]; allowedCommonJsDependencies?: string[] };
              configurations: Record<string, Record<string, unknown>>;
            };
          };
        }
      >;
    };
    const build = angularJson.projects['angular-enterprise-starter'].architect.build;
    const angularJsonContent = readText(result, ANGULAR_JSON_PATH);
    const appConfigContent = readText(result, APP_CONFIG_PATH);
    const dashboardServiceContent = readText(result, DASHBOARD_SERVICE_PATH);
    const tsConfigSpecContent = readText(result, TSCONFIG_SPEC_PATH);

    expect(packageJson.dependencies?.yaml).toBe('^2.9.0');
    expect(result.exists(RUNTIME_CONFIG_MODEL_PATH)).toBe(true);
    expect(result.exists(RUNTIME_CONFIG_PARSER_PATH)).toBe(true);
    expect(result.exists(RUNTIME_CONFIG_PROVIDER_PATH)).toBe(true);
    expect(result.exists(RUNTIME_CONFIG_SERVICE_PATH)).toBe(true);
    expect(result.exists(RUNTIME_CONFIG_TOKEN_PATH)).toBe(true);
    expect(result.exists(RUNTIME_VALUES_PATH)).toBe(true);
    expect(readText(result, RUNTIME_CONFIG_PARSER_PATH)).toContain("parse } from 'yaml'");
    expect(readText(result, RUNTIME_CONFIG_SERVICE_PATH)).toContain('REQUEST, signal');
    expect(readText(result, RUNTIME_VALUES_PATH)).toContain('baseUrl: http://localhost:3000');
    expect(appConfigContent).toContain(
      "import { provideRuntimeConfig } from '@core/runtime-config/runtime-config.provider';",
    );
    expect(appConfigContent).toContain('provideRuntimeConfig(),');
    expect(appConfigContent).not.toContain('provideAppConfig');
    expect(appConfigContent).not.toContain('../environments/environment');
    expect(dashboardServiceContent).toContain(
      "import { RuntimeConfigService } from '@core/runtime-config/runtime-config.service';",
    );
    expect(dashboardServiceContent).toContain(
      [
        '    return this.http.get(',
        '      `${this.runtimeConfig.value().api.dashboard.baseUrl}${dashboardApiRoutes.v2.detail(id)}`,',
        '    );',
      ].join('\n'),
    );
    expect(dashboardServiceContent).not.toContain('APP_CONFIG');
    expect(build.options.assets).toContainEqual({
      glob: '**/*',
      input: 'src/assets',
      output: 'assets',
    });
    expect(build.options.allowedCommonJsDependencies).toContain('yaml');
    expect(angularJsonContent).toContain('"allowedCommonJsDependencies": ["yaml"]');
    expect(build.configurations['development']?.['fileReplacements']).toBeUndefined();
    expect(result.exists(APP_CONFIG_MODEL_PATH)).toBe(false);
    expect(result.exists(ENVIRONMENT_PATH)).toBe(false);
    expect(tsConfigSpecContent).toContain('"include": ["src/**/*.d.ts", "src/**/*.spec.ts"]');
    expect(tsConfigSpecContent).toContain('/* To learn more about TypeScript configuration:');
    expect(tsConfigSpecContent).not.toContain('src/environments/environment.test.ts');
    expect(metadata.enabledEvolutions).toEqual(['runtime-config']);
  });

  it('evolution blocks Runtime Config when tsconfig.spec.json contains invalid JSONC', async () => {
    const tree = createStarterTree();
    tree.overwrite(TSCONFIG_SPEC_PATH, '{ "include": [');

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'runtime-config' }), tree)),
    ).rejects.toThrow(
      'tsconfig.spec.json is not valid JSONC. Correct it before applying Runtime Config.',
    );
  });

  it('evolution fails before overwriting existing runtime config files', async () => {
    const tree = createStarterTree();
    tree.create(RUNTIME_CONFIG_SERVICE_PATH, '');

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'runtime-config' }), tree)),
    ).rejects.toThrow('Runtime config files already exist');
  });

  it('evolution blocks runtime config when custom files still use APP_CONFIG', async () => {
    const tree = createStarterTree();
    tree.create(
      '/src/app/features/orders/services/orders.service.ts',
      `import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '@core/config/app-config.token';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly config = inject(APP_CONFIG);

  public readonly baseUrl = this.config.api.dashboard;
}
`,
    );

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'runtime-config' }), tree)),
    ).rejects.toThrow('src/app/features/orders/services/orders.service.ts');

    expect(tree.exists(APP_CONFIG_MODEL_PATH)).toBe(true);
    expect(tree.exists(ENVIRONMENT_PATH)).toBe(true);
    expect(tree.exists(RUNTIME_CONFIG_SERVICE_PATH)).toBe(false);
  });

  it('evolution blocks runtime config when DashboardService has custom APP_CONFIG usage', async () => {
    const tree = createStarterTree();

    tree.overwrite(
      DASHBOARD_SERVICE_PATH,
      `import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { dashboardApiRoutes } from '@core/api/dashboard-api.routes';
import { APP_CONFIG } from '@core/config/app-config.token';
import { type Observable } from 'rxjs';

@Injectable()
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  public getDashboardDetail(id: string): Observable<unknown> {
    return this.http.get(\`${'${this.config.api.dashboard}'}${'${dashboardApiRoutes.v2.detail(id)}'}\`);
  }

  public getDashboardBaseUrl(): string {
    return this.config.api.dashboard;
  }
}
`,
    );

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'runtime-config' }), tree)),
    ).rejects.toThrow('src/app/features/dashboard/services/dashboard.service.ts');

    expect(tree.exists(APP_CONFIG_MODEL_PATH)).toBe(true);
    expect(tree.exists(ENVIRONMENT_PATH)).toBe(true);
    expect(tree.exists(RUNTIME_CONFIG_SERVICE_PATH)).toBe(false);
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
    expect(readText(result, BOOTSTRAP_BUTTON_PATH)).toContain("selector: 'app-bootstrap-button'");
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

  it('evolution installs Tailwind dependencies and preserves existing global styles', async () => {
    const tree = createStarterTree();
    tree.create(GLOBAL_STYLES_PATH, 'body { margin: 0; }\n');

    const result = await lastValueFrom(runner.callRule(evolution({ name: 'tailwind' }), tree));
    const metadata = readMetadata(result);
    const packageJson = readPackageJson(result);
    const stylesContent = readText(result, GLOBAL_STYLES_PATH);
    const postcssConfig = JSON.parse(readText(result, POSTCSS_CONFIG_PATH)) as {
      plugins?: Record<string, unknown>;
    };

    expect(packageJson.devDependencies?.tailwindcss).toBe('^4.3.0');
    expect(packageJson.devDependencies?.['@tailwindcss/postcss']).toBe('^4.3.0');
    expect(packageJson.devDependencies?.postcss).toBe('^8.5.14');
    expect(postcssConfig.plugins?.['@tailwindcss/postcss']).toEqual({});
    expect(stylesContent).toBe(`${TAILWIND_STYLE_IMPORT}\n\nbody { margin: 0; }\n`);
    expect(result.exists(TAILWIND_ALERT_PATH)).toBe(true);
    expect(result.exists(TAILWIND_BADGE_PATH)).toBe(true);
    expect(result.exists(TAILWIND_BUTTON_PATH)).toBe(true);
    expect(result.exists(TAILWIND_CARD_PATH)).toBe(true);
    expect(result.exists(TAILWIND_INPUT_PATH)).toBe(true);
    expect(readText(result, TAILWIND_BUTTON_PATH)).toContain("selector: 'app-tailwind-button'");
    expect(readText(result, TAILWIND_BUTTON_PATH)).toContain('readonly variant = input');
    expect(readText(result, TAILWIND_CARD_PATH)).toContain('readonly imageSrc = input');
    expect(readText(result, TAILWIND_CARD_TEMPLATE_PATH)).toContain('rounded-xl');
    expect(readText(result, TAILWIND_INPUT_PATH)).toContain('readonly label = input');
    expect(readText(result, TAILWIND_INPUT_TEMPLATE_PATH)).toContain('text-slate-700');
    expect(readText(result, TAILWIND_INDEX_PATH)).toContain(
      "export { TailwindButton } from './button/button';",
    );
    expect(metadata.enabledEvolutions).toEqual(['tailwind']);
  });

  it('evolution installs only selected Tailwind components when requested', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(
      runner.callRule(
        evolution({
          name: 'tailwind',
          tailwindMode: 'select',
          tailwindComponents: 'button,input',
        }),
        tree,
      ),
    );

    expect(result.exists(TAILWIND_BUTTON_PATH)).toBe(true);
    expect(result.exists(TAILWIND_INPUT_PATH)).toBe(true);
    expect(result.exists(TAILWIND_CARD_PATH)).toBe(false);
    expect(readText(result, TAILWIND_INDEX_PATH)).toContain(
      "export { TailwindButton } from './button/button';",
    );
    expect(readText(result, TAILWIND_INDEX_PATH)).toContain(
      "export { TailwindInput } from './input/input';",
    );
    expect(readText(result, TAILWIND_INDEX_PATH)).not.toContain('TailwindCard');
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

  it('evolution defaults to the server-only AI Genkit foundation without examples', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(runner.callRule(evolution({ name: 'ai-genkit' }), tree));
    const packageJson = readPackageJson(result);
    const metadata = readMetadata(result);

    expect(result.exists(AI_RUNTIME_PATH)).toBe(true);
    expect(result.exists(AI_PROVIDER_REGISTRY_PATH)).toBe(true);
    expect(result.exists(AI_PROVIDER_CATALOG_PATH)).toBe(true);
    expect(result.exists(AI_SUMMARY_ROUTE_PATH)).toBe(false);
    expect(result.exists(AI_SUMMARY_COMPONENT_PATH)).toBe(false);
    expect(packageJson.dependencies?.genkit).toBe('^1.40.0');
    expect(packageJson.dependencies?.['@genkit-ai/google-genai']).toBe('^1.40.0');
    expect(readText(result, '/.env.example')).toContain(
      'AI_GENKIT_GOOGLE_AI_MODEL=gemini-3.5-flash',
    );
    expect(readText(result, '/.env.example')).toContain(
      'GEMINI_API_KEY=replace-with-server-side-api-key',
    );
    expect(result.exists('/.env')).toBe(false);
    expect(readText(result, SERVER_PATH)).not.toContain('createAiSummaryRouter');
    expect(readText(result, AI_PROVIDER_CATALOG_PATH)).toContain('// <ai-genkit-provider-imports>');
    expect(readText(result, AI_PROVIDER_CATALOG_PATH)).toContain('googleGeminiProviderDefinition,');
    expect(metadata.enabledEvolutions).toEqual(['ai-genkit']);
  });

  it('evolution installs the removable standard and streaming AI summary example', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(
      runner.callRule(evolution({ name: 'ai-genkit', aiExample: 'summary' }), tree),
    );

    expect(result.exists(AI_SUMMARY_ROUTE_PATH)).toBe(true);
    expect(result.exists(AI_SUMMARY_COMPONENT_PATH)).toBe(true);
    expect(readText(result, SERVER_PATH)).toContain("app.use('/api/ai', createAiSummaryRouter());");
    expect(readText(result, APP_ROUTES_PATH)).toContain("path: 'ai-summary'");
    expect(readText(result, '/.env.example')).toContain(
      'AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE=false',
    );
    expect(readText(result, '/src/app/layout/sidebar/sidebar.html')).toBe('');
  });

  it('composes Runtime Config followed by the AI Genkit summary example', async () => {
    const tree = createStarterTree();
    const runtimeConfig = await lastValueFrom(
      runner.callRule(evolution({ name: 'runtime-config' }), tree),
    );
    const runtimeValues = readText(runtimeConfig, RUNTIME_VALUES_PATH);

    const result = await lastValueFrom(
      runner.callRule(evolution({ name: 'ai-genkit', aiExample: 'summary' }), runtimeConfig),
    );

    expect(readText(result, RUNTIME_VALUES_PATH)).toBe(runtimeValues);
    expect(runtimeValues).not.toContain('GEMINI_API_KEY');
    expect(result.exists(RUNTIME_CONFIG_SERVICE_PATH)).toBe(true);
    expect(result.exists(AI_SUMMARY_ROUTE_PATH)).toBe(true);
    expect(result.exists(AI_SUMMARY_COMPONENT_PATH)).toBe(true);
    expect(readText(result, '/.env.example')).toContain(
      'GEMINI_API_KEY=replace-with-server-side-api-key',
    );
    expect(readText(result, '/.env.example')).toContain(
      'AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE=false',
    );
    const dependencyNames = Object.keys(readPackageJson(result).dependencies ?? {});
    expect(dependencyNames).toEqual(
      [...dependencyNames].sort((first, second) => first.localeCompare(second)),
    );
    expect(readMetadata(result).enabledEvolutions).toEqual(['ai-genkit', 'runtime-config']);
  });

  it('composes the AI Genkit summary example followed by Runtime Config', async () => {
    const tree = createStarterTree();
    const aiGenkit = await lastValueFrom(
      runner.callRule(evolution({ name: 'ai-genkit', aiExample: 'summary' }), tree),
    );
    const serverEnvironment = readText(aiGenkit, '/.env.example');
    const providerCatalog = readText(aiGenkit, AI_PROVIDER_CATALOG_PATH);
    const server = readText(aiGenkit, SERVER_PATH);

    const result = await lastValueFrom(
      runner.callRule(evolution({ name: 'runtime-config' }), aiGenkit),
    );

    expect(readText(result, '/.env.example')).toBe(serverEnvironment);
    expect(readText(result, AI_PROVIDER_CATALOG_PATH)).toBe(providerCatalog);
    expect(readText(result, SERVER_PATH)).toBe(server);
    expect(readText(result, RUNTIME_VALUES_PATH)).not.toContain('GEMINI_API_KEY');
    expect(result.exists(RUNTIME_CONFIG_SERVICE_PATH)).toBe(true);
    expect(result.exists(AI_SUMMARY_ROUTE_PATH)).toBe(true);
    expect(result.exists(AI_SUMMARY_COMPONENT_PATH)).toBe(true);
    expect(readMetadata(result).enabledEvolutions).toEqual(['ai-genkit', 'runtime-config']);
  });

  it('evolution can add the summary example after installing the AI foundation', async () => {
    const tree = createStarterTree();
    const foundation = await lastValueFrom(
      runner.callRule(evolution({ name: 'ai-genkit', aiExample: 'none' }), tree),
    );
    const foundationEnvironment = readText(foundation, '/.env.example');
    const result = await lastValueFrom(
      runner.callRule(evolution({ name: 'ai-genkit', aiExample: 'summary' }), foundation),
    );

    expect(result.exists(AI_SUMMARY_ROUTE_PATH)).toBe(true);
    expect(foundationEnvironment).not.toContain('AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE');
    expect(readText(result, '/.env.example')).toContain(
      'AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE=false',
    );
    expect(readMetadata(result).enabledEvolutions).toEqual(['ai-genkit']);
  });

  it('evolution preserves other managed provider catalog entries on repeat', async () => {
    const tree = createStarterTree();
    const foundation = await lastValueFrom(runner.callRule(evolution({ name: 'ai-genkit' }), tree));
    const catalog = readText(foundation, AI_PROVIDER_CATALOG_PATH)
      .replace(
        '// </ai-genkit-provider-imports>',
        "import { futureProviderDefinition } from './future.provider.definition';\n// </ai-genkit-provider-imports>",
      )
      .replace(
        '  // </ai-genkit-provider-entries>',
        '  futureProviderDefinition,\n  // </ai-genkit-provider-entries>',
      );
    foundation.overwrite(AI_PROVIDER_CATALOG_PATH, catalog);

    const result = await lastValueFrom(
      runner.callRule(evolution({ name: 'ai-genkit' }), foundation),
    );

    expect(readText(result, AI_PROVIDER_CATALOG_PATH)).toContain(
      "import { futureProviderDefinition } from './future.provider.definition';",
    );
    expect(readText(result, AI_PROVIDER_CATALOG_PATH)).toContain('futureProviderDefinition,');
  });

  it('evolution stops on a partial AI Genkit core', async () => {
    const tree = createStarterTree();
    tree.create(AI_RUNTIME_PATH, '');

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'ai-genkit', aiExample: 'none' }), tree)),
    ).rejects.toThrow('AI Genkit core installation is incomplete.');
  });

  it('evolution stops on a partial provider adapter', async () => {
    const tree = createStarterTree();
    tree.create(GOOGLE_AI_PROVIDER_PATH, '');

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'ai-genkit' }), tree)),
    ).rejects.toThrow('google-ai AI Genkit provider adapter installation is incomplete.');
  });

  it('evolution stops when managed provider catalog markers are incomplete', async () => {
    const tree = createStarterTree();
    const foundation = await lastValueFrom(runner.callRule(evolution({ name: 'ai-genkit' }), tree));
    foundation.overwrite(
      AI_PROVIDER_CATALOG_PATH,
      readText(foundation, AI_PROVIDER_CATALOG_PATH).replace(
        '// </ai-genkit-provider-entries>',
        '',
      ),
    );

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'ai-genkit' }), foundation)),
    ).rejects.toThrow('managed AI provider catalog markers are missing');
  });

  it('evolution stops on a partial provider environment configuration', async () => {
    const tree = createStarterTree();
    tree.create('/.env.example', 'AI_GENKIT_GOOGLE_AI_ENABLED=true\n');

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'ai-genkit' }), tree)),
    ).rejects.toThrow('.env.example contains a partial google-ai provider configuration.');
  });

  it('evolution rejects an older existing Genkit dependency', async () => {
    const tree = createStarterTree();
    const packageJson = readPackageJson(tree);
    packageJson.dependencies = {
      ...packageJson.dependencies,
      genkit: '^1.20.0',
    };
    tree.overwrite(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));

    await expect(
      lastValueFrom(runner.callRule(evolution({ name: 'ai-genkit', aiExample: 'none' }), tree)),
    ).rejects.toThrow('genkit ^1.20.0 is not compatible with the required ^1.40.0 range.');
  });

  it('AI Genkit preview does not create files or update metadata', async () => {
    const tree = createStarterTree();

    const result = await lastValueFrom(
      runner.callRule(evolution({ name: 'ai-genkit', aiExample: 'summary', preview: true }), tree),
    );

    expect(result.exists(AI_RUNTIME_PATH)).toBe(false);
    expect(result.exists(AI_SUMMARY_COMPONENT_PATH)).toBe(false);
    expect(readMetadata(result).enabledEvolutions).toEqual([]);
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
      'ai-genkit',
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
        baselineVersion: '0.5.0-alpha.0',
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
    DASHBOARD_SERVICE_PATH,
    `import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { dashboardApiRoutes } from '@core/api/dashboard-api.routes';
import { APP_CONFIG } from '@core/config/app-config.token';
import { type Observable } from 'rxjs';

@Injectable()
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  public getDashboardDetail(id: string): Observable<unknown> {
    return this.http.get(\`${'${this.config.api.dashboard}'}${'${dashboardApiRoutes.v2.detail(id)}'}\`);
  }
}
`,
  );

  tree.create(
    PACKAGE_JSON_PATH,
    JSON.stringify(
      {
        name: 'angular-enterprise-starter',
        dependencies: {
          '@angular/core': '^21.2.0',
          '@angular/ssr': '^21.2.3',
          express: '^5.1.0',
        },
      },
      null,
      2,
    ),
  );

  tree.create(
    ANGULAR_JSON_PATH,
    JSON.stringify(
      {
        projects: {
          'angular-enterprise-starter': {
            architect: {
              build: {
                options: {
                  assets: [{ glob: '**/*', input: 'public' }],
                },
                configurations: {
                  development: {
                    fileReplacements: [
                      {
                        replace: 'src/environments/environment.ts',
                        with: 'src/environments/environment.dev.ts',
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      null,
      2,
    ),
  );

  tree.create(
    TSCONFIG_SPEC_PATH,
    `/* To learn more about TypeScript configuration: https://www.typescriptlang.org/tsconfig. */
{
  "include": ["src/**/*.d.ts", "src/**/*.spec.ts", "src/environments/environment.test.ts"]
}
`,
  );

  tree.create(APP_CONFIG_MODEL_PATH, '');
  tree.create('/src/app/core/config/app-config.provider.ts', '');
  tree.create('/src/app/core/config/app-config.token.ts', '');
  tree.create('/src/app/core/config/app-environment.type.ts', '');
  tree.create(ENVIRONMENT_PATH, '');
  tree.create('/src/environments/environment.local.ts', '');
  tree.create('/src/environments/environment.dev.ts', '');
  tree.create('/src/environments/environment.test.ts', '');
  tree.create('/src/environments/environment.prod.ts', '');
  tree.create('/src/app/layout/sidebar/sidebar.html', '');
  tree.create('/src/app/layout/sidebar/sidebar.scss', '');
  tree.create('/.gitignore', 'node_modules\n');
  tree.create(
    APP_ROUTES_PATH,
    `import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((routes) => routes.dashboardRoutes),
  },
];
`,
  );
  tree.create(
    SERVER_PATH,
    `import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';

const app = express();
const angularApp = new AngularNodeAppEngine();

export const reqHandler = createNodeRequestHandler(app);
`,
  );

  tree.create(
    APP_CONFIG_PATH,
    `import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAppConfig } from '@core/config/app-config.provider';
import { correlationIdInterceptor } from '@core/interceptors/correlation-id.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppConfig(environment),
    provideHttpClient(withFetch(), withInterceptors([correlationIdInterceptor, errorInterceptor])),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
  ],
};
`,
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

function readPackageJson(tree: Tree): {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
} {
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
