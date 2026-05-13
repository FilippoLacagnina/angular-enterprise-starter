# Current Status

## Date

May 13, 2026

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

## Current Design Choice

The starter remains design-neutral so adopters can bring their own:

- design system
- CSS/SCSS strategy
- UI component library
- branding and layout implementation

## Current Verification

- `npm run lint` passes
- `npm run format:check` passes
- `npx tsc -p tsconfig.app.json --noEmit` passes
