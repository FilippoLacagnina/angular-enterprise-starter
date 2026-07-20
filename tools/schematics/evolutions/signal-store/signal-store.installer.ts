import { type SchematicContext, SchematicsException, type Tree } from '@angular-devkit/schematics';

import { getEvolutionDependencyRequirement } from '../../evolution/evolution-manifest';
import { type EvolutionOptions } from '../../evolution/schema';
import {
  createPackageDependenciesPreview,
  ensurePackageDependency,
} from '../../shared/package-dependency';
import {
  type EvolutionDefinition,
  type EvolutionPreview,
  EvolutionUserActionRequiredError,
} from '../evolution-definition';

const SIGNAL_STORE_DEPENDENCY = getEvolutionDependencyRequirement('signal-store', '@ngrx/signals');

interface SignalStorePlan {
  readonly scope: 'feature' | 'root';
  readonly featureName: string;
  readonly featureComponent: 'existing' | 'create';
  readonly statePath: string;
  readonly storePath: string;
  readonly stateInterfaceName: string;
  readonly initialStateName: string;
  readonly storeName: string;
  readonly routePath?: string;
  readonly componentTsPath?: string;
  readonly componentHtmlPath?: string;
  readonly componentScssPath?: string;
  readonly componentClassName?: string;
}

export function installSignalStoreEvolution(
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
  options: EvolutionOptions,
): void {
  const plan = createSignalStorePlan(options);

  assertSignalStoreInstallationAvailable(tree, plan);
  ensurePackageDependency(tree, SIGNAL_STORE_DEPENDENCY);
  createStateFiles(tree, plan);

  if (plan.scope === 'feature' && plan.featureComponent === 'create') {
    createFeatureComponentFiles(tree, plan);
  }

  if (plan.scope === 'feature' && plan.featureComponent === 'existing') {
    registerStoreProviderInRoute(tree, plan);
  }

  context.logger.info(`${definition.label} files created.`);
  context.logger.info('Run npm install to update the package lock before running quality checks.');
}

export function getSignalStorePreview(options: EvolutionOptions, tree: Tree): EvolutionPreview {
  const plan = createSignalStorePlan(options);
  const dependencyPreview = createPackageDependenciesPreview(tree, [SIGNAL_STORE_DEPENDENCY]);
  const targetPaths = getSignalStoreTargetPaths(plan);
  const existingTargetPaths = getExistingTargetPaths(tree, targetPaths);
  const creates = targetPaths
    .filter((targetPath) => !existingTargetPaths.includes(targetPath))
    .map(toDisplayPath);

  const existing = existingTargetPaths.map(toDisplayPath);
  const updates = ['package.json', '.angular-enterprise-starter.json'];
  const routePath = plan.scope === 'feature' ? requiredPath(plan.routePath) : undefined;

  if (
    plan.scope === 'feature' &&
    plan.featureComponent === 'existing' &&
    tree.exists(requiredPath(routePath))
  ) {
    updates.push(toDisplayPath(requiredPath(routePath)));
  }

  const blockingNotes = createBlockingNotes(plan, tree, existing);
  const notes = createPreviewNotes(plan);

  blockingNotes.push(...createRouteStructureBlockingNotes(plan, tree));
  blockingNotes.push(...dependencyPreview.blockingNotes);
  notes.push(...dependencyPreview.notes);

  return {
    dependencies: dependencyPreview.dependencies,
    creates,
    updates,
    existing,
    blockingNotes,
    notes,
  };
}

function createStateFiles(tree: Tree, plan: SignalStorePlan): void {
  createFile(
    tree,
    plan.statePath,
    `export interface ${plan.stateInterfaceName} {
  readonly initialized: boolean;
}

export const ${plan.initialStateName}: ${plan.stateInterfaceName} = {
  initialized: false,
};
`,
  );

  createFile(
    tree,
    plan.storePath,
    `import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { ${plan.initialStateName} } from './${plan.featureName}.state';

export const ${plan.storeName} = signalStore(
${plan.scope === 'root' ? "  { providedIn: 'root' },\n" : ''}  withState(${plan.initialStateName}),
  withComputed(({ initialized }) => ({
    isReady: () => initialized(),
  })),
  withMethods((store) => ({
    initialize(): void {
      patchState(store, { initialized: true });
    },
    reset(): void {
      patchState(store, ${plan.initialStateName});
    },
  })),
);
`,
  );
}

function createFeatureComponentFiles(tree: Tree, plan: SignalStorePlan): void {
  createFile(
    tree,
    requiredPath(plan.routePath),
    `import { type Routes } from '@angular/router';

export const ${camelCase(plan.featureName)}Routes: Routes = [
  {
    path: '',
    providers: [${plan.storeName}],
    loadComponent: () =>
      import('./views/${plan.featureName}/${plan.featureName}.component').then(
        (component) => component.${requiredValue(plan.componentClassName)},
      ),
  },
];
`,
  );

  updateFile(tree, requiredPath(plan.routePath), (content) =>
    addImport(content, createStoreRouteImport(plan)),
  );

  createFile(
    tree,
    requiredPath(plan.componentTsPath),
    `import { Component } from '@angular/core';

@Component({
  selector: 'app-${plan.featureName}',
  imports: [],
  templateUrl: './${plan.featureName}.component.html',
  styleUrl: './${plan.featureName}.component.scss',
})
export class ${requiredValue(plan.componentClassName)} {}
`,
  );

  createFile(
    tree,
    requiredPath(plan.componentHtmlPath),
    `${pascalCase(plan.featureName)} works.
`,
  );
  createFile(tree, requiredPath(plan.componentScssPath), '');
}

function registerStoreProviderInRoute(tree: Tree, plan: SignalStorePlan): void {
  const routePath = requiredPath(plan.routePath);

  updateFile(tree, routePath, (content) => {
    const contentWithImport = addImport(content, createStoreRouteImport(plan));

    return addRouteProvider(contentWithImport, plan);
  });
}

function assertSignalStoreInstallationAvailable(tree: Tree, plan: SignalStorePlan): void {
  assertSignalStoreTargetAvailable(tree, plan);

  if (plan.scope !== 'feature') {
    return;
  }

  if (plan.featureComponent === 'create') {
    assertFeatureComponentTargetAvailable(tree, plan);
    return;
  }

  const routePath = requiredPath(plan.routePath);

  if (!tree.exists(routePath)) {
    throw new EvolutionUserActionRequiredError(
      `Missing route file for feature "${plan.featureName}". Expected ${routePath}. Create the route first or use --feature-component create.`,
    );
  }

  try {
    const contentWithImport = addImport(tree.readText(routePath), createStoreRouteImport(plan));
    addRouteProvider(contentWithImport, plan);
  } catch (error) {
    throw new EvolutionUserActionRequiredError(
      error instanceof Error ? error.message : String(error),
    );
  }
}

function createStoreRouteImport(plan: SignalStorePlan): string {
  return `import { ${plan.storeName} } from './state/${plan.featureName}.store';`;
}

function addImport(content: string, importStatement: string): string {
  if (content.includes(importStatement)) {
    return content;
  }

  const importMatches = [...content.matchAll(/^import .+;\n/gm)];
  const lastImport = importMatches.at(-1);

  if (!lastImport || lastImport.index === undefined) {
    throw new SchematicsException('Cannot safely add SignalStore import to the route file.');
  }

  const insertIndex = lastImport.index + lastImport[0].length;

  return `${content.slice(0, insertIndex)}${importStatement}\n${content.slice(insertIndex)}`;
}

function addRouteProvider(content: string, plan: SignalStorePlan): string {
  if (content.includes(`providers: [${plan.storeName}]`)) {
    return content;
  }

  const providersPattern = /providers:\s*\[([^\]]*)\]/m;
  const providersMatch = content.match(providersPattern);

  if (providersMatch) {
    const existingProviders = providersMatch[1].trim();

    if (
      existingProviders
        .split(',')
        .map((provider) => provider.trim())
        .includes(plan.storeName)
    ) {
      return content;
    }

    const nextProviders = existingProviders
      ? `providers: [${existingProviders}, ${plan.storeName}]`
      : `providers: [${plan.storeName}]`;

    return content.replace(providersPattern, nextProviders);
  }

  const pathPattern = /(path:\s*['"][^'"]*['"],\n)/;

  if (!pathPattern.test(content)) {
    throw new SchematicsException(
      `Cannot safely register ${plan.storeName} in ${requiredPath(plan.routePath)}. Add it manually to the route providers.`,
    );
  }

  return content.replace(pathPattern, `$1    providers: [${plan.storeName}],\n`);
}

function assertSignalStoreTargetAvailable(tree: Tree, plan: SignalStorePlan): void {
  if (getExistingTargetPaths(tree, [plan.statePath, plan.storePath]).length === 0) {
    return;
  }

  if (plan.scope === 'root') {
    throw new EvolutionUserActionRequiredError(
      `A root SignalStore named "${plan.featureName}" already exists under src/app/core/state. Choose a different root store name or remove the existing store before continuing.`,
    );
  }

  throw new EvolutionUserActionRequiredError(
    `A SignalStore already exists for feature "${plan.featureName}". Choose a different feature name or remove the existing store before continuing.`,
  );
}

function assertFeatureComponentTargetAvailable(tree: Tree, plan: SignalStorePlan): void {
  if (getExistingTargetPaths(tree, getFeatureComponentTargetPaths(plan)).length === 0) {
    return;
  }

  throw new EvolutionUserActionRequiredError(
    `Feature component files already exist for feature "${plan.featureName}". Use --feature-component existing or choose another feature name.`,
  );
}

function getSignalStoreTargetPaths(plan: SignalStorePlan): string[] {
  const targets = [plan.statePath, plan.storePath];

  if (plan.scope === 'feature' && plan.featureComponent === 'create') {
    targets.push(...getFeatureComponentTargetPaths(plan));
  }

  return targets;
}

function getFeatureComponentTargetPaths(plan: SignalStorePlan): string[] {
  return [
    requiredPath(plan.routePath),
    requiredPath(plan.componentTsPath),
    requiredPath(plan.componentHtmlPath),
    requiredPath(plan.componentScssPath),
  ];
}

function getExistingTargetPaths(tree: Tree, targetPaths: readonly string[]): string[] {
  return targetPaths.filter((targetPath) => tree.exists(targetPath));
}

function createSignalStorePlan(options: EvolutionOptions): SignalStorePlan {
  const scope = options.storeScope ?? 'feature';
  const featureName = normalizeFeatureName(options.featureName ?? 'dashboard');
  const rootStoreName = normalizeFeatureName(options.storeName ?? 'app');
  const featureComponent = options.featureComponent ?? 'existing';
  const baseName = scope === 'root' ? rootStoreName : featureName;
  const classPrefix = pascalCase(baseName);

  if (scope === 'root') {
    return {
      scope,
      featureName: baseName,
      featureComponent: 'existing',
      statePath: `/src/app/core/state/${baseName}.state.ts`,
      storePath: `/src/app/core/state/${baseName}.store.ts`,
      stateInterfaceName: `${classPrefix}State`,
      initialStateName: `initial${classPrefix}State`,
      storeName: `${classPrefix}Store`,
    };
  }

  return {
    scope,
    featureName,
    featureComponent,
    statePath: `/src/app/features/${featureName}/state/${featureName}.state.ts`,
    storePath: `/src/app/features/${featureName}/state/${featureName}.store.ts`,
    stateInterfaceName: `${classPrefix}State`,
    initialStateName: `initial${classPrefix}State`,
    storeName: `${classPrefix}Store`,
    routePath: `/src/app/features/${featureName}/${featureName}.routes.ts`,
    componentTsPath: `/src/app/features/${featureName}/views/${featureName}/${featureName}.component.ts`,
    componentHtmlPath: `/src/app/features/${featureName}/views/${featureName}/${featureName}.component.html`,
    componentScssPath: `/src/app/features/${featureName}/views/${featureName}/${featureName}.component.scss`,
    componentClassName: `${classPrefix}Component`,
  };
}

function createBlockingNotes(
  plan: SignalStorePlan,
  tree: Tree,
  existing: readonly string[],
): string[] {
  if (
    plan.scope === 'feature' &&
    plan.featureComponent === 'existing' &&
    !tree.exists(requiredPath(plan.routePath))
  ) {
    return [
      `Apply would stop because the route file for feature "${plan.featureName}" was not found.`,
      'Create the route first, choose another feature name or use --feature-component create.',
    ];
  }

  if (existing.length === 0) {
    return [];
  }

  if (plan.scope === 'root') {
    return [
      `Apply would stop because root SignalStore "${plan.featureName}" already exists.`,
      'Choose another root store name with --store-name or remove the existing root store before applying.',
    ];
  }

  if (plan.featureComponent === 'create') {
    return [
      `Apply would stop because generated targets already exist for feature "${plan.featureName}".`,
      'Use --feature-component existing when the feature already exists, or choose another feature name.',
    ];
  }

  return [
    `Apply would stop because a SignalStore already exists for feature "${plan.featureName}".`,
    'Choose another feature name or remove the existing store before applying.',
  ];
}

function createRouteStructureBlockingNotes(plan: SignalStorePlan, tree: Tree): string[] {
  if (plan.scope !== 'feature' || plan.featureComponent !== 'existing') {
    return [];
  }

  const routePath = requiredPath(plan.routePath);

  if (!tree.exists(routePath)) {
    return [];
  }

  try {
    const contentWithImport = addImport(tree.readText(routePath), createStoreRouteImport(plan));
    addRouteProvider(contentWithImport, plan);
    return [];
  } catch (error) {
    return [`Apply would stop: ${error instanceof Error ? error.message : String(error)}`];
  }
}

function createPreviewNotes(plan: SignalStorePlan): string[] {
  if (plan.scope === 'root') {
    return [
      `Creates a root-provided SignalStore named ${plan.storeName} under core/state.`,
      'Use root scope only for state shared across unrelated features.',
    ];
  }

  const notes = [
    `Creates a feature-scoped SignalStore for the ${plan.featureName} feature.`,
    'Registers the feature store in the route providers.',
    'Does not update existing components automatically.',
  ];

  if (plan.featureComponent === 'create') {
    notes.push('Creates a minimal feature route and standalone component because requested.');
  }

  return notes;
}

function createFile(tree: Tree, path: string, content: string): void {
  if (tree.exists(path)) {
    throw new SchematicsException(`Cannot create ${path}. File already exists.`);
  }

  tree.create(path, content);
}

function updateFile(tree: Tree, path: string, updater: (content: string) => string): void {
  if (!tree.exists(path)) {
    throw new SchematicsException(`Cannot update ${path}. File does not exist.`);
  }

  tree.overwrite(path, updater(tree.readText(path)));
}

function normalizeFeatureName(value: string): string {
  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  if (!normalized) {
    throw new SchematicsException('Feature name cannot be empty.');
  }

  return normalized;
}

function pascalCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}

function camelCase(value: string): string {
  const pascalValue = pascalCase(value);
  return `${pascalValue.charAt(0).toLowerCase()}${pascalValue.slice(1)}`;
}

function requiredPath(value: string | undefined): string {
  if (!value) {
    throw new SchematicsException('Missing required path while generating SignalStore files.');
  }

  return value;
}

function requiredValue(value: string | undefined): string {
  if (!value) {
    throw new SchematicsException('Missing required value while generating SignalStore files.');
  }

  return value;
}

function toDisplayPath(path: string): string {
  return path.replace(/^\//, '');
}
