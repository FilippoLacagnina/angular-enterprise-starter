# Architecture Guidelines

## Index

- [Goal](#goal)
- [Current layout baseline](#current-layout-baseline)
- [Application layers](#application-layers)
- [Core baseline](#core-baseline)
- [Shared baseline](#shared-baseline)
- [Feature baseline](#feature-baseline)
- [Dependency rules](#dependency-rules)
- [Naming and structure conventions](#naming-and-structure-conventions)
- [Import aliases](#import-aliases)
- [Related documentation](#related-documentation)

## Goal

This project defines a clean Angular enterprise starter with explicit structure, lazy features and minimal assumptions about UI implementation.

## Current layout baseline

The shell is intentionally unstyled:

- minimal templates with text placeholders
- no CSS classes in layout templates
- empty layout SCSS files for future customization

This keeps the starter neutral and ready for custom branding or design systems.

## Application layers

- `src/app/core`: singleton infrastructure and cross-cutting concerns.
- `src/app/shared`: reusable building blocks independent from business domains.
- `src/app/layout`: global shell components.
- `src/app/features`: lazy business areas.

## Core baseline

`core` contains application-level infrastructure:

- `core/api`: endpoint path contracts organized by microservice.
- `core/config`: application config, environment model, provider and token.
- `core/guards`: global route guards.
- `core/interceptors`: global HTTP interceptors.
- `core/services`: singleton cross-cutting services.
- `core/tokens`: shared injection tokens.

`core` must not contain UI components, routed views or feature-specific business logic.

## Shared baseline

`shared` contains reusable building blocks:

- `shared/components`: reusable presentational components.
- `shared/directives`: reusable standalone directives.
- `shared/pipes`: reusable standalone pipes.
- `shared/utils`: pure utilities and helpers.

A dedicated UI library is intentionally deferred until the design system, component APIs and reuse strategy are clear.

## Feature baseline

Each feature represents an autonomous business area.

Recommended structure:

```text
features/<feature-name>/
  <feature-name>.routes.ts
  views/
  components/
  services/
  models/
```

Usage:

- `views`: routed feature components.
- `components`: feature-internal components.
- `services`: feature-specific services.
- `models`: feature-specific types and models.

A dashboard-specific service, for example, belongs in `features/dashboard/services`, not in `core/services`.

## Dependency rules

1. `core` does not import features.
2. `shared` does not import features.
3. Features may depend on `core` and `shared`.
4. Features must not import each other directly.
5. Feature routes should be lazy-loaded.
6. HTTP access should go through services or data-access layers, not presentational components.
7. DTOs and domain models should stay separate when the boundary matters.

## Naming and structure conventions

- Use `kebab-case` for file names.
- Prefer standalone components and modern Angular APIs.
- Routed views live in `features/<feature-name>/views/<view-name>/<view-name>.component.*`.
- Each feature exposes routes through `features/<feature-name>/<feature-name>.routes.ts`.
- Keep a flat structure for one source file plus optional `.spec.ts`.
- Create a dedicated folder when a block needs multiple related files.
- Keep unit tests close to the source under test.

## Import aliases

The project exposes TypeScript aliases for application layers:

- `@core/*`: singleton infrastructure.
- `@shared/*`: reusable building blocks.
- `@features/*`: lazy features and domain logic.
- `@layout/*`: global layout components.

Use aliases when importing across layers or distant folders. Prefer short relative imports for files that are close to each other in the same block.

## Related documentation

- [Configuration](./configuration.md)
- [API Contracts](./api.md)
- [Routing and SSR](./routing.md)
- [State Management](./state-management.md)
- [Current Status](./current-status.md)
