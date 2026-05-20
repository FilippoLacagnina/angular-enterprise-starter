# Runtime Config Evolution

## Index

- [Goal](#goal)
- [Configuration choice](#configuration-choice)
- [Dedicated documentation](#dedicated-documentation)
- [What this evolution adds](#what-this-evolution-adds)
- [Official resources](#official-resources)

## Goal

This evolution makes application configuration runtime-first.

The goal is to build the Angular application once and deploy the same artifact across multiple environments by replacing a deployable configuration file.

Typical flow:

```text
build once
deploy to local/dev/test/prod
replace assets/config/values.yml per environment
run the same Angular artifact
```

## Configuration choice

Decide the configuration strategy early when starting a real project.

Recommended options:

- Start from `main` when Angular environment files are enough for the project.
- Start from `evo/config/runtime-config` when deploy-time configuration should live in `assets/config/values.yml`.

Avoid keeping both strategies active in the same application unless there is a very explicit reason.
Using both Angular environment files and runtime config for the same values creates unclear ownership and deployment risk.

## Dedicated documentation

Runtime config changes several baseline assumptions.
To reduce conflicts with other `evo/*` branches, runtime-specific documentation lives in dedicated files:

- [Runtime Config Architecture](./runtime-config/architecture.md)
- [Runtime Config Configuration](./runtime-config/configuration.md)
- [Runtime Config Flow](./runtime-config/flow.md)
- [Runtime Config API Usage](./runtime-config/api.md)
- [Runtime Config State Usage](./runtime-config/state-management.md)

Shared documentation files stay as close as possible to the `main` baseline.

## What this evolution adds

```text
src/assets/config/values.yml
src/app/core/runtime-config/
  runtime-config.model.ts
  runtime-config.parser.ts
  runtime-config.provider.ts
  runtime-config.service.ts
  runtime-config.token.ts
```

This evolution removes application-level Angular environment files.
Application values are expected to live in `values.yml`.

The application startup registers:

```ts
provideRuntimeConfig();
```

The runtime config is loaded before the application finishes initialization.

## Official resources

- [Angular application configuration](https://angular.dev/guide/di/dependency-injection-providers)
- [Angular `provideAppInitializer`](https://angular.dev/api/core/provideAppInitializer)
- [Angular workspace assets configuration](https://angular.dev/reference/configs/workspace-config#assets-configuration)
- [YAML package](https://eemeli.org/yaml/)
