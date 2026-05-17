# Changelog

All notable changes to this project will be documented in this file.

The project is currently private and in alpha pre-release.

## Unreleased

No unreleased changes yet.

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
