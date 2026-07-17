<p align="center">
  <a href="https://angular.dev/" aria-label="Angular">
    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2c/Angular_icon.svg" alt="Angular logo" width="96" />
  </a>
</p>

# Angular Enterprise Starter

![Angular Enterprise Starter Architecture](./docs/assets/angular-enterprise-starter-banner.svg)

[![CI](https://github.com/FilippoLacagnina/angular-enterprise-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/FilippoLacagnina/angular-enterprise-starter/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/FilippoLacagnina/angular-enterprise-starter?include_prereleases)](https://github.com/FilippoLacagnina/angular-enterprise-starter/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular)](https://angular.dev/)
![Evolution CLI](https://img.shields.io/badge/Evolution%20CLI-preview%20%7C%20apply-0f766e?logo=gnubash&logoColor=white)
[![Interactive Builder](https://img.shields.io/badge/Interactive%20Builder-live-0891b2?logo=angular&logoColor=white)](https://angular-enterprise-starter-builder.onrender.com/)
[![Evolution CLI npm alpha](https://img.shields.io/npm/v/%40filippolacagnina%2Fangular-enterprise-starter/alpha?label=Evolution%20CLI%20npm%20alpha&logo=npm&color=cb3837)](https://www.npmjs.com/package/@filippolacagnina/angular-enterprise-starter)

**Available Evolutions**

![i18n Transloco](https://img.shields.io/badge/evo%2Fi18n-transloco-0ea5e9)
![Config Runtime Config](https://img.shields.io/badge/evo%2Fconfig-runtime--config-0891b2)
![Design System PrimeNG](https://img.shields.io/badge/evo%2Fdesign--system-primeng-7c3aed)
![Design System Tailwind](https://img.shields.io/badge/evo%2Fdesign--system-tailwind-7c3aed)
![Design System Angular Material](https://img.shields.io/badge/evo%2Fdesign--system-angular--material-7c3aed)
![Design System Bootstrap](https://img.shields.io/badge/evo%2Fdesign--system-bootstrap-7c3aed)
![Deployment Docker SSR](https://img.shields.io/badge/evo%2Fdeployment-docker--ssr-2563eb)
![State Signal Store](https://img.shields.io/badge/evo%2Fstate-signal--store-65a30d)
![Tooling Dependency Monitoring](https://img.shields.io/badge/evo%2Ftooling-dependency--monitoring-475569)

**WIP Evolutions**

![API GraphQL](https://img.shields.io/badge/evo%2Fapi-graphql-0f766e)
![i18n Angular Localize](https://img.shields.io/badge/evo%2Fi18n-angular--localize-0ea5e9)
![Testing Playwright](https://img.shields.io/badge/evo%2Ftesting-playwright-16a34a)
![Testing Cypress](https://img.shields.io/badge/evo%2Ftesting-cypress-16a34a)
![Design System PrimeNG Tailwind](https://img.shields.io/badge/evo%2Fdesign--system-primeng--tailwind-7c3aed)
![Deployment Docker Compose](https://img.shields.io/badge/evo%2Fdeployment-docker--compose-2563eb)
![State NgRx Store](https://img.shields.io/badge/evo%2Fstate-ngrx--store-65a30d)
![Auth OIDC](https://img.shields.io/badge/evo%2Fauth-oidc-be185d)

Angular Enterprise Starter is an enterprise-ready Angular 21 baseline for building scalable applications from a minimal, documented and composable foundation.

It combines a clean `main` branch with optional evolution paths, an **Interactive Builder** and a guided **Evolution CLI** for adding validated capabilities without turning the starter into a fixed all-in-one template.

> [!IMPORTANT]
> Start from `main` for the cleanest baseline. You can add evolutions in two ways: through the guided Evolution CLI, or by starting from / merging compatible `evo/*` branches.

> [!IMPORTANT]
> Choose the configuration strategy early: use Angular environment files from `main`, or use `evo/config/runtime-config` for deployable runtime configuration through `assets/config/values.yml`.

See [Evolutions](./docs/evolutions.md) for the full branch catalog, implemented variants, planned variants and maintenance rules.

## Interactive Builder

The Interactive Builder is the visual entry point for composing an Angular Enterprise Starter baseline.
It lets users select available evolutions, configure supported options and export a generated project from the browser.

[Open the Interactive Builder](https://angular-enterprise-starter-builder.onrender.com/)

The Builder complements the Evolution CLI: the UI helps explore and compose a starter visually, while the CLI remains the versioned automation path for local and scripted workflows.

## Evolution CLI

The Evolution CLI is the recommended path when an installer exists.
Compared with using an `evo/*` branch directly, it provides a richer guided flow with preview, parametrized choices, repeatable generators and safety checks.

It lets teams select optional capabilities, preview the impact and apply validated evolutions through a safer parametrized workflow.

`evo/*` branches remain useful as reference implementations, manual merge targets and fallbacks for capabilities that are not CLI-installable yet.

| Usage mode          | Command                                                            |
| ------------------- | ------------------------------------------------------------------ |
| Local starter clone | `npm run starter:evolution`                                        |
| Versioned npm CLI   | `npx @filippolacagnina/angular-enterprise-starter@alpha evolution` |

> [!TIP]
> During alpha, use the `@alpha` npm tag for the versioned CLI package.
> This is the recommended flow after removing local installer tooling from a product repository.

```bash
npm run starter:evolution
```

![Angular Enterprise Starter CLI](./docs/assets/starter-evolution-cli.svg)

The CLI focuses on three principles:

| Principle            | What it means                                                     |
| -------------------- | ----------------------------------------------------------------- |
| Preview first        | Show files to create/update before touching the workspace.        |
| Apply safely         | Stop before overwriting existing files or ambiguous project code. |
| Parametrized choices | Ask for explicit options when an evolution needs project context. |

First CLI installers:

| Installer      | Purpose                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| Transloco      | Add runtime i18n provider, loader and EN/IT translation assets.                          |
| Runtime Config | Add deployable `assets/config/values.yml` runtime configuration with safety checks.      |
| SignalStore    | Generate feature/root stores with route provider registration and safe target detection. |
| Docker SSR     | Add an SSR-oriented Docker deployment baseline.                                          |
| Bootstrap      | Add Bootstrap and generate selected starter-owned UI wrapper components.                 |
| Tailwind       | Add Tailwind CSS and generate selected starter-owned UI wrapper components.              |
| AI Genkit      | Add a server-side Genkit foundation with Gemini; the summary example is explicit opt-in. |

Additional installers are in active development and will be added progressively as evolutions are validated.

Detailed command usage is intentionally kept out of the README and documented in the dedicated [Evolution CLI guide](./docs/schematics.md), with installer-specific guides under `docs/evolution-cli/`.

## Current Release

```text
v0.6.0-alpha.0 - Runtime Config Evolution CLI installer
```

Current evolution branches:

| Branch                               | Description                         |
| ------------------------------------ | ----------------------------------- |
| `evo/i18n/transloco`                 | Transloco runtime i18n baseline     |
| `evo/config/runtime-config`          | Runtime YAML configuration baseline |
| `evo/design-system/tailwind`         | Tailwind CSS styling baseline       |
| `evo/design-system/primeng`          | PrimeNG component baseline          |
| `evo/design-system/angular-material` | Angular Material component baseline |
| `evo/design-system/bootstrap`        | Bootstrap styling baseline          |
| `evo/deployment/docker-ssr`          | Docker SSR deployment baseline      |
| `evo/state/signal-store`             | NgRx SignalStore state baseline     |
| `evo/tooling/dependency-monitoring`  | Dependency monitoring report        |
| `evo/ai/genkit`                      | Server-side Genkit AI foundation    |

## Why This Starter

- Enterprise-oriented architecture without UI library lock-in.
- Angular 21 baseline with standalone APIs and modern application setup.
- SSR, prerender and hydration strategy documented from the beginning.
- Environment configuration for `local`, `dev`, `test` and `prod`.
- Runtime configuration through deployable `assets/config/values.yml`.
- API route conventions designed for multiple microservices and versioned endpoints.
- Optional `evo/*` branches and Evolution CLI installers for composable add-ons without forcing every project into the same stack.
- Optional maintenance tooling for monitoring dependencies across `main` and evolution branches.
- Simple, detailed documentation focused on Angular and enterprise best practices.
- Post-clone cleanup workflow for adapting the starter to a real product repository.

## Configuration Strategy

Choose the configuration model before starting a real project.

| Strategy                           | Recommended starting point  | Best for                                                                 |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| Angular environment files          | `main`                      | build-time configuration, simpler apps, projects that rebuild per target |
| Runtime `assets/config/values.yml` | `evo/config/runtime-config` | deploy-time configuration, Docker, CI/CD, build-once deploy-many flows   |

Both approaches are documented and visible on purpose.
Avoid keeping both strategies active for the same values unless there is a clear architectural reason.

## Current Baseline

- public alpha release: `v0.6.0-alpha.0`
- based on Angular 21
- intentionally minimal and unstyled
- layout placeholders only (`Header`, `Sidebar`, `Main`, `Footer`)
- no layout CSS classes in templates
- empty layout SCSS files for future customization
- enterprise folders already scaffolded (`core`, `shared`, `layout`, `features`)
- root route redirects to `/dashboard`
- dashboard feature is lazy-loaded
- application config supports `local`, `dev`, `test` and `prod`

## Architecture Preview

![Angular Enterprise Starter Architecture](./docs/assets/angular-enterprise-architecture.svg)

```text
src/app/
  core/       # singleton infrastructure and cross-cutting concerns
  shared/     # reusable building blocks
  layout/     # global shell components
  features/   # lazy business areas
```

Feature example:

```text
features/orders/
  orders.routes.ts
  views/
  components/
  services/
  models/
```

See [Architecture Guidelines](./docs/architecture.md) for the full recommended structure.

## Getting Started

```bash
git clone git@github.com:FilippoLacagnina/angular-enterprise-starter.git
cd angular-enterprise-starter
npm install
npm run start
```

By default, `npm run start` uses the `local` environment.

If you start from `evo/config/runtime-config`, the app loads `/assets/config/values.yml` instead of Angular environment files.

After cloning it for a real product, preview starter-only files that can be removed:

```bash
npm run starter:cleanup
```

Apply cleanup only when you are ready:

```bash
npm run starter:cleanup:apply
```

The cleanup script removes starter community and planning files only.
It does not remove `LICENSE`, `README.md`, `package.json` or technical documentation.

For product repositories that should not keep local installer sources, use consumer mode after the project baseline is ready:

```bash
npm run starter:cleanup:consumer
```

Consumer mode removes local installer tooling while keeping evolutions available through:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution
```

This is the recommended long-term flow for real product repositories: keep the application clean, then receive newer installer behavior from the versioned npm package.

## Evolutions Catalog

See [Evolutions](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions.md) for the complete branch catalog, implemented variants, planned variants, compatibility notes and maintenance rules.

## Scripts

Essential commands for working with the starter:

| Command                            | Purpose                                                        |
| ---------------------------------- | -------------------------------------------------------------- |
| `npm run start`                    | Start the local development server.                            |
| `npm run build`                    | Generate the production browser/server bundle.                 |
| `npm run test`                     | Run the test suite.                                            |
| `npm run lint`                     | Run ESLint checks.                                             |
| `npm run format:check`             | Verify Prettier formatting.                                    |
| `npm run serve:ssr`                | Run the generated SSR server after a build.                    |
| `npm run starter:evolution`        | Open the guided Evolution CLI.                                 |
| `npm run starter:cleanup`          | Preview starter-only files that can be removed after cloning.  |
| `npm run starter:cleanup:apply`    | Remove starter-only files after reviewing the cleanup preview. |
| `npm run starter:cleanup:consumer` | Remove local installer tooling from product repositories.      |

Environment-specific scripts such as `start:dev`, `build:test` and `build:prod` are available in `package.json` and documented in [Configuration](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/configuration.md).

To test the generated SSR/server bundle locally:

```bash
npm run build
npm run serve:ssr
```

## Documentation

Canonical documentation is maintained on `main` and is intended to be readable from every branch.

- [Architecture Guidelines](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/architecture.md)
- [Configuration](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/configuration.md)
- [API Contracts](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/api.md)
- [Routing and SSR](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/routing.md)
- [State Management](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/state-management.md)
- [Testing Strategy](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/testing.md)
- [Evolutions](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions.md)
- [Evolution CLI](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/schematics.md)
- [Versioning](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/versioning.md)
- [Current Status](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/current-status.md)
- [Roadmap](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/ROADMAP.md)
- [Changelog](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/CHANGELOG.md)

## Runtime Config Documentation

Use these canonical guides when choosing `evo/config/runtime-config`.

- [Runtime Config Overview](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/runtime-config.md)
- [Architecture](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/runtime-config/architecture.md)
- [Configuration](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/runtime-config/configuration.md)
- [Flow](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/runtime-config/flow.md)
- [API Usage](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/runtime-config/api.md)
- [State Usage](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/runtime-config/state-management.md)

## Evolution Documentation

Evolution guides are centralized on `main`; evolution branches should focus on implementation code and link back to these canonical pages.

- [Transloco Evolution](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/i18n-transloco.md)
- [Runtime Config Evolution](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/runtime-config.md)
- [PrimeNG Evolution](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/primeng.md)
- [Tailwind Evolution](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/tailwind.md)
- [Angular Material Evolution](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/angular-material.md)
- [Bootstrap Evolution](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/bootstrap.md)
- [Docker SSR Evolution](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/docker-ssr.md)
- [Signal Store Evolution](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/signal-store.md)
- [Dependency Monitoring Evolution](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/dependency-monitoring.md)
- [AI Genkit Evolution](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions/ai-genkit.md)

## Community

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Pull Request Template](./.github/pull_request_template.md)

## Alpha Notes

The repository is public and currently in alpha pre-release.
The root Angular starter application remains marked as `private` to prevent accidental npm publication.
The Evolution CLI is packaged separately for npm usage.

Before the first stable release:

- review documentation and examples
- remove or adapt demonstrative examples such as `dashboard-api.routes.ts` and `DashboardService`

## Trademark Notice

Angular and the Angular logo are trademarks of Google LLC.
The Angular logo is used from the official Angular Press Kit under CC BY 4.0.
This project is not affiliated with or endorsed by Google or the Angular team.
