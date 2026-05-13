# Angular Enterprise Starter

Angular starter project for enterprise applications, currently in alpha pre-release.

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
npm run start:local
npm run start:dev
npm run start:test
npm run build
npm run build:local
npm run build:dev
npm run build:test
npm run build:prod
npm run serve:ssr
npm run test
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run starter:cleanup
```

Environment scripts:

- `npm run start` and `npm run start:local`: start the app with the `local` environment.
- `npm run start:dev`: start the app with the shared `dev` environment.
- `npm run start:test`: start the app with the `test` environment.
- `npm run build`: build using Angular's default production configuration.
- `npm run build:local`: build with the `local` environment.
- `npm run build:dev`: build with the shared `dev` environment.
- `npm run build:test`: build with the `test` environment.
- `npm run build:prod`: build with the `prod` environment.

To test the generated SSR/server bundle locally:

```bash
npm run build
npm run serve:ssr
```

## After Cloning

This repository is a starter template.
After cloning it for a real product, review and adapt project metadata, documentation, license and examples.

Use the cleanup script to preview starter-only files that can be removed from a product repository:

```bash
npm run starter:cleanup
```

Apply the cleanup explicitly:

```bash
npm run starter:cleanup -- --yes
```

The cleanup script removes starter community and planning files only.
It does not remove `LICENSE`, `README.md`, `package.json` or technical documentation.

## Documentation

- [Architecture Guidelines](./docs/architecture.md)
- [Configuration](./docs/configuration.md)
- [API Contracts](./docs/api.md)
- [Routing and SSR](./docs/routing.md)
- [State Management](./docs/state-management.md)
- [Versioning](./docs/versioning.md)
- [Current Status](./docs/current-status.md)
- [Roadmap](./ROADMAP.md)
- [Changelog](./CHANGELOG.md)

## Community

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Pull Request Template](./.github/pull_request_template.md)

## Pre-release Notes

The repository is still private and the package version is `0.1.0-alpha.0`.
The package remains marked as `private` to prevent accidental npm publication.

Before making it public:

- review documentation and examples
- remove or adapt demonstrative examples such as `dashboard-api.routes.ts` and `DashboardService`
