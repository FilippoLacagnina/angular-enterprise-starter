# Runtime Config Architecture

## Index

- [Runtime-first structure](#runtime-first-structure)
- [Application ownership](#application-ownership)
- [Runtime config files](#runtime-config-files)
- [Merge notes](#merge-notes)

## Runtime-first structure

This evolution adds runtime configuration files without changing layout or feature routing.

```text
src/
  assets/
    config/
      values.yml
  app/
    core/
      runtime-config/
        runtime-config.model.ts
        runtime-config.parser.ts
        runtime-config.provider.ts
        runtime-config.service.ts
        runtime-config.token.ts
```

The rest of the application keeps the baseline structure from `main`.

## Application ownership

Runtime configuration owns deploy-time values:

- application name
- environment label
- microservice base URLs
- public deployment metadata

API route files own endpoint paths and API versions.
Feature services own feature orchestration and data access.

## Runtime config files

```text
runtime-config.model.ts     # runtime config contract
runtime-config.parser.ts    # YAML parsing and validation
runtime-config.provider.ts  # Angular startup provider
runtime-config.service.ts   # signal-based runtime config access
runtime-config.token.ts     # default config path token
```

`RuntimeConfigService` exposes a readonly signal and an imperative `value()` accessor for services that need the loaded config.

## Merge notes

Expected architecture merge points:

- `src/app/app.config.ts`
- `src/app/core/runtime-config/*`
- `src/assets/config/values.yml`

This evolution intentionally avoids changing layout templates, dashboard templates and feature routing.
