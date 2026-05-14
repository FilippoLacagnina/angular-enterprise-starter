# Evolutions

## Index

- [Goal](#goal)
- [Current status](#current-status)
- [Branch strategy](#branch-strategy)
- [Planned evolution branches](#planned-evolution-branches)
- [Usage model](#usage-model)
- [Contribution model](#contribution-model)
- [Maintenance rules](#maintenance-rules)

## Goal

The `main` branch is intentionally kept minimal, clean and non-opinionated.

Optional starter capabilities can be developed in dedicated evolution branches.
This allows consumers to choose a richer baseline without forcing every project to adopt the same tooling or architectural decisions.

## Current status

Evolution branches are currently work in progress.

They should be considered experimental until explicitly marked as stable.
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

## Planned evolution branches

| Branch                               | Area          | Description                                                                         | Status |
| ------------------------------------ | ------------- | ----------------------------------------------------------------------------------- | ------ |
| `evo/i18n/transloco`                 | i18n          | Runtime translation baseline for applications that need dynamic language switching. | WIP    |
| `evo/i18n/angular-localize`          | i18n          | Angular built-in i18n baseline with compile-time translations.                      | WIP    |
| `evo/testing/playwright`             | testing       | End-to-end testing baseline.                                                        | WIP    |
| `evo/design-system/tailwind`         | design system | Tailwind-based styling baseline.                                                    | WIP    |
| `evo/design-system/angular-material` | design system | Angular Material baseline.                                                          | WIP    |
| `evo/design-system/bootstrap`        | design system | Bootstrap-based styling baseline.                                                   | WIP    |
| `evo/state/signal-store`             | state         | Signal-based state management baseline.                                             | WIP    |
| `evo/auth/oidc`                      | auth          | OIDC authentication baseline.                                                       | WIP    |
| `evo/docker/basic`                   | deployment    | Docker baseline for local and deployment workflows.                                 | WIP    |

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
- Document what each evolution branch adds.
- Prefer composable changes that can be merged with other evolution branches.
- Mark branches as WIP until their setup, documentation and quality checks are validated.
- Avoid creating too many branches without maintenance capacity.
