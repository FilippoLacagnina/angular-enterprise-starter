# Changelog

All notable changes to this project will be documented in this file.

The project is currently private and pre-release. Version `0.0.0` represents active foundation work before the first public alpha.

## Unreleased

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

- First public alpha version (`0.1.0-alpha.0`).
- License decision before public release.
- Testing strategy.
- Optional UI/design system baseline.
