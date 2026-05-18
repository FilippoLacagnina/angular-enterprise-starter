# Schematics Evolution

## Index

- [Goal](#goal)
- [Positioning](#positioning)
- [Target developer experience](#target-developer-experience)
- [Baseline validation](#baseline-validation)
- [Starter metadata](#starter-metadata)
- [Starter evolution CLI](#starter-evolution-cli)
- [Evolution wizard](#evolution-wizard)
- [Preview mode](#preview-mode)
- [Current scaffold](#current-scaffold)
- [Supported evolutions](#supported-evolutions)
- [Guardrails](#guardrails)
- [Implementation roadmap](#implementation-roadmap)
- [Open decisions](#open-decisions)

## Goal

The `evo/tooling/schematics` branch explores an Angular CLI-native way to apply Angular Enterprise Starter evolutions through guided schematics.

The goal is to reduce manual merge work while keeping the starter composable and controlled.

This evolution should not turn Angular Enterprise Starter into a generic patch tool for any Angular project.
It should work on projects based on this starter baseline.

## Positioning

Angular Enterprise Starter has three complementary layers:

| Layer            | Role                                                                           |
| ---------------- | ------------------------------------------------------------------------------ |
| `main`           | Minimal enterprise baseline.                                                   |
| `evo/*` branches | Reference architectures and clonable optional baselines.                       |
| schematics       | Guided installation flow for supported evolutions inside the starter baseline. |

The `evo/*` branches remain important because they make every evolution visible, reviewable and comparable on GitHub.
Schematics can improve the developer experience by applying selected evolutions in a controlled way.

## Target developer experience

The desired high-level flow is:

```bash
ng add @filippo/angular-enterprise-starter
```

Then:

```bash
ng generate @filippo/angular-enterprise-starter:evolution
```

The generator should ask:

```text
Which evolution do you want to add?
- Transloco i18n
- Runtime config
- SignalStore
- Docker SSR
- Bootstrap
- Tailwind
```

Example output:

```text
Selected: SignalStore

This evolution will:
- install @ngrx/signals
- add feature-first SignalStore conventions
- add documentation
- update starter metadata

Continue? (Y/n)
```

After completion:

```text
SignalStore evolution installed.

Next steps:
- run npm install
- run npm run lint
- run npm run test
- run npm run build
```

## Baseline validation

The schematics should validate that the current project is based on Angular Enterprise Starter before applying any evolution.

Validation can check:

- Angular major version
- starter metadata file
- expected folder structure
- package name or project metadata
- compatible starter baseline version
- existing installed evolutions

Expected folders:

```text
src/app/core
src/app/shared
src/app/layout
src/app/features
```

If the project does not look compatible, the schematic should stop:

```text
This project does not look like an Angular Enterprise Starter workspace.
Please start from the main baseline before applying evolutions.
```

## Starter metadata

The tooling should track starter metadata in a dedicated file:

```text
.angular-enterprise-starter.json
```

Proposed shape:

```json
{
  "schemaVersion": 1,
  "baselineVersion": "0.2.0-alpha.0",
  "enabledEvolutions": []
}
```

This branch introduces the metadata file with the empty baseline state:

```text
.angular-enterprise-starter.json
```

The file should be committed with the starter baseline when schematics become part of the official workflow.

After installing an evolution:

```json
{
  "schemaVersion": 1,
  "baselineVersion": "0.2.0-alpha.0",
  "enabledEvolutions": ["signal-store"]
}
```

This allows the tooling to:

- detect whether a project is based on the starter
- prevent installing the same evolution twice
- reason about compatible evolutions
- suggest next steps
- warn about known conflicts

## Starter evolution CLI

The local developer entry point is:

```bash
npm run starter:evolution
```

The CLI asks which supported evolution to add and whether to run in preview or apply mode.

Current installable evolutions:

| Evolution   | Status      |
| ----------- | ----------- |
| SignalStore | installable |
| Docker SSR  | installable |

Preview from terminal without interactive prompts:

```bash
npm run starter:evolution -- --name signal-store --preview
```

Apply from terminal without interactive prompts:

```bash
npm run starter:evolution -- --name signal-store --apply
```

The CLI performs two steps:

1. Builds the local schematics package with `npm run schematics:build`.
2. Runs Angular CLI against `./dist/schematics/collection.json:evolution`.

This keeps the user-facing command short while preserving Angular CLI schematics as the underlying implementation.

## Evolution wizard

The main generator should be:

```bash
ng generate @filippo/angular-enterprise-starter:evolution
```

Internally, the wizard can delegate to focused evolution installers.

Conceptual structure:

```text
schematics/
  ng-add/
  evolution/
  evolutions/
    transloco/
    runtime-config/
    signal-store/
    docker-ssr/
    bootstrap/
    tailwind/
```

The public UX should remain simple.
Consumers should not need to remember one command for every evolution.

## Preview mode

The `evolution` generator supports a preview mode:

```bash
ng generate @filippo/angular-enterprise-starter:evolution --name signal-store --preview
```

Preview mode prints the expected impact of the selected evolution without changing files.

It is intended for human review before applying an evolution:

- dependencies that may be installed
- files that may be created
- files that may be updated
- architectural notes for the selected evolution

Example output:

```text
Evolution preview: signal-store

Dependencies:
- @ngrx/signals

Files to create:
- src/app/features/dashboard/state/dashboard.state.ts
- src/app/features/dashboard/state/dashboard.store.ts

Files to update:
- package.json
- .angular-enterprise-starter.json

Notes:
- Adds a feature-scoped SignalStore example and state management conventions.

No files were changed because preview mode is enabled.
```

`--preview` is different from Angular CLI dry-run behavior.
Preview mode is a readable impact summary owned by this starter.
Dry-run remains the technical Angular CLI simulation mode for file operations.

## Current scaffold

This branch introduces the first schematics scaffold:

```text
tools/schematics/
  collection.json
  tsconfig.json
  ng-add/
    index.ts
  evolution/
    index.ts
    schema.json
    schema.ts
  shared/
    starter-baseline.ts
  starter-evolution.mjs
```

Current behavior:

- `ng-add` validates the starter baseline and prints next steps.
- `evolution` validates the starter baseline, checks whether the selected evolution is already enabled and registers it in starter metadata.
- `evolution --preview` prints the expected impact of an evolution without writing files or metadata.
- `signal-store` is the first pilot evolution with real file generation.
- other evolutions still register metadata only until their installers are implemented.

The SignalStore installer is intentionally conservative:

- it adds `@ngrx/signals` to `package.json`
- it creates feature-scoped dashboard state files
- it does not modify `dashboard.routes.ts`
- it does not modify `DashboardComponent`
- it fails before overwriting existing files

After running it, manually review the generated documentation and decide where the store should be provided.

The Docker SSR installer is intentionally additive:

- it creates `Dockerfile`
- it creates `.dockerignore`
- it does not modify Angular source files
- it does not modify `package.json`
- it fails before overwriting existing Docker files

Build the schematics TypeScript sources with:

```bash
npm run schematics:build
```

The compiled output is generated under `dist/schematics`, which is ignored by Git.
The build also copies schematic assets required by Angular CLI:

```text
collection.json
evolution/schema.json
```

Run the schematics unit tests with:

```bash
npm run schematics:test
```

Current tests cover:

- valid starter baseline
- missing starter metadata
- valid evolution selection
- duplicate evolution detection
- preview mode without metadata writes
- SignalStore file generation
- SignalStore dependency registration
- overwrite protection for generated SignalStore files
- Docker SSR file generation
- overwrite protection for generated Docker SSR files
- metadata update after evolution selection
- deterministic ordering of enabled evolutions

## Supported evolutions

Initial candidates:

| Evolution      | Notes                                                 |
| -------------- | ----------------------------------------------------- |
| Transloco i18n | Adds runtime i18n baseline and translation assets.    |
| Runtime config | Adds deploy-time `values.yml` configuration strategy. |
| SignalStore    | Adds NgRx SignalStore baseline and state conventions. |
| Docker SSR     | Adds SSR Docker deployment baseline.                  |
| Bootstrap      | Adds Bootstrap styling baseline.                      |
| Tailwind       | Adds Tailwind CSS styling baseline.                   |

Start with one pilot evolution before scaling the approach.

Recommended pilot:

```text
SignalStore
```

Reason:

- contained scope
- clear dependency
- minimal file edits
- good validation of metadata and generator flow

## Guardrails

The schematics should be conservative by default.

Recommended guardrails:

- validate the starter baseline before writing files
- fail when required files are missing
- avoid destructive edits
- never overwrite user files without confirmation
- detect already installed evolutions
- keep changes as additive as possible
- print every file that will be created or changed
- document manual follow-up steps
- prefer explicit prompts for evolutions with architectural consequences

Runtime config deserves special care because it changes the configuration strategy.
It should warn users before replacing or bypassing Angular environment files.

## Implementation roadmap

1. Create starter metadata file.
2. Scaffold schematics package structure.
3. Implement `ng-add` baseline validation.
4. Implement `evolution` wizard without file writes.
5. Add metadata update support.
6. Implement one pilot evolution: SignalStore.
7. Add dry-run documentation.
8. Add tests for the schematic rules.
9. Add more evolutions only after the pilot is stable.

## Open decisions

- Package name:
  `@filippo/angular-enterprise-starter` or another npm scope.
- Whether `.angular-enterprise-starter.json` should be added to `main`.
- Whether each evolution should have a hidden dedicated schematic in addition to the public wizard.
- How strict baseline validation should be.
- How to handle projects that already manually merged one or more `evo/*` branches.
