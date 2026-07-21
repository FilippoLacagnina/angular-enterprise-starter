import { SchematicsException, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { applyEdits, modify } from 'jsonc-parser';

import { getEvolutionDependencyRequirement } from '../../evolution/evolution-manifest';
import { type EvolutionOptions } from '../../evolution/schema';
import { ensurePackageDependency } from '../../shared/package-dependency';
import {
  type EvolutionDefinition,
  EvolutionUserActionRequiredError,
} from '../evolution-definition';
import { type TranslocoInstallPlan, type TranslocoTranslationSeed } from './transloco.model';
import {
  createTranslocoInstallPlan,
  getTranslocoGeneratedFiles,
  getTranslocoTranslationPath,
  I18N_CONFIG_PATH,
  I18N_PROVIDER_PATH,
  TRANSLOCO_LOADER_PATH,
} from './transloco.plan';

const TRANSLOCO_DEPENDENCY = getEvolutionDependencyRequirement('transloco', '@jsverse/transloco');
const ANGULAR_JSON_PATH = '/angular.json';
const APP_CONFIG_PATH = '/src/app/app.config.ts';

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

export function installTranslocoEvolution(
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
  options: EvolutionOptions,
): void {
  const plan = createTranslocoInstallPlan(options);

  validateTranslocoInstallation(tree, plan);
  ensurePackageDependency(tree, TRANSLOCO_DEPENDENCY);
  addAssetsEntry(tree);
  createFile(tree, I18N_CONFIG_PATH, createI18nConfigContent(plan));
  createFile(tree, I18N_PROVIDER_PATH, createI18nProviderContent());
  createFile(tree, TRANSLOCO_LOADER_PATH, createTranslocoLoaderContent());

  for (const language of plan.languages) {
    createFile(
      tree,
      getTranslocoTranslationPath(language.code),
      createTranslationContent(language.translation),
    );
  }

  updateAppConfig(tree);

  context.logger.info(
    `${definition.label} configured for: ${plan.languages.map((language) => language.code).join(', ')}.`,
  );
  context.logger.info(`Default and fallback language: ${plan.defaultLanguage}.`);
  context.logger.info('Run npm install to update the package lock before running quality checks.');
}

function validateTranslocoInstallation(tree: Tree, plan: TranslocoInstallPlan): void {
  const existingFiles = getTranslocoGeneratedFiles(plan).filter((path) => tree.exists(path));
  const blockingNotes = getTranslocoPreflightBlockingNotes(tree);

  if (existingFiles.length > 0) {
    blockingNotes.unshift(`Transloco files already exist: ${existingFiles.join(', ')}.`);
  }

  if (blockingNotes.length > 0) {
    throw new EvolutionUserActionRequiredError(
      `Transloco preflight failed:\n- ${blockingNotes.join('\n- ')}`,
    );
  }
}

export function getTranslocoPreflightBlockingNotes(tree: Tree): string[] {
  const blockingNotes: string[] = [];

  inspectAngularJson(tree, blockingNotes);
  inspectAppConfig(tree, blockingNotes);

  return blockingNotes;
}

function inspectAngularJson(tree: Tree, blockingNotes: string[]): void {
  if (!tree.exists(ANGULAR_JSON_PATH)) {
    blockingNotes.push('Missing angular.json. Cannot register i18n assets.');
    return;
  }

  try {
    const angularJson = JSON.parse(tree.readText(ANGULAR_JSON_PATH)) as AngularJson;
    const firstProject = Object.values(angularJson.projects ?? {})[0];
    const buildOptions = firstProject?.architect?.build?.options;

    if (!buildOptions) {
      blockingNotes.push('Missing build options in angular.json. Cannot register i18n assets.');
      return;
    }

    if (buildOptions.assets !== undefined && !Array.isArray(buildOptions.assets)) {
      blockingNotes.push('angular.json build assets must be an array.');
    }
  } catch {
    blockingNotes.push('angular.json contains invalid JSON.');
  }
}

function inspectAppConfig(tree: Tree, blockingNotes: string[]): void {
  if (!tree.exists(APP_CONFIG_PATH)) {
    blockingNotes.push('Missing src/app/app.config.ts. Cannot register Transloco provider.');
    return;
  }

  const content = tree.readText(APP_CONFIG_PATH);

  if (
    !content.includes('provideI18n()') &&
    !content.includes('    provideAppConfig(environment),\n') &&
    !content.includes('    provideRouter(routes),\n')
  ) {
    blockingNotes.push(
      'src/app/app.config.ts does not contain a supported provider anchor for Transloco.',
    );
  }
}

function addAssetsEntry(tree: Tree): void {
  const angularJsonContent = tree.readText(ANGULAR_JSON_PATH);
  const angularJson = JSON.parse(angularJsonContent) as AngularJson;
  const [firstProjectName] = Object.keys(angularJson.projects ?? {});
  const firstProject = firstProjectName ? angularJson.projects?.[firstProjectName] : undefined;
  const buildOptions = firstProject?.architect?.build?.options;

  if (!firstProjectName || !buildOptions) {
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

  tree.overwrite(
    ANGULAR_JSON_PATH,
    applyEdits(
      angularJsonContent,
      modify(
        angularJsonContent,
        ['projects', firstProjectName, 'architect', 'build', 'options', 'assets'],
        [
          ...buildOptions.assets,
          {
            glob: '**/*',
            input: 'src/assets',
            output: 'assets',
          },
        ],
        {
          formattingOptions: {
            eol: '\n',
            insertSpaces: true,
            tabSize: 2,
          },
        },
      ),
    ),
  );
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

function createI18nConfigContent(plan: TranslocoInstallPlan): string {
  const languageCodes = plan.languages.map((language) => `'${language.code}'`).join(', ');

  return `export const SUPPORTED_LANGUAGES = [${languageCodes}] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = '${plan.defaultLanguage}';
export const FALLBACK_LANGUAGE: SupportedLanguage = DEFAULT_LANGUAGE;
`;
}

function createI18nProviderContent(): string {
  return `import { isDevMode, type Provider } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';

import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from './i18n.config';
import { TranslocoHttpLoader } from './transloco-http-loader';

export const provideI18n = (): Provider =>
  provideTransloco({
    config: {
      availableLangs: [...SUPPORTED_LANGUAGES],
      defaultLang: DEFAULT_LANGUAGE,
      fallbackLang: FALLBACK_LANGUAGE,
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

function createTranslationContent(translation: TranslocoTranslationSeed): string {
  return `${JSON.stringify(
    {
      EXAMPLE: translation.example,
      EXAMPLE_GROUP: {
        DESCRIPTION: translation.description,
        TITLE: translation.title,
      },
    },
    null,
    2,
  )}\n`;
}
