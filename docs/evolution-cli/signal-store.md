# SignalStore CLI Installer

## Index

- [Purpose](#purpose)
- [Generated output](#generated-output)
- [Options](#options)
- [Feature scope](#feature-scope)
- [Root scope](#root-scope)
- [State baseline](#state-baseline)
- [Repeatable usage](#repeatable-usage)
- [Safety rules](#safety-rules)

## Purpose

The SignalStore installer adds NgRx SignalStore state files through the Evolution CLI.

Use this installer when a project needs structured feature or root state while keeping generation explicit, previewable and repeatable.

The related reference branch is:

```text
evo/state/signal-store
```

## Generated output

Feature-scoped stores are generated under:

```text
src/app/features/<feature-name>/state/
  <feature-name>.state.ts
  <feature-name>.store.ts
```

Root-scoped stores are generated under:

```text
src/app/core/state/
  <store-name>.state.ts
  <store-name>.store.ts
```

The installer also adds the `@ngrx/signals` dependency when missing.

## Options

| Option                | Default     | Applies to | Description                                                  |
| --------------------- | ----------- | ---------- | ------------------------------------------------------------ |
| `--store-scope`       | `feature`   | all        | Selects `feature` or `root` scope.                           |
| `--feature-name`      | `dashboard` | feature    | Controls generated feature paths and class names.            |
| `--feature-component` | `existing`  | feature    | Uses an existing feature component or creates a minimal one. |
| `--store-name`        | `app`       | root       | Controls generated root store paths and class names.         |

## Feature scope

Preview a feature store:

```bash
npm run starter:evolution -- --name signal-store --preview --store-scope feature --feature-name dashboard
```

Apply a feature store for a new feature:

```bash
npm run starter:evolution -- --name signal-store --apply --store-scope feature --feature-name orders --feature-component create
```

Feature-scoped stores are registered in route providers.
This keeps the store lifecycle tied to the feature route instead of making it global by default.

## Root scope

Preview a root store:

```bash
npm run starter:evolution -- --name signal-store --preview --store-scope root
```

Apply a named root store:

```bash
npm run starter:evolution -- --name signal-store --apply --store-scope root --store-name session
```

Root stores are provided through Angular dependency injection at root level.
Use this only for state that is truly application-wide.

## State baseline

Generated state is intentionally neutral:

```ts
export interface ExampleState {
  readonly initialized: boolean;
}

export const initialExampleState: ExampleState = {
  initialized: false,
};
```

This avoids forcing business-specific examples into the starter.

## Repeatable usage

The installer is repeatable.

After enabling SignalStore once, users can generate additional feature or root stores without duplicating starter metadata.

## Safety rules

The installer stops when:

- a feature SignalStore already exists;
- a root SignalStore with the same name already exists;
- a required feature route is missing;
- feature component files already exist while using `--feature-component create`.

Use preview mode before apply when generating stores in an existing project baseline.
