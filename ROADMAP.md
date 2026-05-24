# Roadmap

This roadmap tracks public alpha work before the first stable release.

## Current Phase

Public alpha Evolution CLI work.

## Milestone 0.4.0-alpha.0

Goal: publish the Evolution CLI as a versioned npm package while keeping the root starter as a GitHub baseline.

### Scope

- Keep the root Angular starter package private.
- Package the Evolution CLI separately under `@filippolacagnina/angular-enterprise-starter`.
- Publish alpha versions with the npm `alpha` dist-tag.
- Support consumer repositories that remove local installer tooling.
- Keep CLI package documentation linked back to the starter documentation.

## Milestone 0.3.0-alpha.0

Goal: centralize evolution documentation and introduce the Evolution CLI as the guided installation model.

### Scope

- Keep evolution documentation canonical on `main`.
- Add dedicated guides for implemented `evo/*` branches.
- Introduce the Evolution CLI documentation and README positioning.
- Clarify CLI installers versus manual `evo/*` branch usage.
- Keep the starter composable without turning `main` into an all-in-one template.

## Milestone 0.2.0-alpha.0

Goal: document and validate the optional evolution branch model.

### Scope

- Keep `main` minimal and documented.
- Document implemented `evo/*` branches.
- Add runtime configuration as an optional baseline.
- Add design system and Docker SSR evolution references.
- Clarify environment configuration vs runtime configuration strategy.

## Milestone 0.1.0-alpha.0

Goal: provide a coherent private alpha that can be reviewed before publication.

### Scope

- Confirm base architecture and routing conventions.
- Keep layout intentionally unstyled and easy to customize.
- Keep demonstrative dashboard examples clearly documented.
- Confirm configuration strategy for `local`, `dev`, `test` and `prod`.
- Confirm API route contracts and interceptor baseline.
- Review README, technical docs and changelog before publication.

## Before Stable Release

- Decide first stable version target.
- Review repository metadata and GitHub topics.
- Remove or adapt demonstrative dashboard API/service examples.
- Expand CLI installers only when the maintenance model remains sustainable.

## Later

- Add additional Evolution CLI installers.
- Add optional testing strategy.
- Add optional auth/session examples.
