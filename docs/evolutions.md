# Evolutions

## Index

- [Goal](#goal)
- [Current status](#current-status)
- [Branch strategy](#branch-strategy)
- [Evolution versioning](#evolution-versioning)
- [Merge strategy](#merge-strategy)
- [Documentation strategy](#documentation-strategy)
- [Evolution CLI model](#evolution-cli-model)
- [CLI-owned evolutions](#cli-owned-evolutions)
- [Implemented evolution branches](#implemented-evolution-branches)
- [Planned evolution branches](#planned-evolution-branches)
- [Usage model](#usage-model)
- [Contribution model](#contribution-model)
- [Maintenance rules](#maintenance-rules)

## Goal

The `main` branch is intentionally kept minimal, clean and non-opinionated.

Optional starter capabilities can be developed in dedicated evolution branches.
This allows consumers to choose a richer baseline without forcing every project to adopt the same tooling or architectural decisions.

## Current status

At least one evolution branch is already implemented and can be used as an optional baseline.

Branches marked as WIP should be considered experimental until explicitly marked as implemented or stable.
Branch names, scope and implementation details may change before the first stable starter release.

## Branch strategy

Use this naming pattern:

```text
evo/<area>/<solution>
```

Examples:

```text
evo/i18n/transloco
evo/i18n/angular-localize
evo/config/runtime-config
evo/api/graphql
evo/testing/playwright
evo/testing/cypress
evo/design-system/tailwind
evo/design-system/angular-material
evo/design-system/bootstrap
evo/deployment/docker-ssr
evo/deployment/docker-compose
evo/state/signal-store
evo/state/ngrx-store
evo/tooling/dependency-monitoring
evo/auth/oidc
evo/ai/genkit
```

Each evolution branch should:

- start from `main`
- focus on one capability
- avoid mixing unrelated concerns
- link to canonical documentation on `main`
- remain optional for consumers
- be clearly marked as WIP until validated

## Evolution versioning

Evolution branches are not versioned independently.

The `main` branch owns the starter version and GitHub release lifecycle.
Each implemented evolution branch declares the `main` baseline version it is compatible with.

Example:

```text
main                  -> v0.10.1-alpha.0
evo/i18n/transloco    -> compatible with v0.5.0-alpha.0+
```

This keeps versioning simple while the starter is still in alpha and avoids creating separate release lifecycles for optional variants.

## Merge strategy

Evolution branches should be additive-first.

They should prefer adding new files over changing shared baseline files.
When shared files must be changed, the branch documentation must list them as expected merge points.

Expected merge points make optional branches easier to review, merge and combine with other evolutions.
They do not guarantee zero conflicts, but they make conflicts predictable and intentionally scoped.

Common shared files that may become merge points:

- `package.json`
- `package-lock.json`
- `angular.json`
- `src/app/app.config.ts`
- `src/app/app.routes.ts`
- root documentation files

## Documentation strategy

The `main` branch is the source of truth for documentation.

Evolution branches contain focused implementation variants.
They should not become independent documentation sources.

Canonical documentation lives under:

```text
docs/
docs/evolution-cli/
docs/evolutions/
```

This keeps documentation readable from every branch and reduces merge conflicts between optional evolutions.

Recommended rules:

- Keep general documentation on `main`.
- Keep CLI installation and operational guides under `docs/evolution-cli/` on `main`.
- Keep evolution-specific guides under `docs/evolutions/` on `main`.
- Link from README files to canonical `main` documentation.
- Avoid duplicating full guides inside every `evo/*` branch.
- When an evolution changes behavior, update the canonical guide before or together with the merge to `main`.
- If a branch needs a local note, keep it short and point back to the canonical documentation.

The ownership and standard guide structure are defined in the
[Evolution CLI Guide Contract](./evolution-cli/README.md).

## Evolution CLI model

The Evolution CLI is part of the `main` tooling baseline.
It is not treated as an optional evolution branch once merged into `main`.

For product repositories, local installer sources can be removed with consumer cleanup and the CLI can continue to be used through the versioned npm package:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution
```

The CLI provides a guided path for selected capabilities:

```text
preview -> review impact -> apply
```

Use the CLI when an installer exists for the desired capability.
Use `evo/*` branches when a capability is not CLI-installable yet, or when the full reference implementation should be reviewed manually.

The CLI can provide more functionality than the related branch because it can ask for dynamic choices, generate only selected files, skip already installed pieces, detect unsafe partial states and keep starter metadata aligned.
The `evo/*` branch remains the implementation reference and manual fallback.

Every CLI installer must stay aligned with its related reference branch, the dedicated [Evolution CLI guide](./schematics.md) and its installer-specific guide under `docs/evolution-cli/`.

## CLI-owned evolutions

CLI-owned evolutions do not require an `evo/*` reference branch. Their manifest, installer, tests
and canonical documentation on `main` are the implementation source of truth.

| Evolution      | Guide                                    | Area   | Description                                     |
| -------------- | ---------------------------------------- | ------ | ----------------------------------------------- |
| `layout-shell` | [Guide](./evolution-cli/layout-shell.md) | layout | Configurable Shell and optional layout regions. |

## Implemented evolution branches

> [!IMPORTANT]
> Implemented evolution branches are available optional baselines and should be reviewed before starting a new project.

| Branch                                                                                                                                         | Guide                                          | Area          | Description                                                             | Compatible baseline | Expected merge points                                                           | Status      |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------- | ----------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------- | ----------- |
| [`evo/i18n/transloco`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/i18n/transloco)                                 | [Guide](./evolutions/i18n-transloco.md)        | i18n          | Runtime Transloco baseline with CLI-configurable language assets.       | `v0.5.0-alpha.0`    | `package.json`, `package-lock.json`, `angular.json`, `app.config.ts`            | Implemented |
| [`evo/config/runtime-config`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/config/runtime-config)                   | [Guide](./evolutions/runtime-config.md)        | config        | Runtime YAML configuration loaded from deployable assets.               | `v0.5.0-alpha.0`    | `package.json`, `package-lock.json`, `angular.json`, `app.config.ts`, config    | Implemented |
| [`evo/design-system/angular-material`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/design-system/angular-material) | [Guide](./evolutions/angular-material.md)      | design system | Angular Material component baseline.                                    | `v0.5.0-alpha.0`    | `package.json`, `package-lock.json`, `src/styles.scss`                          | Implemented |
| [`evo/design-system/primeng`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/design-system/primeng)                   | [Guide](./evolutions/primeng.md)               | design system | PrimeNG component baseline.                                             | `v0.5.0-alpha.0`    | `package.json`, `package-lock.json`, `src/app/app.config.ts`, `src/styles.scss` | Implemented |
| [`evo/design-system/tailwind`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/design-system/tailwind)                 | [Guide](./evolutions/tailwind.md)              | design system | Tailwind CSS styling baseline.                                          | `v0.5.0-alpha.0`    | `package.json`, `package-lock.json`, `.postcssrc.json`, `src/styles.scss`       | Implemented |
| [`evo/design-system/bootstrap`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/design-system/bootstrap)               | [Guide](./evolutions/bootstrap.md)             | design system | Bootstrap-based styling baseline.                                       | `v0.5.0-alpha.0`    | `package.json`, `package-lock.json`, `src/styles.scss`                          | Implemented |
| [`evo/deployment/docker-ssr`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/deployment/docker-ssr)                   | [Guide](./evolutions/docker-ssr.md)            | deployment    | Docker SSR baseline for running the Angular Node server in container.   | `v0.5.0-alpha.0`    | `Dockerfile`, `.dockerignore`                                                   | Implemented |
| [`evo/state/signal-store`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/state/signal-store)                         | [Guide](./evolutions/signal-store.md)          | state         | NgRx SignalStore feature-first state management baseline.               | `v0.5.0-alpha.0`    | `package.json`, `package-lock.json`, dashboard state files                      | Implemented |
| [`evo/tooling/dependency-monitoring`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/tooling/dependency-monitoring)   | [Guide](./evolutions/dependency-monitoring.md) | tooling       | Angular-aware dependency monitoring report across main and evolutions.  | `v0.5.0-alpha.0`    | `package.json`, `README.md`, `tools/`                                           | Implemented |
| [`evo/ai/genkit`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/ai/genkit)                                           | [Guide](./evolutions/ai-genkit.md)             | AI            | Server-side Genkit foundation with Gemini and removable typed examples. | `v0.6.0-alpha.0`    | `package.json`, `package-lock.json`, `src/server.ts`, `src/app/app.routes.ts`   | Implemented |

## Planned evolution branches

| Branch                               | Area          | Description                                                     | Status |
| ------------------------------------ | ------------- | --------------------------------------------------------------- | ------ |
| `evo/api/graphql`                    | api           | GraphQL client baseline with provider setup and conventions.    | WIP    |
| `evo/i18n/angular-localize`          | i18n          | Angular built-in i18n baseline with compile-time translations.  | WIP    |
| `evo/testing/playwright`             | testing       | End-to-end testing baseline.                                    | WIP    |
| `evo/testing/cypress`                | testing       | Cypress end-to-end testing baseline.                            | WIP    |
| `evo/design-system/primeng-tailwind` | design system | PrimeNG and Tailwind CSS integrated baseline.                   | WIP    |
| `evo/deployment/docker-compose`      | deployment    | Docker Compose baseline for SSR and runtime config mounting.    | WIP    |
| `evo/state/ngrx-store`               | state         | Classic NgRx Store baseline with actions, reducers and effects. | WIP    |
| `evo/auth/oidc`                      | auth          | OIDC authentication baseline.                                   | WIP    |

## Usage model

Consumers can start from `main` when they want the cleanest possible baseline.

When a capability is available through the Evolution CLI, consumers can preview and apply it directly from the starter:

```bash
npm run starter:evolution
```

This is the recommended path for CLI-installable capabilities because it provides guided parametrization and safer repeatable generation.

If local installer tooling has been removed from the project repository, use the versioned package instead:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution
```

Consumers can start from an evolution branch when they want a specific optional capability already integrated.

Example:

```bash
git clone --branch evo/i18n/transloco git@github.com:FilippoLacagnina/angular-enterprise-starter.git
```

Evolution branches are designed to be composable when possible.
For example, a project can start from a design system branch and later merge an i18n branch.

Example:

```bash
git checkout evo/design-system/bootstrap
git merge evo/i18n/transloco
```

Each branch still represents a focused optional path.
When combining branches, review the diff carefully and resolve conflicts explicitly.

## Contribution model

Evolution branches follow the same contribution model as `main`.

- The maintainer can push directly for setup, maintenance and controlled updates.
- External contributors should open pull requests.
- Significant changes should pass through review and quality checks.
- Each pull request should target the specific evolution branch it belongs to.

Example:

```text
base: evo/i18n/angular-localize
compare: feature/i18n/add-locale-docs
```

## Maintenance rules

- Keep `main` as the stable minimal baseline.
- Keep each evolution branch focused.
- Rebase or refresh evolution branches from `main` after relevant baseline changes.
- Declare the compatible `main` baseline for every implemented evolution branch.
- Prefer additive-first changes and keep shared file edits intentional.
- List expected merge points for every implemented evolution branch.
- Document what each evolution adds in the canonical `main` documentation.
- Prefer composable changes that can be merged with other evolution branches.
- Mark branches as WIP until their setup, documentation and quality checks are validated.
- Keep CLI installers aligned with their reference branches and `docs/schematics.md`.
- Avoid creating too many branches without maintenance capacity.
