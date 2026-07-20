import { SchematicsException, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import {
  applyEdits,
  findNodeAtLocation,
  modify,
  parse,
  parseTree,
  type JSONPath,
  type Node,
  type ParseError,
} from 'jsonc-parser';

import { getEvolutionDependencyRequirements } from '../../evolution/evolution-manifest';
import { type EvolutionOptions } from '../../evolution/schema';
import { ensurePackageDependencies } from '../../shared/package-dependency';
import {
  EvolutionUserActionRequiredError,
  type EvolutionDefinition,
} from '../evolution-definition';

const RUNTIME_CONFIG_DEPENDENCIES = getEvolutionDependencyRequirements('runtime-config');
const PACKAGE_JSON_PATH = '/package.json';
const ANGULAR_JSON_PATH = '/angular.json';
const APP_CONFIG_PATH = '/src/app/app.config.ts';
const DASHBOARD_SERVICE_PATH = '/src/app/features/dashboard/services/dashboard.service.ts';
const TSCONFIG_SPEC_PATH = '/tsconfig.spec.json';
const RUNTIME_CONFIG_MODEL_PATH = '/src/app/core/runtime-config/runtime-config.model.ts';
const RUNTIME_CONFIG_PARSER_PATH = '/src/app/core/runtime-config/runtime-config.parser.ts';
const RUNTIME_CONFIG_PROVIDER_PATH = '/src/app/core/runtime-config/runtime-config.provider.ts';
const RUNTIME_CONFIG_SERVICE_PATH = '/src/app/core/runtime-config/runtime-config.service.ts';
const RUNTIME_CONFIG_TOKEN_PATH = '/src/app/core/runtime-config/runtime-config.token.ts';
const VALUES_YML_PATH = '/src/assets/config/values.yml';
const RUNTIME_CONFIG_FILES = [
  RUNTIME_CONFIG_MODEL_PATH,
  RUNTIME_CONFIG_PARSER_PATH,
  RUNTIME_CONFIG_PROVIDER_PATH,
  RUNTIME_CONFIG_SERVICE_PATH,
  RUNTIME_CONFIG_TOKEN_PATH,
  VALUES_YML_PATH,
] as const;
const BASELINE_CONFIG_FILES = [
  '/src/app/core/config/app-config.model.ts',
  '/src/app/core/config/app-config.provider.ts',
  '/src/app/core/config/app-config.token.ts',
  '/src/app/core/config/app-environment.type.ts',
] as const;
const BASELINE_ENVIRONMENT_FILES = [
  '/src/environments/environment.ts',
  '/src/environments/environment.local.ts',
  '/src/environments/environment.dev.ts',
  '/src/environments/environment.test.ts',
  '/src/environments/environment.prod.ts',
] as const;
const MANAGED_DASHBOARD_SERVICE_REFERENCES = [
  "import { APP_CONFIG } from '@core/config/app-config.token';\n",
  '  private readonly config = inject(APP_CONFIG);\n',
  '`${this.config.api.dashboard}${dashboardApiRoutes.v2.detail(id)}`',
] as const;
const MANAGED_APP_CONFIG_REFERENCES = [
  "import { provideAppConfig } from '@core/config/app-config.provider';\n",
  "import { environment } from '../environments/environment';\n",
  '    provideAppConfig(environment),\n',
] as const;
const UNSUPPORTED_ENVIRONMENT_CONFIG_REFERENCE_PATTERN =
  /@core\/config|APP_CONFIG|provideAppConfig|(?:\.\.\/)+environments\/environment|src\/environments/;

interface AngularJson {
  projects?: Record<
    string,
    {
      architect?: {
        build?: {
          options?: {
            assets?: unknown[];
            allowedCommonJsDependencies?: string[];
          };
          configurations?: Record<string, Record<string, unknown>>;
        };
      };
    }
  >;
  [key: string]: unknown;
}

interface TsConfigSpec {
  include?: string[];
  [key: string]: unknown;
}

export function installRuntimeConfigEvolution(
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
  _options: EvolutionOptions,
): void {
  validateRuntimeConfigInstallation(tree);
  ensurePackageDependencies(tree, RUNTIME_CONFIG_DEPENDENCIES);
  updateAngularJson(tree);
  updateAppConfig(tree);
  updateDashboardService(tree);
  updateTsConfigSpec(tree);
  createFile(tree, RUNTIME_CONFIG_MODEL_PATH, createRuntimeConfigModelContent());
  createFile(tree, RUNTIME_CONFIG_PARSER_PATH, createRuntimeConfigParserContent());
  createFile(tree, RUNTIME_CONFIG_PROVIDER_PATH, createRuntimeConfigProviderContent());
  createFile(tree, RUNTIME_CONFIG_SERVICE_PATH, createRuntimeConfigServiceContent());
  createFile(tree, RUNTIME_CONFIG_TOKEN_PATH, createRuntimeConfigTokenContent());
  createFile(tree, VALUES_YML_PATH, createValuesYmlContent());
  deleteBaselineConfigurationFiles(tree);

  context.logger.info(`${definition.label} files created.`);
  context.logger.info('Runtime config now loads deployable assets/config/values.yml at startup.');
  context.logger.info('Run npm install to update the package lock before running quality checks.');
}

function validateRuntimeConfigInstallation(tree: Tree): void {
  const blockingNotes = getRuntimeConfigPreflightBlockingNotes(tree);

  if (blockingNotes.length > 0) {
    throw new EvolutionUserActionRequiredError(
      `Runtime Config preflight failed:\n- ${blockingNotes.join('\n- ')}`,
    );
  }
}

export function getRuntimeConfigPreflightBlockingNotes(tree: Tree): string[] {
  const blockingNotes: string[] = [];

  if (!tree.exists(PACKAGE_JSON_PATH)) {
    blockingNotes.push('Missing package.json. Cannot add runtime config dependency.');
  }

  inspectRuntimeConfigAngularJson(tree, blockingNotes);
  inspectRuntimeConfigAppConfig(tree, blockingNotes);

  const existingFiles = RUNTIME_CONFIG_FILES.filter((path) => tree.exists(path));

  if (existingFiles.length > 0) {
    blockingNotes.push(`Runtime config files already exist: ${existingFiles.join(', ')}.`);
  }

  const unsupportedReferences = collectUnsupportedEnvironmentConfigReferences(tree);

  if (unsupportedReferences.length > 0) {
    blockingNotes.push(createUnsupportedReferencesMessage(unsupportedReferences));
  }

  if (tree.exists(TSCONFIG_SPEC_PATH)) {
    try {
      parseTsConfigSpec(tree.readText(TSCONFIG_SPEC_PATH));
    } catch (error) {
      blockingNotes.push(error instanceof Error ? error.message : String(error));
    }
  }

  return blockingNotes;
}

function inspectRuntimeConfigAngularJson(tree: Tree, blockingNotes: string[]): void {
  if (!tree.exists(ANGULAR_JSON_PATH)) {
    blockingNotes.push('Missing angular.json. Cannot register runtime config assets.');
    return;
  }

  try {
    const angularJson = JSON.parse(tree.readText(ANGULAR_JSON_PATH)) as AngularJson;
    const firstProject = Object.values(angularJson.projects ?? {})[0];
    const buildOptions = firstProject?.architect?.build?.options;

    if (!buildOptions) {
      blockingNotes.push(
        'Missing build options in angular.json. Cannot register runtime config assets.',
      );
      return;
    }

    if (buildOptions.assets !== undefined && !Array.isArray(buildOptions.assets)) {
      blockingNotes.push('angular.json build assets must be an array.');
    }

    if (
      buildOptions.allowedCommonJsDependencies !== undefined &&
      (!Array.isArray(buildOptions.allowedCommonJsDependencies) ||
        buildOptions.allowedCommonJsDependencies.some((entry) => typeof entry !== 'string'))
    ) {
      blockingNotes.push(
        'angular.json allowedCommonJsDependencies must be an array of package names.',
      );
    }
  } catch {
    blockingNotes.push('angular.json contains invalid JSON.');
  }
}

function inspectRuntimeConfigAppConfig(tree: Tree, blockingNotes: string[]): void {
  if (!tree.exists(APP_CONFIG_PATH)) {
    blockingNotes.push('Missing src/app/app.config.ts. Cannot register runtime config provider.');
    return;
  }

  try {
    createRuntimeConfigAppConfigContent(tree.readText(APP_CONFIG_PATH));
  } catch (error) {
    blockingNotes.push(error instanceof Error ? error.message : String(error));
  }
}

export function collectUnsupportedEnvironmentConfigReferences(tree: Tree): string[] {
  const references: string[] = [];

  tree.visit((path) => {
    if (!shouldInspectConfigReferencePath(path)) {
      return;
    }

    const content = tree.readText(path);

    if (path === APP_CONFIG_PATH) {
      collectAppConfigReference(path, content, references);
      return;
    }

    if (path === DASHBOARD_SERVICE_PATH) {
      collectDashboardServiceReference(path, content, references);
      return;
    }

    if (UNSUPPORTED_ENVIRONMENT_CONFIG_REFERENCE_PATTERN.test(content)) {
      references.push(path);
    }
  });

  return references.sort();
}

function shouldInspectConfigReferencePath(path: string): boolean {
  return (
    path.startsWith('/src/app/') &&
    path.endsWith('.ts') &&
    !path.startsWith('/src/app/core/config/')
  );
}

function collectAppConfigReference(path: string, content: string, references: string[]): void {
  const unmanagedContent = removeKnownReferences(content, MANAGED_APP_CONFIG_REFERENCES);

  if (UNSUPPORTED_ENVIRONMENT_CONFIG_REFERENCE_PATTERN.test(unmanagedContent)) {
    references.push(path);
  }
}

function collectDashboardServiceReference(
  path: string,
  content: string,
  references: string[],
): void {
  if (!content.includes('@core/config/app-config.token')) {
    return;
  }

  const hasManagedPattern = MANAGED_DASHBOARD_SERVICE_REFERENCES.every((reference) =>
    content.includes(reference),
  );
  const unmanagedContent = removeKnownReferences(content, MANAGED_DASHBOARD_SERVICE_REFERENCES);

  if (!hasManagedPattern || /\bthis\.config\b/.test(unmanagedContent)) {
    references.push(path);
    return;
  }

  if (UNSUPPORTED_ENVIRONMENT_CONFIG_REFERENCE_PATTERN.test(unmanagedContent)) {
    references.push(path);
  }
}

function removeKnownReferences(content: string, references: readonly string[]): string {
  return references.reduce((nextContent, reference) => {
    return nextContent.replace(reference, '');
  }, content);
}

function createUnsupportedReferencesMessage(paths: readonly string[]): string {
  return `Runtime config cannot be safely applied because some files still reference the environment-based configuration.

Files to review:
${paths.map((path) => `- ${path.replace(/^\//, '')}`).join('\n')}

Migrate these references to RuntimeConfigService before applying this evolution.`;
}

function updateAngularJson(tree: Tree): void {
  const content = tree.readText(ANGULAR_JSON_PATH);
  const angularJson = JSON.parse(content) as AngularJson;
  const firstProjectEntry = Object.entries(angularJson.projects ?? {})[0];
  const projectName = firstProjectEntry?.[0];
  const firstProject = firstProjectEntry?.[1];
  const build = firstProject?.architect?.build;
  const buildOptions = build?.options;

  if (!projectName || !buildOptions) {
    throw new SchematicsException(
      'Missing build options in angular.json. Cannot register runtime config assets.',
    );
  }

  buildOptions.assets ??= [];
  addAssetsEntry(buildOptions.assets);
  addAllowedCommonJsDependency(buildOptions, 'yaml');

  const buildOptionsPath: JSONPath = ['projects', projectName, 'architect', 'build', 'options'];
  let updatedContent = updateJsoncValue(
    content,
    [...buildOptionsPath, 'assets'],
    buildOptions.assets,
  );
  updatedContent = updateJsoncValue(
    updatedContent,
    [...buildOptionsPath, 'allowedCommonJsDependencies'],
    buildOptions.allowedCommonJsDependencies,
  );
  updatedContent = compactJsonStringArray(
    updatedContent,
    [...buildOptionsPath, 'allowedCommonJsDependencies'],
    buildOptions.allowedCommonJsDependencies ?? [],
  );

  for (const [configurationName, configuration] of Object.entries(build?.configurations ?? {})) {
    const fileReplacements = configuration['fileReplacements'];

    if (!Array.isArray(fileReplacements)) {
      continue;
    }

    const nextFileReplacements = fileReplacements.filter((replacement) => {
      return (
        !isRecord(replacement) ||
        !String(replacement['replace'] ?? '').startsWith('src/environments/')
      );
    });

    if (nextFileReplacements.length === fileReplacements.length) {
      continue;
    }

    updatedContent = updateJsoncValue(
      updatedContent,
      [
        'projects',
        projectName,
        'architect',
        'build',
        'configurations',
        configurationName,
        'fileReplacements',
      ],
      nextFileReplacements.length ? nextFileReplacements : undefined,
    );
  }

  tree.overwrite(ANGULAR_JSON_PATH, updatedContent);
}

function addAssetsEntry(assets: unknown[]): void {
  const hasAssetsEntry = assets.some((asset) => {
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

  assets.push({
    glob: '**/*',
    input: 'src/assets',
    output: 'assets',
  });
}

function addAllowedCommonJsDependency(
  buildOptions: { allowedCommonJsDependencies?: string[] },
  dependencyName: string,
): void {
  buildOptions.allowedCommonJsDependencies ??= [];

  if (!buildOptions.allowedCommonJsDependencies.includes(dependencyName)) {
    buildOptions.allowedCommonJsDependencies.push(dependencyName);
    buildOptions.allowedCommonJsDependencies.sort();
  }
}

function updateAppConfig(tree: Tree): void {
  tree.overwrite(
    APP_CONFIG_PATH,
    createRuntimeConfigAppConfigContent(tree.readText(APP_CONFIG_PATH)),
  );
}

function createRuntimeConfigAppConfigContent(content: string): string {
  let appConfigContent = content;

  appConfigContent = appConfigContent.replace(
    "import { provideAppConfig } from '@core/config/app-config.provider';\n",
    '',
  );
  appConfigContent = appConfigContent.replace(
    "import { environment } from '../environments/environment';\n",
    '',
  );

  if (!appConfigContent.includes('@core/runtime-config/runtime-config.provider')) {
    appConfigContent = addRuntimeConfigImport(appConfigContent);
  }

  appConfigContent = appConfigContent.replace(/^\s*provideAppConfig\(environment\),\n/m, '');

  if (!appConfigContent.includes('provideRuntimeConfig()')) {
    appConfigContent = addRuntimeConfigProvider(appConfigContent);
  }

  return appConfigContent;
}

function addRuntimeConfigImport(appConfigContent: string): string {
  const errorInterceptorImport =
    "import { errorInterceptor } from '@core/interceptors/error.interceptor';\n";

  if (appConfigContent.includes(errorInterceptorImport)) {
    return appConfigContent.replace(
      errorInterceptorImport,
      `${errorInterceptorImport}import { provideRuntimeConfig } from '@core/runtime-config/runtime-config.provider';\n`,
    );
  }

  return `import { provideRuntimeConfig } from '@core/runtime-config/runtime-config.provider';\n${appConfigContent}`;
}

function addRuntimeConfigProvider(appConfigContent: string): string {
  const httpProvider =
    '    provideHttpClient(withFetch(), withInterceptors([correlationIdInterceptor, errorInterceptor])),\n';

  if (appConfigContent.includes(httpProvider)) {
    return appConfigContent.replace(httpProvider, `${httpProvider}    provideRuntimeConfig(),\n`);
  }

  const routerProvider = '    provideRouter(routes),\n';

  if (appConfigContent.includes(routerProvider)) {
    return appConfigContent.replace(
      routerProvider,
      `    provideRuntimeConfig(),\n${routerProvider}`,
    );
  }

  throw new SchematicsException('Missing known provider anchor in app.config.ts.');
}

function updateTsConfigSpec(tree: Tree): void {
  if (!tree.exists(TSCONFIG_SPEC_PATH)) {
    return;
  }

  const content = tree.readText(TSCONFIG_SPEC_PATH);
  const tsConfigSpec = parseTsConfigSpec(content);

  if (!Array.isArray(tsConfigSpec.include)) {
    return;
  }

  const updatedContent = removeEnvironmentIncludes(content);

  if (updatedContent !== content) {
    tree.overwrite(TSCONFIG_SPEC_PATH, updatedContent);
  }
}

function updateDashboardService(tree: Tree): void {
  if (!tree.exists(DASHBOARD_SERVICE_PATH)) {
    return;
  }

  let serviceContent = tree.readText(DASHBOARD_SERVICE_PATH);

  if (!serviceContent.includes('@core/config/app-config.token')) {
    return;
  }

  serviceContent = serviceContent.replace(
    "import { APP_CONFIG } from '@core/config/app-config.token';\n",
    "import { RuntimeConfigService } from '@core/runtime-config/runtime-config.service';\n",
  );
  serviceContent = serviceContent.replace(
    '  private readonly config = inject(APP_CONFIG);\n',
    '  private readonly runtimeConfig = inject(RuntimeConfigService);\n',
  );
  serviceContent = serviceContent.replace(
    '    return this.http.get(`${this.config.api.dashboard}${dashboardApiRoutes.v2.detail(id)}`);',
    [
      '    return this.http.get(',
      '      `${this.runtimeConfig.value().api.dashboard.baseUrl}${dashboardApiRoutes.v2.detail(id)}`,',
      '    );',
    ].join('\n'),
  );

  tree.overwrite(DASHBOARD_SERVICE_PATH, serviceContent);
}

function deleteBaselineConfigurationFiles(tree: Tree): void {
  for (const path of [...BASELINE_CONFIG_FILES, ...BASELINE_ENVIRONMENT_FILES]) {
    if (tree.exists(path)) {
      tree.delete(path);
    }
  }
}

function createFile(tree: Tree, path: string, content: string): void {
  if (tree.exists(path)) {
    throw new SchematicsException(`Cannot create ${path}. File already exists.`);
  }

  tree.create(path, content);
}

function createRuntimeConfigModelContent(): string {
  return `export type RuntimeEnvironment = 'local' | 'dev' | 'test' | 'prod';

export interface RuntimeApiEndpoint {
  baseUrl: string;
}

export interface RuntimeApiEndpoints {
  dashboard: RuntimeApiEndpoint;
  [serviceName: string]: RuntimeApiEndpoint;
}

export interface RuntimeAppConfig {
  name: string;
  environment: RuntimeEnvironment;
}

export interface RuntimeConfig {
  app: RuntimeAppConfig;
  api: RuntimeApiEndpoints;
}
`;
}

function createRuntimeConfigParserContent(): string {
  return `import { parse } from 'yaml';

import {
  type RuntimeApiEndpoint,
  type RuntimeApiEndpoints,
  type RuntimeConfig,
  type RuntimeEnvironment,
} from './runtime-config.model';

const runtimeEnvironments = ['local', 'dev', 'test', 'prod'] satisfies RuntimeEnvironment[];

export const parseRuntimeConfig = (content: string): RuntimeConfig => {
  const parsed = parse(content) as unknown;

  return normalizeRuntimeConfig(parsed);
};

const normalizeRuntimeConfig = (value: unknown): RuntimeConfig => {
  const root = assertRecord(value, 'Runtime config');
  const app = assertRecord(root['app'], 'Runtime config app');
  const api = assertRecord(root['api'], 'Runtime config api');

  return {
    app: {
      name: assertString(app['name'], 'app.name'),
      environment: assertEnvironment(app['environment'], 'app.environment'),
    },
    api: normalizeApiEndpoints(api),
  };
};

const normalizeApiEndpoints = (value: Record<string, unknown>): RuntimeApiEndpoints => {
  const endpoints = Object.entries(value).reduce<Record<string, RuntimeApiEndpoint>>(
    (accumulator, [serviceName, endpoint]) => {
      const endpointRecord = assertRecord(endpoint, \`api.\${serviceName}\`);

      accumulator[serviceName] = {
        baseUrl: assertString(endpointRecord['baseUrl'], \`api.\${serviceName}.baseUrl\`),
      };

      return accumulator;
    },
    {},
  );

  if (!endpoints['dashboard']) {
    throw new Error('Runtime config must define api.dashboard.');
  }

  return endpoints as RuntimeApiEndpoints;
};

const assertRecord = (value: unknown, fieldName: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(\`\${fieldName} must be an object.\`);
  }

  return value as Record<string, unknown>;
};

const assertString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(\`\${fieldName} must be a non-empty string.\`);
  }

  return value;
};

const assertEnvironment = (value: unknown, fieldName: string): RuntimeEnvironment => {
  const environment = assertString(value, fieldName);

  if (!runtimeEnvironments.includes(environment as RuntimeEnvironment)) {
    throw new Error(\`\${fieldName} must be one of: \${runtimeEnvironments.join(', ')}.\`);
  }

  return environment as RuntimeEnvironment;
};
`;
}

function createRuntimeConfigProviderContent(): string {
  return `import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';

import { RuntimeConfigService } from './runtime-config.service';
import { DEFAULT_RUNTIME_CONFIG_PATH, RUNTIME_CONFIG_PATH } from './runtime-config.token';

export interface RuntimeConfigProviderOptions {
  configPath?: string;
}

export const provideRuntimeConfig = (
  options: RuntimeConfigProviderOptions = {},
): EnvironmentProviders =>
  makeEnvironmentProviders([
    {
      provide: RUNTIME_CONFIG_PATH,
      useValue: options.configPath ?? DEFAULT_RUNTIME_CONFIG_PATH,
    },
    provideAppInitializer(() => inject(RuntimeConfigService).load()),
  ]);
`;
}

function createRuntimeConfigServiceContent(): string {
  return `import { HttpClient } from '@angular/common/http';
import { inject, Injectable, REQUEST, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { type RuntimeConfig } from './runtime-config.model';
import { parseRuntimeConfig } from './runtime-config.parser';
import { RUNTIME_CONFIG_PATH } from './runtime-config.token';

@Injectable({
  providedIn: 'root',
})
export class RuntimeConfigService {
  private readonly http = inject(HttpClient);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly runtimeConfigPath = inject(RUNTIME_CONFIG_PATH);
  private readonly runtimeConfig = signal<RuntimeConfig | null>(null);

  public readonly config = this.runtimeConfig.asReadonly();

  public async load(): Promise<void> {
    const configContent = await firstValueFrom(
      this.http.get(this.resolveConfigUrl(this.runtimeConfigPath), {
        responseType: 'text',
      }),
    );

    this.runtimeConfig.set(parseRuntimeConfig(configContent));
  }

  public value(): RuntimeConfig {
    const config = this.runtimeConfig();

    if (!config) {
      throw new Error('Runtime config has not been loaded yet.');
    }

    return config;
  }

  private resolveConfigUrl(configPath: string): string {
    if (isAbsoluteUrl(configPath) || !this.request) {
      return configPath;
    }

    return new URL(configPath, this.request.url).toString();
  }
}

const isAbsoluteUrl = (value: string): boolean => /^https?:\\/\\//i.test(value);
`;
}

function createRuntimeConfigTokenContent(): string {
  return `import { InjectionToken } from '@angular/core';

export const DEFAULT_RUNTIME_CONFIG_PATH = '/assets/config/values.yml';

export const RUNTIME_CONFIG_PATH = new InjectionToken<string>('RUNTIME_CONFIG_PATH', {
  providedIn: 'root',
  factory: () => DEFAULT_RUNTIME_CONFIG_PATH,
});
`;
}

function createValuesYmlContent(): string {
  return `app:
  name: Angular Enterprise Starter
  environment: local

api:
  dashboard:
    baseUrl: http://localhost:3000
`;
}

function parseTsConfigSpec(value: string): TsConfigSpec {
  const errors: ParseError[] = [];
  const parsedValue: unknown = parse(value, errors, { allowTrailingComma: true });

  if (errors.length > 0 || !isRecord(parsedValue)) {
    throw new EvolutionUserActionRequiredError(
      'tsconfig.spec.json is not valid JSONC. Correct it before applying Runtime Config.',
    );
  }

  return parsedValue as TsConfigSpec;
}

function updateJsoncValue(value: string, path: JSONPath, nextValue: unknown): string {
  return applyEdits(
    value,
    modify(value, path, nextValue, {
      formattingOptions: {
        eol: '\n',
        insertSpaces: true,
        tabSize: 2,
      },
    }),
  );
}

function compactJsonStringArray(value: string, path: JSONPath, entries: readonly string[]): string {
  const root = parseTree(value);
  const arrayNode = root ? findNodeAtLocation(root, path) : undefined;

  if (!arrayNode) {
    return value;
  }

  const compactValue = `[${entries.map((entry) => JSON.stringify(entry)).join(', ')}]`;
  const lineStart = value.lastIndexOf('\n', arrayNode.offset) + 1;
  const lineLength = arrayNode.offset - lineStart + compactValue.length;

  return lineLength <= 100
    ? replaceRange(value, arrayNode.offset, arrayNode.length, compactValue)
    : value;
}

function removeEnvironmentIncludes(value: string): string {
  let updatedValue = value;

  while (true) {
    const root = parseTree(updatedValue);
    const includeNode = root ? findNodeAtLocation(root, ['include']) : undefined;
    const children = includeNode?.children ?? [];
    const environmentIndex = children.findIndex(
      (child) => typeof child.value === 'string' && child.value.startsWith('src/environments/'),
    );

    if (!includeNode || environmentIndex < 0) {
      return updatedValue;
    }

    updatedValue = removeArrayNode(updatedValue, includeNode, children, environmentIndex);
  }
}

function removeArrayNode(
  value: string,
  arrayNode: Node,
  children: readonly Node[],
  index: number,
): string {
  if (children.length === 1) {
    return replaceRange(value, arrayNode.offset, arrayNode.length, '[]');
  }

  const node = children[index];
  const isLast = index === children.length - 1;
  const start = isLast ? children[index - 1].offset + children[index - 1].length : node.offset;
  const end = isLast ? node.offset + node.length : children[index + 1].offset;

  return replaceRange(value, start, end - start, '');
}

function replaceRange(value: string, offset: number, length: number, replacement: string): string {
  return `${value.slice(0, offset)}${replacement}${value.slice(offset + length)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
