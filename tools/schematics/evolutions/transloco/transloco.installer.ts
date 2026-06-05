import { SchematicsException, type SchematicContext, type Tree } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import { type EvolutionDefinition } from '../evolution-definition';

const TRANSLOCO_VERSION = '^8.3.0';
const PACKAGE_JSON_PATH = '/package.json';
const ANGULAR_JSON_PATH = '/angular.json';
const APP_CONFIG_PATH = '/src/app/app.config.ts';
const I18N_PROVIDER_PATH = '/src/app/core/i18n/i18n.provider.ts';
const TRANSLOCO_LOADER_PATH = '/src/app/core/i18n/transloco-http-loader.ts';
const EN_TRANSLATION_PATH = '/src/assets/i18n/en.json';
const IT_TRANSLATION_PATH = '/src/assets/i18n/it.json';
const GENERATED_FILES = [
  I18N_PROVIDER_PATH,
  TRANSLOCO_LOADER_PATH,
  EN_TRANSLATION_PATH,
  IT_TRANSLATION_PATH,
] as const;

interface AngularJson {
  projects?: Record<
    string,
    {
      architect?: {
        build?: {
          options?: {
            assets?: unknown[];
          };
        };
      };
    }
  >;
  [key: string]: unknown;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export function installTranslocoEvolution(
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
  _options: EvolutionOptions,
): void {
  validateTranslocoInstallation(tree);
  addPackageDependency(tree, '@jsverse/transloco', TRANSLOCO_VERSION);
  addAssetsEntry(tree);
  createFile(tree, I18N_PROVIDER_PATH, createI18nProviderContent());
  createFile(tree, TRANSLOCO_LOADER_PATH, createTranslocoLoaderContent());
  createFile(tree, EN_TRANSLATION_PATH, createEnglishTranslationContent());
  createFile(tree, IT_TRANSLATION_PATH, createItalianTranslationContent());
  updateAppConfig(tree);

  context.logger.info(`${definition.label} files created.`);
  context.logger.info('Run npm install to update the package lock before running quality checks.');
}

function validateTranslocoInstallation(tree: Tree): void {
  if (!tree.exists(PACKAGE_JSON_PATH)) {
    throw new SchematicsException('Missing package.json. Cannot add Transloco dependency.');
  }

  if (!tree.exists(ANGULAR_JSON_PATH)) {
    throw new SchematicsException('Missing angular.json. Cannot register i18n assets.');
  }

  if (!tree.exists(APP_CONFIG_PATH)) {
    throw new SchematicsException(
      'Missing src/app/app.config.ts. Cannot register Transloco provider.',
    );
  }

  const existingFiles = GENERATED_FILES.filter((path) => tree.exists(path));

  if (existingFiles.length > 0) {
    throw new SchematicsException(`Transloco files already exist: ${existingFiles.join(', ')}.`);
  }
}

function addPackageDependency(tree: Tree, packageName: string, version: string): void {
  const packageJson = JSON.parse(tree.readText(PACKAGE_JSON_PATH)) as PackageJson;

  if (packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName]) {
    return;
  }

  packageJson.dependencies = sortObject({
    ...packageJson.dependencies,
    [packageName]: version,
  });

  tree.overwrite(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function addAssetsEntry(tree: Tree): void {
  const angularJson = JSON.parse(tree.readText(ANGULAR_JSON_PATH)) as AngularJson;
  const firstProject = Object.values(angularJson.projects ?? {})[0];
  const buildOptions = firstProject?.architect?.build?.options;

  if (!buildOptions) {
    throw new SchematicsException(
      'Missing build options in angular.json. Cannot register i18n assets.',
    );
  }

  buildOptions.assets ??= [];

  const hasAssetsEntry = buildOptions.assets.some((asset) => {
    return (
      (typeof asset === 'string' && asset === 'src/assets') ||
      (typeof asset === 'object' &&
        asset !== null &&
        'input' in asset &&
        asset.input === 'src/assets')
    );
  });

  if (hasAssetsEntry) {
    return;
  }

  buildOptions.assets.push({
    glob: '**/*',
    input: 'src/assets',
    output: 'assets',
  });

  tree.overwrite(ANGULAR_JSON_PATH, `${JSON.stringify(angularJson, null, 2)}\n`);
}

function updateAppConfig(tree: Tree): void {
  let appConfigContent = tree.readText(APP_CONFIG_PATH);

  if (!appConfigContent.includes('@core/i18n/i18n.provider')) {
    appConfigContent = addI18nImport(appConfigContent);
  }

  if (!appConfigContent.includes('provideI18n()')) {
    appConfigContent = addI18nProvider(appConfigContent);
  }

  tree.overwrite(APP_CONFIG_PATH, appConfigContent);
}

function addI18nImport(appConfigContent: string): string {
  const configImport = "import { provideAppConfig } from '@core/config/app-config.provider';\n";

  if (appConfigContent.includes(configImport)) {
    return appConfigContent.replace(
      configImport,
      `${configImport}import { provideI18n } from '@core/i18n/i18n.provider';\n`,
    );
  }

  return `import { provideI18n } from '@core/i18n/i18n.provider';\n${appConfigContent}`;
}

function addI18nProvider(appConfigContent: string): string {
  const configProvider = '    provideAppConfig(environment),\n';

  if (appConfigContent.includes(configProvider)) {
    return appConfigContent.replace(configProvider, `${configProvider}    provideI18n(),\n`);
  }

  const routerProvider = '    provideRouter(routes),\n';

  if (appConfigContent.includes(routerProvider)) {
    return appConfigContent.replace(routerProvider, `    provideI18n(),\n${routerProvider}`);
  }

  throw new SchematicsException('Missing known provider anchor in app.config.ts.');
}

function createFile(tree: Tree, path: string, content: string): void {
  if (tree.exists(path)) {
    throw new SchematicsException(`Cannot create ${path}. File already exists.`);
  }

  tree.create(path, content);
}

function createI18nProviderContent(): string {
  return `import { isDevMode, type Provider } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';

import { TranslocoHttpLoader } from './transloco-http-loader';

export const provideI18n = (): Provider =>
  provideTransloco({
    config: {
      availableLangs: ['en', 'it'],
      defaultLang: 'en',
      fallbackLang: 'en',
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
    },
    loader: TranslocoHttpLoader,
  });
`;
}

function createTranslocoLoaderContent(): string {
  return `import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Translation, type TranslocoLoader } from '@jsverse/transloco';
import { type Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  public getTranslation(lang: string): Observable<Translation> {
    return this.http.get<Translation>(\`./assets/i18n/\${lang}.json\`);
  }
}
`;
}

function createEnglishTranslationContent(): string {
  return `{
  "EXAMPLE": "Example",
  "EXAMPLE_GROUP": {
    "DESCRIPTION": "Description",
    "TITLE": "Title"
  }
}
`;
}

function createItalianTranslationContent(): string {
  return `{
  "EXAMPLE": "Esempio",
  "EXAMPLE_GROUP": {
    "DESCRIPTION": "Descrizione",
    "TITLE": "Titolo"
  }
}
`;
}

function sortObject(value: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).sort(([first], [second]) => first.localeCompare(second)),
  );
}
