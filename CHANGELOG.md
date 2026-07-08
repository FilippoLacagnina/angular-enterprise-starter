# Changelog

All notable changes to this project will be documented in this file.

The project is public and currently in alpha pre-release.

## Unreleased

No unreleased changes yet.

## 0.6.0-alpha.0 - 2026-07-08

Runtime Config Evolution CLI installer.

### Added

- Added the `runtime-config` Evolution CLI installer.
- Added Runtime Config preview metadata and installer documentation.
- Added deployable `src/assets/config/values.yml` generation.
- Added runtime config model, parser, provider, service and token generation.
- Added safety checks for custom `APP_CONFIG`, `@core/config` and environment-file references before applying the installer.
- Added schematic tests for Runtime Config installation and guarded failure scenarios.

### Changed

- Updated the starter baseline version to `0.6.0-alpha.0`.
- Updated the versioned Evolution CLI package metadata to `0.6.0-alpha.0`.
- Updated Evolution CLI documentation and package smoke-test references for the new release.

## 0.5.1-alpha.0 - 2026-06-04

Render-safe Evolution CLI schematic execution.

### Changed

- Updated the Evolution CLI to execute bundled schematics programmatically through Angular DevKit.
- Removed the internal dependency on shelling out to `npx ng generate`.
- Improved hosted/export flows where generated workspaces intentionally do not have local dependencies installed yet.
- Updated local package smoke-test references to `0.5.1-alpha.0`.

## 0.5.0-alpha.0 - 2026-06-03

Transloco and Tailwind Evolution CLI installers.

### Added

- Added the `transloco` Evolution CLI installer.
- Added the `tailwind` Evolution CLI installer with parametrized UI primitive generation.
- Added Transloco preview metadata and schematic tests.
- Added Tailwind preview metadata, schematic tests and installer documentation.
- Added CLI documentation for the Transloco installer.
- Updated the Evolution CLI visual preview to include Transloco.

### Changed

- Updated the starter baseline version to `0.5.0-alpha.0`.
- Updated the versioned Evolution CLI package metadata to `0.5.0-alpha.0`.

## 0.4.0-alpha.0 - 2026-05-24

Versioned Evolution CLI npm package.

### Added

- Added npm-ready Evolution CLI package under `@filippolacagnina/angular-enterprise-starter`.
- Added package build and pack scripts for the Evolution CLI.
- Added consumer cleanup mode for product repositories that should remove local installer tooling.
- Added npm alpha usage documentation and package README references.

### Changed

- Updated the starter baseline version to `0.4.0-alpha.0`.
- Clarified the alpha npm publish flow with the `alpha` dist-tag.

## 0.3.0-alpha.0 - 2026-05-20

Centralized documentation and Evolution CLI preview.

### Added

- Added centralized evolution documentation on `main`.
- Added dedicated guides for implemented `evo/*` branches.
- Added Evolution CLI documentation and README positioning.
- Added Evolution CLI preview visuals.
- Added `docs/schematics.md` as the canonical CLI/schematics guide.

### Changed

- Updated README to highlight the Evolution CLI as the guided path for optional capabilities.
- Clarified that the Evolution CLI becomes part of the `main` tooling baseline once merged.
- Clarified when to use CLI installers and when to use `evo/*` reference branches.
- Updated architecture and starter visuals.
- Updated package metadata to `0.3.0-alpha.0`.

## 0.2.0-alpha.0 - 2026-05-17

Evolution branches and runtime configuration baseline.

### Added

- Documented optional `evo/*` branch strategy.
- Added runtime configuration evolution based on deployable `assets/config/values.yml`.
- Added dedicated runtime config documentation for architecture, configuration, flow, API usage and state usage.
- Added design system evolutions for Bootstrap, Tailwind CSS, Angular Material and PrimeNG.
- Added Docker SSR deployment evolution.
- Added README guidance for choosing between Angular environment configuration and runtime configuration.

### Changed

- Updated README to present both environment-based and runtime-based configuration strategies.
- Updated evolution catalog with implemented optional baselines.

## 0.1.0-alpha.0 - 2026-05-13

Initial alpha baseline for the Angular Enterprise Starter.

### Added

- ESLint and Prettier baseline for code quality.
- Enterprise folder structure: `core`, `shared`, `layout`, `features`.
- Minimal unstyled layout shell with header, sidebar, main and footer placeholders.
- Lazy dashboard feature with root redirect from `/` to `/dashboard`.
- Application config baseline with `local`, `dev`, `test` and `prod` environments.
- Dashboard API routes and dashboard service examples.
- HTTP client provider with `withFetch()`.
- Correlation id and error HTTP interceptors.
- Technical documentation split by topic.
- Architecture, configuration, API, routing/SSR and state management documentation.

### Changed

- Removed Angular default starter template.
- Kept layout templates intentionally unstyled for future customization.
- Refreshed README as the project entrypoint.

### Planned

- Testing strategy.
- Optional UI/design system baseline.
