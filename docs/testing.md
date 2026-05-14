# Testing Strategy

## Index

- [Current baseline](#current-baseline)
- [Guiding principles](#guiding-principles)
- [Recommended test levels](#recommended-test-levels)
- [File placement](#file-placement)
- [What this starter does not enforce](#what-this-starter-does-not-enforce)
- [Commands](#commands)

## Current baseline

This starter follows the current Angular CLI unit testing baseline.

The project uses Angular's unit test builder:

```json
{
  "builder": "@angular/build:unit-test"
}
```

For current Angular CLI projects, Vitest is the default test runner.
The starter keeps this default and does not add an alternative test stack by default.

## Guiding principles

- Test behavior, not implementation details.
- Keep tests close to the source under test.
- Prefer small, focused tests over broad fragile tests.
- Avoid business-specific examples in the starter.
- Add shared test utilities only when they are reused across multiple features.
- Keep the testing stack easy to replace for teams with existing standards.

## Recommended test levels

Unit tests:

- pure functions
- pipes
- services
- guards
- interceptors
- component logic

Component tests:

- user-visible behavior
- inputs and outputs
- signal-driven state
- template conditions

Integration tests:

- feature service interactions
- route-level behavior
- API boundary mapping

End-to-end tests:

- critical user journeys
- authentication flows
- cross-page workflows
- production-like integrations

End-to-end tooling is intentionally not included.
Teams can adopt Playwright, Cypress or another tool based on their delivery platform and organization standards.

## File placement

Keep test files next to the source file:

```text
dashboard.service.ts
dashboard.service.spec.ts
```

For one source file plus one test file, keep the structure flat.

Create a dedicated folder only when a block has multiple related files:

```text
order-card/
  order-card.component.ts
  order-card.component.html
  order-card.component.scss
  order-card.component.spec.ts
```

Feature-specific test helpers should stay inside the feature.
Cross-feature helpers should live in `shared` only when they are truly reusable.

## What this starter does not enforce

This starter does not enforce:

- a specific end-to-end testing tool
- a browser automation provider
- a coverage threshold
- a snapshot testing strategy
- a visual regression testing stack
- a test reporting provider

These choices should be made by the consuming team based on project requirements.

## Commands

Run unit tests:

```bash
npm run test
```

Run the repository quality gate:

```bash
npm run format:check
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npm run build
```
