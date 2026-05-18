import { type SchematicContext, SchematicsException, type Tree } from '@angular-devkit/schematics';

import { type EvolutionDefinition } from '../evolution-definition';

const NGRX_SIGNALS_VERSION = '^21.1.0';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export function installSignalStoreEvolution(
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
): void {
  addPackageDependency(tree, '@ngrx/signals', NGRX_SIGNALS_VERSION);

  createFile(
    tree,
    '/src/app/features/dashboard/state/dashboard.state.ts',
    `export interface DashboardState {
  readonly selectedWidgetId: string | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

export const initialDashboardState: DashboardState = {
  selectedWidgetId: null,
  isLoading: false,
  errorMessage: null,
};
`,
  );

  createFile(
    tree,
    '/src/app/features/dashboard/state/dashboard.store.ts',
    `import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { initialDashboardState } from './dashboard.state';

export const DashboardStore = signalStore(
  withState(initialDashboardState),
  withComputed(({ errorMessage, isLoading, selectedWidgetId }) => ({
    hasSelectedWidget: () => selectedWidgetId() !== null,
    isReady: () => !isLoading() && errorMessage() === null,
  })),
  withMethods((store) => ({
    selectWidget(widgetId: string): void {
      patchState(store, { selectedWidgetId: widgetId });
    },
    clearSelectedWidget(): void {
      patchState(store, { selectedWidgetId: null });
    },
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },
    setError(errorMessage: string | null): void {
      patchState(store, { errorMessage });
    },
    reset(): void {
      patchState(store, initialDashboardState);
    },
  })),
);
`,
  );

  context.logger.info(`${definition.label} files created.`);
  context.logger.info('Run npm install to update the package lock before running quality checks.');
}

function addPackageDependency(tree: Tree, packageName: string, version: string): void {
  const packageJsonPath = '/package.json';

  if (!tree.exists(packageJsonPath)) {
    throw new SchematicsException('Missing package.json. Cannot add SignalStore dependency.');
  }

  const packageJson = JSON.parse(tree.readText(packageJsonPath)) as PackageJson;

  if (packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName]) {
    return;
  }

  packageJson.dependencies = sortObject({
    ...packageJson.dependencies,
    [packageName]: version,
  });

  tree.overwrite(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function createFile(tree: Tree, path: string, content: string): void {
  if (tree.exists(path)) {
    throw new SchematicsException(`Cannot create ${path}. File already exists.`);
  }

  tree.create(path, content);
}

function sortObject(value: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).sort(([first], [second]) => first.localeCompare(second)),
  );
}
