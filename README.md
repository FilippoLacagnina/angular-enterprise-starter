# Angular Enterprise Starter

Angular starter project for enterprise applications, currently in private pre-release.

The goal is to provide a clean, documented baseline with modern Angular APIs, lazy feature routing, strict tooling, environment configuration and clear architectural boundaries.

## Current Status

This project is intentionally minimal and unstyled:

- layout placeholders only (`Header`, `Sidebar`, `Main`, `Footer`)
- no layout CSS classes in templates
- empty layout SCSS files for future customization
- enterprise folders already scaffolded (`core`, `shared`, `layout`, `features`)
- root route redirects to `/dashboard`
- dashboard feature is lazy-loaded
- application config supports `local`, `dev`, `test` and `prod`

## Quick Start

```bash
npm install
npm run start
```

By default, `npm run start` uses the `local` environment.

## Scripts

```bash
npm run start
npm run build
npm run serve:ssr
npm run test
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

To test the generated SSR/server bundle locally:

```bash
npm run build
npm run serve:ssr
```

## Documentation

- [Architecture Guidelines](./docs/architecture.md)
- [Configuration](./docs/configuration.md)
- [API Contracts](./docs/api.md)
- [Routing and SSR](./docs/routing.md)
- [State Management](./docs/state-management.md)
- [Current Status](./docs/current-status.md)
- [Roadmap](./ROADMAP.md)
- [Changelog](./CHANGELOG.md)

## Pre-release Notes

The repository is still private and the package version is `0.0.0`.

Before making it public:

- decide and add a license
- review documentation and examples
- decide the first public alpha version
- remove or adapt demonstrative examples such as `dashboard-api.routes.ts` and `DashboardService`
