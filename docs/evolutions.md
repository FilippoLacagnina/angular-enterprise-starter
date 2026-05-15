# Evolutions

## Index

- [Goal](#goal)
- [Current status](#current-status)
- [Branch strategy](#branch-strategy)
- [Evolution versioning](#evolution-versioning)
- [Merge strategy](#merge-strategy)
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
evo/testing/playwright
evo/design-system/tailwind
evo/design-system/angular-material
evo/design-system/bootstrap
evo/state/signal-store
evo/auth/oidc
evo/docker/basic
```

Each evolution branch should:

- start from `main`
- focus on one capability
- avoid mixing unrelated concerns
- include dedicated documentation
- remain optional for consumers
- be clearly marked as WIP until validated

## Evolution versioning

Evolution branches are not versioned independently.

The `main` branch owns the starter version and GitHub release lifecycle.
Each implemented evolution branch declares the `main` baseline version it is compatible with.

Example:

```text
main                  -> v0.1.0-alpha.0
evo/i18n/transloco    -> compatible with v0.1.0-alpha.0
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

## Implemented evolution branches

> [!IMPORTANT]
> Implemented evolution branches are available optional baselines and should be reviewed before starting a new project.

| Branch                                                                                                                           | Area          | Description                                                          | Compatible baseline | Expected merge points                                                           | Status      |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------- | ----------- |
| [`evo/i18n/transloco`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/i18n/transloco)                   | i18n          | Runtime translation baseline with Transloco, static assets and docs. | `v0.1.0-alpha.0`    | `package.json`, `package-lock.json`, `angular.json`, `app.config.ts`            | Implemented |
| [`evo/design-system/primeng`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/design-system/primeng)     | design system | PrimeNG component baseline.                                          | `v0.1.0-alpha.0`    | `package.json`, `package-lock.json`, `src/app/app.config.ts`, `src/styles.scss` | Implemented |
| [`evo/design-system/bootstrap`](https://github.com/FilippoLacagnina/angular-enterprise-starter/tree/evo/design-system/bootstrap) | design system | Bootstrap-based styling baseline.                                    | `v0.1.0-alpha.0`    | `package.json`, `package-lock.json`, `src/styles.scss`                          | Implemented |

## Planned evolution branches

| Branch                               | Area          | Description                                                              | Status |
| ------------------------------------ | ------------- | ------------------------------------------------------------------------ | ------ |
| `evo/i18n/angular-localize`          | i18n          | Angular built-in i18n baseline with compile-time translations.           | WIP    |
| `evo/config/runtime-config`          | config        | Runtime configuration loaded from deployable `assets/config/values.yml`. | WIP    |
| `evo/testing/playwright`             | testing       | End-to-end testing baseline.                                             | WIP    |
| `evo/design-system/tailwind`         | design system | Tailwind-based styling baseline.                                         | WIP    |
| `evo/design-system/primeng-tailwind` | design system | PrimeNG and Tailwind CSS integrated baseline.                            | WIP    |
| `evo/design-system/angular-material` | design system | Angular Material baseline.                                               | WIP    |
| `evo/state/signal-store`             | state         | Signal-based state management baseline.                                  | WIP    |
| `evo/auth/oidc`                      | auth          | OIDC authentication baseline.                                            | WIP    |
| `evo/docker/basic`                   | deployment    | Docker baseline for local and deployment workflows.                      | WIP    |

## Usage model

Consumers can start from `main` when they want the cleanest possible baseline.

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
- Document what each evolution branch adds.
- Prefer composable changes that can be merged with other evolution branches.
- Mark branches as WIP until their setup, documentation and quality checks are validated.
- Avoid creating too many branches without maintenance capacity.
