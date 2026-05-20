# Evolution CLI

## Index

- [Purpose](#purpose)
- [Recommended flow](#recommended-flow)
- [Installable evolutions](#installable-evolutions)
- [Command usage](#command-usage)
- [SignalStore installer](#signalstore-installer)
- [Safety model](#safety-model)
- [Future parametrized installers](#future-parametrized-installers)
- [Maintenance rules](#maintenance-rules)
- [Tooling structure](#tooling-structure)
- [Quality checks](#quality-checks)

## Purpose

The Evolution CLI is the guided installation layer for Angular Enterprise Starter.

It keeps `main` minimal while allowing users to add selected capabilities through a safer, preview-first workflow.

```text
main baseline
  + guided Evolution CLI
  + compatible evo/* reference branches
  = composable starter
```

The CLI is intended for projects based on Angular Enterprise Starter.
It is not designed to patch arbitrary Angular applications, where existing architecture and naming conventions may conflict.

Installers do not generate documentation files.
Canonical documentation remains maintained in the repository docs and should be updated separately when a capability changes.

## Recommended flow

Start with the interactive command:

```bash
npm run starter:evolution
```

![Starter Evolution CLI preview](assets/starter-evolution-cli.svg)

Recommended flow:

```text
preview -> review impact -> apply
```

Preview should be the default workflow during development.
Apply should be used only after the generated changes are understood.

## Installable evolutions

| Evolution   | Name           | Status      | Notes                                       |
| ----------- | -------------- | ----------- | ------------------------------------------- |
| SignalStore | `signal-store` | installable | Parametrized feature/root store generation. |
| Docker SSR  | `docker-ssr`   | installable | SSR-oriented Docker deployment baseline.    |
| Bootstrap   | `bootstrap`    | installable | Minimal Bootstrap design-system baseline.   |

Other evolutions may exist as `evo/*` branches before they become CLI-installable.
Those branches remain useful as implementation references, but they should not be treated as CLI installers until an installer, preview metadata and tests exist.

## Command usage

Interactive mode:

```bash
npm run starter:evolution
```

Preview examples:

```bash
npm run starter:evolution -- --name signal-store --preview
npm run starter:evolution -- --name docker-ssr --preview
npm run starter:evolution -- --name bootstrap --preview
```

Apply examples:

```bash
npm run starter:evolution -- --name signal-store --apply
npm run starter:evolution -- --name docker-ssr --apply
npm run starter:evolution -- --name bootstrap --apply
```

Non-interactive apply examples:

```bash
npm run starter:evolution -- --name signal-store --apply --yes
npm run starter:evolution -- --name docker-ssr --apply --yes
npm run starter:evolution -- --name bootstrap --apply --yes
```

Use `--yes` only after validating the command in preview mode or inside a temporary test workspace.

## SignalStore installer

SignalStore is currently the first parametrized installer.

It can create:

| Scope   | Generated location                        | Provider strategy             |
| ------- | ----------------------------------------- | ----------------------------- |
| Feature | `src/app/features/<feature-name>/state/*` | route-level `providers` entry |
| Root    | `src/app/core/state/<store-name>.*`       | `{ providedIn: 'root' }`      |

Available options:

| Option                | Default     | Applies to | Description                                                  |
| --------------------- | ----------- | ---------- | ------------------------------------------------------------ |
| `--store-scope`       | `feature`   | all        | Selects `feature` or `root` scope.                           |
| `--feature-name`      | `dashboard` | feature    | Controls generated feature paths and class names.            |
| `--feature-component` | `existing`  | feature    | Uses an existing feature component or creates a minimal one. |
| `--store-name`        | `app`       | root       | Controls generated root store paths and class names.         |

Feature examples:

```bash
npm run starter:evolution -- --name signal-store --preview --store-scope feature --feature-name dashboard
npm run starter:evolution -- --name signal-store --apply --store-scope feature --feature-name orders --feature-component create
```

Root examples:

```bash
npm run starter:evolution -- --name signal-store --preview --store-scope root
npm run starter:evolution -- --name signal-store --apply --store-scope root --store-name session
```

Generated state is intentionally neutral:

```ts
export interface ExampleState {
  readonly initialized: boolean;
}

export const initialExampleState: ExampleState = {
  initialized: false,
};
```

Feature-scoped stores are registered in route providers.
Root stores are provided through Angular dependency injection at root level.

The installer is repeatable: after enabling the SignalStore capability once, users can generate additional feature or root stores without duplicating metadata.

## Safety model

The CLI follows a conservative safety model:

- preview before writing files;
- stop before overwriting generated targets;
- do not modify existing components;
- do not silently resolve ambiguous project structure;
- ask for explicit choices when a parametrized installer needs them;
- keep reference branches available for manual inspection.

Expected user-action conflicts stop with a direct message.
Examples:

- a feature SignalStore already exists;
- a root SignalStore with the same name already exists;
- a required feature route is missing;
- feature component files already exist while using `--feature-component create`.

Unexpected installer failures include the related `evo/*` reference branch so the user can inspect or merge manually if needed.

## Future parametrized installers

SignalStore already proves the parametrized installer model.
Future parametrized installers should use the same safety principles, but document choices that are not implemented yet.

A likely next candidate is a design-system primitive flow.

Example:

```text
Which evolution?
- Bootstrap

Bootstrap setup?
- Install baseline only
- Install UI primitives

UI primitives?
- All
- Select manually

Select primitives:
- Button
- Input
- Card
```

Possible outcomes:

| Choice                  | Result                                                          |
| ----------------------- | --------------------------------------------------------------- |
| `Install baseline only` | Adds Bootstrap dependency and global style import only.         |
| `Install UI primitives` | Adds selected starter-owned UI primitives.                      |
| `All`                   | Generates every available primitive in the installer.           |
| `Select manually`       | Generates only selected primitives such as `Button` or `Input`. |

Parametrized installers should prefer explicit choices over hidden assumptions.
They must keep preview mode accurate before writing files.

## Maintenance rules

Every CLI installer must stay aligned with its reference branch.

When an `evo/*` branch changes, check whether a CLI installer exists for that evolution.
If it exists, update:

- installer implementation;
- preview metadata;
- CLI evolution list;
- tests;
- this document.

Current CLI/reference branch mapping:

| Evolution   | Reference branch              |
| ----------- | ----------------------------- |
| SignalStore | `evo/state/signal-store`      |
| Docker SSR  | `evo/deployment/docker-ssr`   |
| Bootstrap   | `evo/design-system/bootstrap` |

Reference-only branches that are not CLI-installable yet must remain documented in `docs/evolutions.md` until their installers are implemented.

## Tooling structure

Schematics-related tooling lives under:

```text
tools/schematics/
```

Main areas:

| Path                                     | Purpose                                  |
| ---------------------------------------- | ---------------------------------------- |
| `tools/schematics/starter-evolution.mjs` | Local Evolution CLI wrapper.             |
| `tools/schematics/evolution/`            | Angular schematic entrypoint and schema. |
| `tools/schematics/evolutions/`           | Installer implementations and registry.  |
| `tools/schematics/shared/`               | Shared schematic utilities.              |
| `tools/schematics/schematics.spec.ts`    | Schematic tests.                         |

The cleanup tool remains outside `tools/schematics/` because it is starter-maintenance tooling, not schematic installation tooling.

## Quality checks

After changing schematics or the CLI, run:

```bash
npm run schematics:build
npm run schematics:test
npm run format:check
npm run lint
```

Recommended preview smoke checks:

```bash
npm run starter:evolution -- --name bootstrap --preview
npm run starter:evolution -- --name docker-ssr --preview
npm run starter:evolution -- --name signal-store --preview --store-scope feature --feature-name dashboard
npm run starter:evolution -- --name signal-store --preview --store-scope root --store-name session
```

For real apply testing, use a temporary copy of the repository, then run:

```bash
npm install
npm run format:check
npm run lint
npm run build
```
