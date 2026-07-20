# Current Status

## Date

July 20, 2026

## Completed

1. Quality baseline

- ESLint configured with Angular ESLint and strict rules.
- Prettier configured with `format` and `format:check` scripts.

2. Enterprise structure

- Added `core`, `shared`, `layout` and `features` layers.
- Added baseline folders for `core`, `shared` and the dashboard feature.
- Added TypeScript path aliases for application layers.

3. Layout baseline

- Added standalone layout components: shell, header, sidebar and footer.
- Kept templates intentionally minimal and unstyled.
- Left layout SCSS files empty for future customization.

4. Routing baseline

- Added root redirect from `/` to `/dashboard`.
- Added lazy dashboard feature.
- Added dashboard view under `features/dashboard/views/dashboard`.

5. Configuration and API baseline

- Added application config model, token and provider.
- Added `local`, `dev`, `test` and `prod` environment files.
- Added Angular file replacements for environment selection.
- Added dashboard API routes example.
- Added dashboard service example.

6. HTTP baseline

- Registered `HttpClient` with `provideHttpClient(withFetch())`.
- Added correlation id and error HTTP interceptors.

7. Documentation

- Reorganized technical documentation by topic.
- Refreshed README.
- Added architecture, configuration, API, routing/SSR and state management guides.

8. Evolution model

- Documented optional `evo/*` branches as reference implementations.
- Added the guided Evolution CLI as the recommended installation path when an installer exists.
- Published the Evolution CLI as a versioned npm package.
- Added the Interactive Builder as the visual composition entry point.

9. CLI-installable evolutions

- Added Transloco i18n installer.
- Added Runtime Config installer with deployable `assets/config/values.yml` generation and safety guards.
- Added SignalStore installer with feature/root store generation.
- Added Docker SSR installer.
- Added Bootstrap and Tailwind design-system installers with parametrized UI primitive generation.
- Added the AI Genkit installer with a server-only, multi-provider-ready foundation and Google AI integration.
- Added an explicit opt-in summary example with typed non-streaming and streaming APIs.

10. Evolution CLI hardening

- Added a manifest-backed catalog shared by CLI parsing, help, registry metadata and packaging.
- Added strict option parsing and evolution-specific validation.
- Added centralized semver dependency guards across all installers.
- Added atomic preflight checks for partial and ambiguous project states.
- Standardized all operational installer guides and added automated documentation checks.
- Added formatting regressions for generated configuration and design-system files.
- Refocused the README on the starter while promoting the Interactive Builder as a first-class composition path.

## Current Design Choice

The starter remains design-neutral so adopters can bring their own:

- design system
- CSS/SCSS strategy
- UI component library
- branding and layout implementation

## Current Verification

- `npm run lint` passes
- `npm run format:check` passes
- `npm run docs:check` passes
- `npm run test -- --watch=false` passes
- `npm run schematics:build` passes
- `npm run schematics:test` passes
- `npx tsc -p tsconfig.app.json --noEmit` passes
- `npm run build` passes
- `npm run evolution-cli:pack` passes
