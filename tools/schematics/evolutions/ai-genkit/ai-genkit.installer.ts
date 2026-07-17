import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type SchematicContext, type Tree } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import {
  type EvolutionDefinition,
  EvolutionUserActionRequiredError,
} from '../evolution-definition';
import {
  AI_GENKIT_CORE_DEPENDENCIES,
  AI_GENKIT_CORE_ENVIRONMENT_VARIABLES,
  AI_GENKIT_CORE_FILES,
  AI_GENKIT_PROVIDER_CATALOG_PATH,
  AI_GENKIT_PROVIDER_INSTALLERS,
  AI_GENKIT_SUMMARY_ENVIRONMENT_VARIABLES,
  AI_GENKIT_SUMMARY_EXAMPLE_FILES,
  type AiGenkitDependency,
  type AiGenkitInstallPlan,
  type AiGenkitProviderInstallerDefinition,
} from './ai-genkit.model';
import { createAiGenkitInstallPlan } from './ai-genkit.plan';

const PACKAGE_JSON_PATH = '/package.json';
const SERVER_PATH = '/src/server.ts';
const APP_ROUTES_PATH = '/src/app/app.routes.ts';
const ENV_EXAMPLE_PATH = '/.env.example';
const GITIGNORE_PATH = '/.gitignore';
const SUMMARY_ROUTER_IMPORT =
  "import { createAiSummaryRouter } from './server/ai/examples/summary/summary.routes';";
const SUMMARY_ROUTER_REGISTRATION = "app.use('/api/ai', createAiSummaryRouter());";
const EXPRESS_IMPORT = "import express from 'express';";
const ANGULAR_ENGINE_MARKER = 'const angularApp = new AngularNodeAppEngine();';
const SUMMARY_ROUTE_MARKER = "path: 'ai-summary'";
const SUMMARY_ROUTE_IMPORT = "import('./features/ai-summary/ai-summary.routes')";
const SERVER_ENVIRONMENT_IGNORE_RULES = ['.env', '.env.*', '!.env.example'] as const;
const PROVIDER_IMPORTS_START = '// <ai-genkit-provider-imports>';
const PROVIDER_IMPORTS_END = '// </ai-genkit-provider-imports>';
const PROVIDER_ENTRIES_START = '  // <ai-genkit-provider-entries>';
const PROVIDER_ENTRIES_END = '  // </ai-genkit-provider-entries>';
const EMPTY_PROVIDER_CATALOG = `import type { AiProviderDefinition } from './ai-provider.definition';
${PROVIDER_IMPORTS_START}
${PROVIDER_IMPORTS_END}

export const INSTALLED_AI_PROVIDER_DEFINITIONS: readonly AiProviderDefinition[] = [
${PROVIDER_ENTRIES_START}
${PROVIDER_ENTRIES_END}
];
`;

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export function installAiGenkitEvolution(
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
  options: EvolutionOptions,
): void {
  const plan = createAiGenkitInstallPlan(options);
  const providerInstaller = AI_GENKIT_PROVIDER_INSTALLERS[plan.provider];

  assertNodeBackend(tree);
  assertFileSetState(tree, AI_GENKIT_CORE_FILES, 'AI Genkit core');
  assertFileSetState(tree, providerInstaller.files, `${plan.provider} AI Genkit provider adapter`);
  assertProviderCatalogState(tree, providerInstaller);

  if (plan.example === 'summary') {
    assertFileSetState(tree, AI_GENKIT_SUMMARY_EXAMPLE_FILES, 'AI summary example');
    assertSummaryWiringState(tree);
  }

  assertEnvironmentState(tree, plan, providerInstaller);

  for (const dependency of [...AI_GENKIT_CORE_DEPENDENCIES, ...providerInstaller.dependencies]) {
    addCompatibleDependency(tree, dependency);
  }

  createMissingFiles(tree, AI_GENKIT_CORE_FILES);
  createMissingFiles(tree, providerInstaller.files);
  ensureProviderCatalog(tree);
  registerProvider(tree, providerInstaller);

  if (plan.example === 'summary') {
    createMissingFiles(tree, AI_GENKIT_SUMMARY_EXAMPLE_FILES);
  }

  updateEnvironmentExample(tree, plan, providerInstaller);
  updateGitignore(tree);

  if (plan.example === 'summary') {
    registerSummaryBackendRoute(tree);
    registerSummaryAngularRoute(tree);
  }

  context.logger.info(`${definition.label} foundation installed for ${plan.provider}.`);
  context.logger.info(
    plan.example === 'summary'
      ? 'The removable summary example is available at /ai-summary.'
      : 'No application example was generated.',
  );
  context.logger.info('Run npm install before executing lint, test and build checks.');
}

function assertNodeBackend(tree: Tree): void {
  if (!tree.exists(SERVER_PATH)) {
    throw new EvolutionUserActionRequiredError(
      'The AI Genkit evolution requires the starter Node SSR backend at src/server.ts.',
    );
  }

  const packageJson = readPackageJson(tree);
  const dependencies = packageJson.dependencies ?? {};

  if (!dependencies['express'] || !dependencies['@angular/ssr']) {
    throw new EvolutionUserActionRequiredError(
      'The AI Genkit evolution requires the baseline Express and @angular/ssr dependencies.',
    );
  }
}

function assertFileSetState(tree: Tree, paths: readonly string[], label: string): void {
  const existing = paths.filter((path) => tree.exists(path));

  if (existing.length > 0 && existing.length < paths.length) {
    throw new EvolutionUserActionRequiredError(
      `${label} installation is incomplete. Resolve the existing AI files before applying the evolution.`,
    );
  }
}

function assertProviderCatalogState(
  tree: Tree,
  providerInstaller: AiGenkitProviderInstallerDefinition,
): void {
  if (!tree.exists(AI_GENKIT_PROVIDER_CATALOG_PATH)) {
    return;
  }

  const content = tree.readText(AI_GENKIT_PROVIDER_CATALOG_PATH);
  const markers = [
    PROVIDER_IMPORTS_START,
    PROVIDER_IMPORTS_END,
    PROVIDER_ENTRIES_START,
    PROVIDER_ENTRIES_END,
  ];
  const markerIndexes = markers.map((marker) => content.indexOf(marker));
  const markersAreUnique = markers.every(
    (marker) => content.indexOf(marker) === content.lastIndexOf(marker),
  );
  const markersAreOrdered = markerIndexes.every(
    (index, position) => index >= 0 && (position === 0 || index > markerIndexes[position - 1]),
  );

  if (!markersAreUnique || !markersAreOrdered) {
    throw new EvolutionUserActionRequiredError(
      'The managed AI provider catalog markers are missing, duplicated or out of order.',
    );
  }

  const hasImport = content.includes(providerInstaller.catalogImport);
  const hasEntry = content.includes(providerInstaller.catalogEntry);
  const hasProviderFiles = providerInstaller.files.every((path) => tree.exists(path));

  if (hasImport !== hasEntry || hasEntry !== hasProviderFiles) {
    throw new EvolutionUserActionRequiredError(
      `The ${providerInstaller.id} provider catalog registration is inconsistent with its installed files.`,
    );
  }
}

function assertSummaryWiringState(tree: Tree): void {
  if (!tree.exists(APP_ROUTES_PATH)) {
    throw new EvolutionUserActionRequiredError(
      'The summary example requires the baseline src/app/app.routes.ts file.',
    );
  }

  const serverContent = tree.readText(SERVER_PATH);
  const hasServerImport = serverContent.includes(SUMMARY_ROUTER_IMPORT);
  const hasServerRegistration = serverContent.includes(SUMMARY_ROUTER_REGISTRATION);

  if (hasServerImport !== hasServerRegistration) {
    throw new EvolutionUserActionRequiredError(
      'The AI summary backend route is only partially registered in src/server.ts.',
    );
  }

  if (!hasServerImport && serverContent.includes("app.use('/api/ai'")) {
    throw new EvolutionUserActionRequiredError(
      'The /api/ai backend route is already used by another implementation.',
    );
  }

  const appRoutesContent = tree.readText(APP_ROUTES_PATH);
  const hasRouteMarker = appRoutesContent.includes(SUMMARY_ROUTE_MARKER);
  const hasRouteImport = appRoutesContent.includes(SUMMARY_ROUTE_IMPORT);

  if (hasRouteMarker !== hasRouteImport) {
    throw new EvolutionUserActionRequiredError(
      'The Angular AI summary route is only partially registered in src/app/app.routes.ts.',
    );
  }
}

function assertEnvironmentState(
  tree: Tree,
  plan: AiGenkitInstallPlan,
  providerInstaller: AiGenkitProviderInstallerDefinition,
): void {
  if (!tree.exists(ENV_EXAMPLE_PATH)) {
    return;
  }

  const content = tree.readText(ENV_EXAMPLE_PATH);
  assertEnvironmentVariableSet(content, AI_GENKIT_CORE_ENVIRONMENT_VARIABLES, 'AI Genkit core');
  assertEnvironmentVariableSet(
    content,
    providerInstaller.environmentVariables,
    `${plan.provider} provider`,
  );

  if (plan.example === 'summary') {
    assertEnvironmentVariableSet(
      content,
      AI_GENKIT_SUMMARY_ENVIRONMENT_VARIABLES,
      'AI summary example',
    );
  }
}

function assertEnvironmentVariableSet(
  content: string,
  variables: readonly string[],
  label: string,
): void {
  const existingVariables = variables.filter((variable) =>
    new RegExp(`^${variable}=`, 'm').test(content),
  );

  if (existingVariables.length > 0 && existingVariables.length < variables.length) {
    throw new EvolutionUserActionRequiredError(
      `.env.example contains a partial ${label} configuration. Complete or remove it before applying the evolution.`,
    );
  }
}

function addCompatibleDependency(tree: Tree, dependency: AiGenkitDependency): void {
  const packageJson = readPackageJson(tree);
  const { minimumMinor, name, supportedMajor, version } = dependency;
  const existingVersion = packageJson.dependencies?.[name];
  const devVersion = packageJson.devDependencies?.[name];

  if (devVersion) {
    throw new EvolutionUserActionRequiredError(
      `${name} is currently a devDependency. Move it to runtime dependencies before applying ai-genkit.`,
    );
  }

  if (existingVersion) {
    const versionMatch = existingVersion.match(/^[~^]?(\d+)\.(\d+)/);
    const major = Number(versionMatch?.[1]);
    const minor = Number(versionMatch?.[2]);

    if (major !== supportedMajor || minor < minimumMinor) {
      throw new EvolutionUserActionRequiredError(
        `${name} ${existingVersion} is not compatible with the required ${version} range.`,
      );
    }

    return;
  }

  packageJson.dependencies = sortObject({
    ...packageJson.dependencies,
    [name]: version,
  });
  writePackageJson(tree, packageJson);
}

function createMissingFiles(tree: Tree, paths: readonly string[]): void {
  for (const path of paths) {
    if (!tree.exists(path)) {
      tree.create(path, readAsset(path));
    }
  }
}

function ensureProviderCatalog(tree: Tree): void {
  if (!tree.exists(AI_GENKIT_PROVIDER_CATALOG_PATH)) {
    tree.create(AI_GENKIT_PROVIDER_CATALOG_PATH, EMPTY_PROVIDER_CATALOG);
  }
}

function registerProvider(
  tree: Tree,
  providerInstaller: AiGenkitProviderInstallerDefinition,
): void {
  let content = tree.readText(AI_GENKIT_PROVIDER_CATALOG_PATH);

  if (
    content.includes(providerInstaller.catalogImport) &&
    content.includes(providerInstaller.catalogEntry)
  ) {
    return;
  }

  content = content.replace(
    PROVIDER_IMPORTS_END,
    `${providerInstaller.catalogImport}\n${PROVIDER_IMPORTS_END}`,
  );
  content = content.replace(
    PROVIDER_ENTRIES_END,
    `  ${providerInstaller.catalogEntry}\n${PROVIDER_ENTRIES_END}`,
  );
  tree.overwrite(AI_GENKIT_PROVIDER_CATALOG_PATH, content);
}

function readAsset(path: string): Buffer {
  const packagedPath = resolve(__dirname, 'files', path.slice(1));
  const repositoryPath = resolve(process.cwd(), path.slice(1));
  const assetPath = existsSync(packagedPath) ? packagedPath : repositoryPath;

  if (!existsSync(assetPath)) {
    throw new EvolutionUserActionRequiredError(`Missing packaged AI Genkit asset: ${path}.`);
  }

  return readFileSync(assetPath);
}

function updateEnvironmentExample(
  tree: Tree,
  plan: AiGenkitInstallPlan,
  providerInstaller: AiGenkitProviderInstallerDefinition,
): void {
  const current = tree.exists(ENV_EXAMPLE_PATH) ? tree.readText(ENV_EXAMPLE_PATH) : '';
  const blocks: string[] = [];

  if (!hasAllEnvironmentVariables(current, AI_GENKIT_CORE_ENVIRONMENT_VARIABLES)) {
    blocks.push(`# Optional server-side AI foundation. Never expose provider credentials through Angular configuration.
AI_GENKIT_ENABLED=false
AI_GENKIT_DEFAULT_PROVIDER=${plan.provider}
AI_GENKIT_TIMEOUT_MS=30000
`);
  }

  if (!hasAllEnvironmentVariables(current, providerInstaller.environmentVariables)) {
    blocks.push(providerInstaller.createEnvironmentBlock(plan.model));
  }

  if (
    plan.example === 'summary' &&
    !hasAllEnvironmentVariables(current, AI_GENKIT_SUMMARY_ENVIRONMENT_VARIABLES)
  ) {
    blocks.push(`# Removable summary example. Keep false unless a real request guard is configured.
AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE=false
`);
  }

  if (blocks.length === 0) {
    return;
  }

  const block = blocks.map((value) => value.trimEnd()).join('\n\n');
  const next = current.trimEnd() ? `${current.trimEnd()}\n\n${block}\n` : `${block}\n`;

  if (tree.exists(ENV_EXAMPLE_PATH)) {
    tree.overwrite(ENV_EXAMPLE_PATH, next);
  } else {
    tree.create(ENV_EXAMPLE_PATH, next);
  }
}

function hasAllEnvironmentVariables(content: string, variables: readonly string[]): boolean {
  return variables.every((variable) => new RegExp(`^${variable}=`, 'm').test(content));
}

function updateGitignore(tree: Tree): void {
  const current = tree.exists(GITIGNORE_PATH) ? tree.readText(GITIGNORE_PATH) : '';
  const missingRules = SERVER_ENVIRONMENT_IGNORE_RULES.filter(
    (rule) => !current.split(/\r?\n/).includes(rule),
  );

  if (missingRules.length === 0) {
    return;
  }

  const block = `# Server-side environment files\n${missingRules.join('\n')}\n`;
  const next = current.trimEnd() ? `${current.trimEnd()}\n\n${block}` : block;

  if (tree.exists(GITIGNORE_PATH)) {
    tree.overwrite(GITIGNORE_PATH, next);
  } else {
    tree.create(GITIGNORE_PATH, next);
  }
}

function registerSummaryBackendRoute(tree: Tree): void {
  let content = tree.readText(SERVER_PATH);

  if (content.includes(SUMMARY_ROUTER_IMPORT) && content.includes(SUMMARY_ROUTER_REGISTRATION)) {
    return;
  }

  if (!content.includes(EXPRESS_IMPORT) || !content.includes(ANGULAR_ENGINE_MARKER)) {
    throw new EvolutionUserActionRequiredError(
      'src/server.ts no longer matches the supported starter backend structure.',
    );
  }

  content = content.replace(EXPRESS_IMPORT, `${EXPRESS_IMPORT}\n\n${SUMMARY_ROUTER_IMPORT}`);
  content = content.replace(
    ANGULAR_ENGINE_MARKER,
    `${ANGULAR_ENGINE_MARKER}\n\n${SUMMARY_ROUTER_REGISTRATION}`,
  );
  tree.overwrite(SERVER_PATH, content);
}

function registerSummaryAngularRoute(tree: Tree): void {
  const content = tree.readText(APP_ROUTES_PATH);

  if (content.includes(SUMMARY_ROUTE_MARKER) && content.includes(SUMMARY_ROUTE_IMPORT)) {
    return;
  }

  const closingIndex = content.lastIndexOf('];');
  if (!content.includes('export const routes: Routes = [') || closingIndex < 0) {
    throw new EvolutionUserActionRequiredError(
      'src/app/app.routes.ts no longer matches the supported starter route structure.',
    );
  }

  const route = `  {
    path: 'ai-summary',
    loadChildren: () =>
      import('./features/ai-summary/ai-summary.routes').then((routes) => routes.aiSummaryRoutes),
  },
`;
  tree.overwrite(
    APP_ROUTES_PATH,
    `${content.slice(0, closingIndex)}${route}${content.slice(closingIndex)}`,
  );
}

function readPackageJson(tree: Tree): PackageJson {
  if (!tree.exists(PACKAGE_JSON_PATH)) {
    throw new EvolutionUserActionRequiredError('Missing package.json.');
  }

  try {
    return JSON.parse(tree.readText(PACKAGE_JSON_PATH)) as PackageJson;
  } catch {
    throw new EvolutionUserActionRequiredError('Invalid package.json.');
  }
}

function writePackageJson(tree: Tree, packageJson: PackageJson): void {
  tree.overwrite(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function sortObject(value: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).sort(([first], [second]) => first.localeCompare(second)),
  );
}
