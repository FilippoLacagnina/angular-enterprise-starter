# SignalStore CLI Installer

<!-- evolution-guide-standard -->

## Purpose

The `signal-store` evolution generates explicit feature-scoped or root-provided NgRx SignalStore
state.

Reference branch:

```text
evo/state/signal-store
```

## When to use it

Use SignalStore when state has an owned shape, derived values and explicit transitions that need to
be shared beyond one component.

Prefer plain component signals or a signal-based service for small local state. Use root scope only
for state shared across unrelated features.

## Prerequisites

Before applying:

- choose feature or root scope;
- select a unique feature or store name;
- for an existing feature, keep a route file with a supported import and route structure;
- when creating a feature, ensure that its route and component targets do not already exist.

## Generated changes

Feature scope generates:

```text
src/app/features/<feature>/state/
  <feature>.state.ts
  <feature>.store.ts
```

With `--feature-component existing`, the store is registered in the existing feature route
providers.

With `--feature-component create`, the evolution also creates:

```text
src/app/features/<feature>/<feature>.routes.ts
src/app/features/<feature>/views/<feature>/
  <feature>.component.ts
  <feature>.component.html
  <feature>.component.scss
```

Root scope generates:

```text
src/app/core/state/
  <store>.state.ts
  <store>.store.ts
```

The generated state is intentionally neutral and starts with an `initialized` flag. Product teams
replace that shape with domain state after generation.

## Dependencies

| Package         | Supported range | Target         |
| --------------- | --------------- | -------------- |
| `@ngrx/signals` | `^21.1.0`       | `dependencies` |

Compatible declarations are preserved. Invalid or incompatible declarations and packages in the
wrong dependency section block installation.

## Options

| Option                | Default     | Applies to | Description                                                   |
| --------------------- | ----------- | ---------- | ------------------------------------------------------------- |
| `--store-scope`       | `feature`   | all        | Selects `feature` or `root`.                                  |
| `--feature-name`      | `dashboard` | feature    | Controls feature paths, state names and store class.          |
| `--feature-component` | `existing`  | feature    | Uses an existing route or creates a minimal feature baseline. |
| `--store-name`        | `app`       | root       | Controls root state paths and store class.                    |

Names are normalized to kebab case for paths and PascalCase for TypeScript symbols.

## Preview and apply

Preview an existing feature:

```bash
npm run starter:evolution -- \
  --name signal-store \
  --preview \
  --store-scope feature \
  --feature-name dashboard \
  --feature-component existing
```

Create a new feature with state:

```bash
npm run starter:evolution -- \
  --name signal-store \
  --apply \
  --store-scope feature \
  --feature-name orders \
  --feature-component create
```

Create a root store:

```bash
npm run starter:evolution -- \
  --name signal-store \
  --apply \
  --store-scope root \
  --store-name session
```

## Configuration

Feature stores are registered at route level:

```ts
export const ordersRoutes: Routes = [
  {
    path: '',
    providers: [OrdersStore],
    loadComponent: () => import('./views/orders/orders.component').then(...),
  },
];
```

This binds store lifetime to the feature route.

Root stores use:

```ts
signalStore(
  { providedIn: 'root' },
  withState(initialSessionState),
  withComputed(...),
  withMethods(...),
);
```

The baseline includes `withState`, `withComputed` and `withMethods` so teams have one small,
consistent extension point without generated business behavior.

## Safety and repeatability

SignalStore is repeatable. Additional invocations can generate other feature or root stores without
duplicating starter metadata.

The complete target and route preflight runs before dependency changes or file creation. It blocks:

- an existing feature store;
- an existing root store with the same name;
- partial state/store targets;
- missing routes in `existing` mode;
- route files that cannot accept imports or providers safely;
- existing route or component files in `create` mode;
- incompatible dependency declarations.

Generated files are never silently completed or overwritten.

## Compatibility

SignalStore does not change Runtime Config, i18n, design-system or AI configuration.

Feature state may inject `RuntimeConfigService`, translated services or API clients when required,
but those dependencies should remain explicit product-level decisions.

The CLI does not install classic NgRx Store, Effects or DevTools. Introduce those only through a
separate architectural decision.

## Verification

After apply:

```bash
npm install
npm run format:check
npm run lint
npm test -- --watch=false
npm run build
```

For feature scope, verify that direct navigation creates the feature route and that store lifetime
matches route activation.

## Removal and rollback

The CLI does not provide automatic uninstall.

To remove one generated store:

1. remove its route provider and import when feature-scoped;
2. delete the corresponding state and store files;
3. delete generated route/component files only when the CLI created and still owns them;
4. keep `@ngrx/signals` while any other store uses it;
5. remove the evolution from starter metadata only when no generated SignalStore remains.

## Troubleshooting

| Symptom                              | Likely cause                               | Action                                                        |
| ------------------------------------ | ------------------------------------------ | ------------------------------------------------------------- |
| Route file is missing                | `existing` mode targets a new feature.     | Use `--feature-component create` or create the route first.   |
| Route structure is unsupported       | Imports or route entries were customized.  | Register the store manually or restore a supported structure. |
| Preview reports existing state files | The selected name is already owned.        | Choose another name or remove the previous store safely.      |
| Store is shared longer than expected | Feature state was generated at root scope. | Move it to feature scope and provide it through the route.    |

## Architecture reference

See [Signal Store Evolution](../evolutions/signal-store.md) for state-scope decisions, SignalStore
building blocks, RxJS methods and broader state-management conventions.
