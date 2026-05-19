# Starter Evolution CLI

## Index

- [Goal](#goal)
- [How to use it](#how-to-use-it)
- [Installable evolutions](#installable-evolutions)
- [Preview mode](#preview-mode)
- [Apply mode](#apply-mode)
- [Blocking errors and branch fallback](#blocking-errors-and-branch-fallback)
- [Current behavior](#current-behavior)
- [Future parametrized installers](#future-parametrized-installers)
- [Maintenance rules](#maintenance-rules)
- [Tooling structure](#tooling-structure)
- [Quality checks](#quality-checks)

## Goal

The Starter Evolution CLI lets users add optional Angular Enterprise Starter capabilities without bloating the `main` baseline.

The main idea is:

```text
main stays minimal
evo/* branches remain visible references
the CLI applies selected evolutions in a guided way
```

The CLI is intended for projects based on Angular Enterprise Starter.
It is not intended to patch arbitrary Angular applications.

## How to use it

Interactive mode:

```bash
npm run starter:evolution
```

![Starter Evolution CLI preview](assets/starter-evolution-cli.svg)

The CLI asks:

```text
Which evolution do you want to add?
Which mode do you want to run?
```

Recommended flow:

```text
preview -> apply
```

## Installable evolutions

| Evolution   | Name           | Status      |
| ----------- | -------------- | ----------- |
| SignalStore | `signal-store` | installable |
| Docker SSR  | `docker-ssr`   | installable |
| Bootstrap   | `bootstrap`    | installable |

Other evolutions can still exist as `evo/*` branches.
Some of them are still in development and will be released as CLI-installable evolutions once their installers are implemented and validated.

## Preview mode

Preview mode shows what would be changed without writing files.

```bash
npm run starter:evolution -- --name signal-store --preview
npm run starter:evolution -- --name docker-ssr --preview
npm run starter:evolution -- --name bootstrap --preview
```

Preview is the recommended first step before applying an evolution.

## Apply mode

Apply mode writes the selected evolution to the workspace.

With confirmation:

```bash
npm run starter:evolution -- --name bootstrap --apply
```

Without confirmation:

```bash
npm run starter:evolution -- --name signal-store --apply --yes
npm run starter:evolution -- --name docker-ssr --apply --yes
npm run starter:evolution -- --name bootstrap --apply --yes
```

Use `--yes` only when the command is already validated, for example inside a temporary test workspace.

## Blocking errors and branch fallback

If an installer cannot safely complete, the CLI stops and shows the related `evo/*` reference branch.

Example:

```text
Unable to safely install the Docker SSR evolution.

Reason:
- Cannot create /Dockerfile. File already exists.

You can still inspect or merge the reference evolution branch manually.

Branch:
evo/deployment/docker-ssr

GitHub:
https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/deployment/docker-ssr

Suggested manual flow:
git fetch origin
git merge origin/evo/deployment/docker-ssr
```

This keeps the automated installer safe while preserving the branch as a transparent fallback.

## Current behavior

### SignalStore

Creates:

```text
src/app/features/dashboard/state/dashboard.state.ts
src/app/features/dashboard/state/dashboard.store.ts
```

Updates:

```text
package.json
.angular-enterprise-starter.json
```

Notes:

- adds `@ngrx/signals` only if missing
- does not modify routes or components
- fails before overwriting generated state files

### Docker SSR

Creates:

```text
Dockerfile
.dockerignore
```

Updates:

```text
.angular-enterprise-starter.json
```

Notes:

- does not modify Angular source files
- does not modify `package.json`
- fails before overwriting existing Docker files

### Bootstrap

Updates:

```text
package.json
src/styles.scss
.angular-enterprise-starter.json
```

Notes:

- adds `bootstrap` only if missing
- adds Bootstrap global style import only if missing
- preserves existing `src/styles.scss` content
- does not generate documentation files

## Future parametrized installers

Current installers are intentionally simple and predictable.
Each installable evolution applies a known baseline.

Future installers can become parametrized when an evolution needs user choices before writing files.
This would make the CLI more configurable while keeping `main` minimal.

Example for a future SignalStore flow:

```text
Which evolution?
- SignalStore

Store scope?
- Feature
- Root

Feature name?
dashboard

Generate example usage?
- No
- Yes
```

Possible outcomes:

| Choice                  | Result                                                   |
| ----------------------- | -------------------------------------------------------- |
| `Feature` scope         | Generates `features/<feature-name>/state/*`.             |
| `Root` scope            | Generates a root-provided store for application state.   |
| `Feature name`          | Controls generated file paths and store naming.          |
| `Generate example: No`  | Creates only state/store files.                          |
| `Generate example: Yes` | Can add optional usage examples when the target is safe. |

The current SignalStore installer is deliberately conservative:

- feature-scoped
- dashboard-based
- no route updates
- no component updates
- no generated documentation

Parametrized installers should follow the same safety rule:

```text
Ask before changing user-owned files.
Prefer preview before apply.
Never overwrite without a safe strategy.
```

## Maintenance rules

Every CLI installer must stay aligned with its reference branch.

When an `evo/*` branch changes, verify whether an installer exists for that evolution.
If it exists, update:

- installer implementation
- preview metadata
- tests
- CLI available evolution list
- this document

Reference branches currently mapped by the CLI:

| Evolution   | Reference branch              |
| ----------- | ----------------------------- |
| SignalStore | `evo/state/signal-store`      |
| Docker SSR  | `evo/deployment/docker-ssr`   |
| Bootstrap   | `evo/design-system/bootstrap` |
| Transloco   | `evo/i18n/transloco`          |
| Runtime     | `evo/config/runtime-config`   |
| Tailwind    | `evo/design-system/tailwind`  |

## Tooling structure

Schematics-related tooling lives under:

```text
tools/schematics/
```

This includes:

- Angular schematic sources
- schematic tests
- local CLI wrapper
- build asset copy script

The cleanup tool remains outside this directory because it is starter-maintenance tooling, not schematic tooling.

## Quality checks

After changing schematics or the CLI, run:

```bash
npm run starter:evolution -- --name bootstrap --preview
npm run schematics:build
npm run schematics:test
npm run format:check
npm run lint
```

For a real apply test, use a temporary copy of the repository and then run:

```bash
npm install
npm run format:check
npm run lint
npm run build
```
