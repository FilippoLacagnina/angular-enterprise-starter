# Runtime Config Configuration

## Index

- [Runtime-first model](#runtime-first-model)
- [Runtime config file](#runtime-config-file)
- [Build configuration](#build-configuration)
- [Usage rules](#usage-rules)

## Runtime-first model

In the runtime-config evolution, application configuration is runtime-first.

The application does not use Angular environment files for application parameters.
There are no `src/environments/*` files and no Angular `fileReplacements` for application config.

Runtime configuration is loaded from:

```text
src/assets/config/values.yml
```

At build output/runtime, the file is served from:

```text
/assets/config/values.yml
```

This makes `values.yml` the source of truth for deploy-time values.

Runtime config implementation lives in:

```text
src/app/core/runtime-config/
  runtime-config.model.ts
  runtime-config.parser.ts
  runtime-config.provider.ts
  runtime-config.service.ts
  runtime-config.token.ts
```

## Runtime config file

Current structure:

```yaml
app:
  name: Angular Enterprise Starter
  environment: local

api:
  dashboard:
    baseUrl: http://localhost:3000
```

Recommended ownership:

- `values.yml`: app metadata, deploy environment label and microservice base URLs.
- `core/api/*-api.routes.ts`: endpoint paths and API versions.
- application code: feature behavior and domain logic.

## Build configuration

Angular build configurations still exist only for build behavior.
They must not contain application values.

Current scripts:

```text
npm run start                         -> local dev server
npm run build                         -> production build
npm run build:dev                     -> development build mode
npm run watch                         -> development watch build
```

Changing from `local` to `dev`, `test` or `prod` should be done by replacing `assets/config/values.yml`, not by rebuilding with different environment files.

## Usage rules

Runtime config types live in:

```text
src/app/core/runtime-config/runtime-config.model.ts
```

Use `RuntimeConfigService` when application code needs deploy-time values:

```ts
import { inject } from '@angular/core';
import { RuntimeConfigService } from '@core/runtime-config/runtime-config.service';

const runtimeConfig = inject(RuntimeConfigService);
const dashboardBaseUrl = runtimeConfig.value().api.dashboard.baseUrl;
```

Rules:

- keep every deploy-time application value in `values.yml`;
- do not recreate Angular environment files for app config;
- do not put API versions in `values.yml` unless they are truly deployment-owned;
- keep API versions and endpoint paths in service-specific route files;
- never put secrets in frontend runtime config.
