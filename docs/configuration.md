# Configuration

## Index

- [Application config](#application-config)
- [Environment mapping](#environment-mapping)
- [Usage rules](#usage-rules)

## Application config

Global application configuration lives in `core/config` and is registered through Angular dependency injection.

Current structure:

```text
core/config/
  app-environment.type.ts
  app-config.model.ts
  app-config.provider.ts
  app-config.token.ts

environments/
  environment.ts
  environment.local.ts
  environment.dev.ts
  environment.test.ts
  environment.prod.ts
```

The application imports `src/environments/environment.ts`.
Angular replaces that file through `fileReplacements` for `local`, `development`, `test` and `production`.

## Environment mapping

Preferred npm scripts:

```text
npm run start                         -> local
npm run start:local                   -> local
npm run start:dev                     -> dev
npm run start:test                    -> test
npm run build                         -> prod
npm run build:local                   -> local
npm run build:dev                     -> dev
npm run build:test                    -> test
npm run build:prod                    -> prod
```

Equivalent Angular CLI commands:

```text
ng serve                              -> local
ng serve --configuration test         -> test
ng build --configuration local        -> local
ng build --configuration development  -> dev
ng build --configuration test         -> test
ng build --configuration production   -> prod
```

Environment usage:

- `local`: developer machine, local backends or local mocks.
- `dev`: shared development environment.
- `test`: QA/integration environment.
- `prod`: production.

## Usage rules

```ts
export type AppEnvironment = 'local' | 'dev' | 'test' | 'prod';

export interface AppApiEndpoints {
  dashboard: string;
}

export interface AppConfig {
  appName: string;
  environment: AppEnvironment;
  api: AppApiEndpoints;
}
```

Environment files should contain base URLs and values that depend on the current environment.
Do not put REST endpoint paths in environment files.
