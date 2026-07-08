# Runtime Config CLI Installer

## Purpose

The Runtime Config installer replaces Angular environment-file configuration with a deployable `assets/config/values.yml` strategy.

Use it when the project should support build-once deploy-many flows, Docker delivery or pipeline/container replacement of runtime values.

Reference branch:

```text
evo/config/runtime-config
```

## What It Does

- adds the `yaml` dependency;
- creates runtime config model, parser, provider, service and token files under `src/app/core/runtime-config`;
- creates `src/assets/config/values.yml`;
- registers `src/assets` in `angular.json`;
- adds `yaml` to Angular allowed CommonJS dependencies;
- removes Angular environment file replacements from `angular.json`;
- replaces `provideAppConfig(environment)` with `provideRuntimeConfig()`;
- removes baseline `core/config` and `src/environments` files when present;
- updates the baseline `DashboardService` only when it still uses the default `APP_CONFIG` pattern.

## Preview

```bash
npm run starter:evolution -- --name runtime-config --preview
```

Package mode:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution --name runtime-config --preview
```

## Apply

```bash
npm run starter:evolution -- --name runtime-config --apply
```

Non-interactive apply:

```bash
npm run starter:evolution -- --name runtime-config --apply --yes
```

Use `--apply` only after reviewing preview output.

## Generated Structure

```text
src/app/core/runtime-config/
  runtime-config.model.ts
  runtime-config.parser.ts
  runtime-config.provider.ts
  runtime-config.service.ts
  runtime-config.token.ts

src/assets/config/
  values.yml
```

## Default Values

```yaml
app:
  name: Angular Enterprise Starter
  environment: local

api:
  dashboard:
    baseUrl: http://localhost:3000
```

## Notes

Runtime config is a configuration strategy evolution.
Select it early, preferably before adding project-specific environment files or feature services.

The installer intentionally avoids changing layout templates or adding UI examples.
