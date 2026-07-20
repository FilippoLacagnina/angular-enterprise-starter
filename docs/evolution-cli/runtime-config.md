# Runtime Config CLI Installer

<!-- evolution-guide-standard -->

## Purpose

The `runtime-config` evolution replaces application-level Angular environment configuration with a
deployable `assets/config/values.yml` strategy.

It supports build-once deploy-many delivery: the same Angular browser and SSR artifacts can be
promoted across environments while public application values are replaced at deployment time.

Reference branch:

```text
evo/config/runtime-config
```

## When to use it

Use Runtime Config when:

- one build artifact must be promoted through local, development, test and production;
- public API base URLs or application labels must change without rebuilding Angular;
- Docker, Kubernetes or a deployment pipeline will provide a configuration asset;
- application configuration needs explicit runtime validation.

Do not use `values.yml` for credentials, tokens, private endpoints or server-only settings. The file
is served as a public browser asset.

Choose this evolution early. Keeping Angular environment files and Runtime Config as competing
owners of the same value creates ambiguous deployment behavior.

## Prerequisites

Before applying:

- start from a compatible Angular Enterprise Starter workspace;
- keep a valid Angular build configuration in `angular.json`;
- keep a supported provider anchor in `src/app/app.config.ts`;
- migrate custom `APP_CONFIG`, `@core/config` and Angular environment references that the preview
  reports;
- confirm that removing baseline environment files is acceptable for the project.

The default starter `app.config.ts` and `DashboardService` are migrated automatically only while
they still match the supported starter-owned patterns.

## Generated changes

The evolution creates:

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

It updates:

- `angular.json` to register `src/assets`, allow `yaml` and remove environment file replacements;
- `src/app/app.config.ts` to register `provideRuntimeConfig()`;
- the baseline `DashboardService` when it still uses the managed `APP_CONFIG` pattern;
- `tsconfig.spec.json` to remove deleted environment files from test includes;
- starter metadata.

It removes the baseline `src/app/core/config/` and `src/environments/` files when present.

No layout, route or UI example is generated.

## Dependencies

Runtime Config requires:

| Package | Supported range | Target         |
| ------- | --------------- | -------------- |
| `yaml`  | `^2.9.0`        | `dependencies` |

The installer preserves a compatible existing declaration and blocks invalid ranges, incompatible
ranges or a declaration in the wrong dependency section.

## Options

Runtime Config has no evolution-specific options. Its behavior is intentionally deterministic
because it replaces the starter configuration strategy as one atomic migration.

## Preview and apply

Preview:

```bash
npm run starter:evolution -- --name runtime-config --preview
```

Apply after resolving every blocking note:

```bash
npm run starter:evolution -- --name runtime-config --apply
```

Non-interactive apply:

```bash
npm run starter:evolution -- --name runtime-config --apply --yes
```

Versioned npm CLI:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution \
  --name runtime-config \
  --preview
```

## Configuration

The generated default file is:

```yaml
app:
  name: Angular Enterprise Starter
  environment: local

api:
  dashboard:
    baseUrl: http://localhost:3000
```

The runtime parser requires:

- a non-empty `app.name`;
- `app.environment` to be `local`, `dev`, `test` or `prod`;
- an `api` object;
- a `dashboard` endpoint;
- a non-empty `baseUrl` for every endpoint.

Consumers access validated values through `RuntimeConfigService`:

```ts
private readonly runtimeConfig = inject(RuntimeConfigService);

const dashboardBaseUrl = this.runtimeConfig.value().api.dashboard.baseUrl;
```

The provider loads configuration before application initialization completes. Invalid or
unreachable configuration therefore fails startup explicitly instead of allowing the application
to continue with partial values.

## Runtime flow

```text
deploy values.yml
  -> Angular application initialization
    -> provideRuntimeConfig()
      -> RuntimeConfigService.load()
        -> fetch public YAML asset
          -> parse and validate
            -> expose typed configuration
```

During SSR, relative configuration paths are resolved against the incoming request URL. Browser and
server rendering consume the same public configuration contract.

See [Runtime Config Flow](../evolutions/runtime-config/flow.md) for the detailed bootstrap sequence.

## Safety and repeatability

The evolution is non-repeatable and runs one complete preflight before changing dependencies,
configuration or files.

It blocks:

- missing or invalid `package.json`, `angular.json` or `app.config.ts`;
- unsupported Angular build options;
- malformed `tsconfig.spec.json`;
- existing Runtime Config output files;
- an unsupported provider insertion point;
- custom application references to the environment-based configuration;
- a customized `DashboardService` that cannot be migrated safely;
- incompatible `yaml` dependency declarations.

Preview and apply use the same structural inspections. If any check fails, package dependencies,
Angular configuration, generated files and baseline environment files remain unchanged.

## Compatibility

### AI Genkit

Runtime Config owns public browser configuration. AI Genkit owns private Node process
configuration. They can be installed in either order.

| Value type                      | Correct location                   |
| ------------------------------- | ---------------------------------- |
| Public API base URLs            | `src/assets/config/values.yml`     |
| Public application labels       | `src/assets/config/values.yml`     |
| Gemini or other provider keys   | Node environment or secret manager |
| AI provider and model selection | Private Node environment           |

Never copy provider credentials into `values.yml`.

### Docker SSR

The generated YAML file is included in the Angular build output. A container platform can replace
the deployed asset without rebuilding the application, provided the replacement is mounted or
copied to the browser output path before serving requests.

Server-only environment variables remain separate and must be injected into the Node process.

### Angular environments

This evolution removes the baseline application environment files and their Angular file
replacements. Reintroduce build-time environment files only for values that genuinely must be
compiled into separate artifacts, and document ownership so the same value is not managed twice.

## Verification

After apply:

```bash
npm install
npm run format:check
npm run lint
npm test -- --watch=false
npm run build
```

Then verify that the built browser assets contain:

```text
assets/config/values.yml
```

Start the SSR application and confirm that both browser navigation and direct SSR requests load the
same validated configuration.

## Removal and rollback

The CLI does not provide an automatic uninstall command.

Rollback requires:

1. restoring the previous `core/config` and `src/environments` files;
2. restoring Angular file replacements;
3. replacing `provideRuntimeConfig()` with the previous provider;
4. migrating every `RuntimeConfigService` consumer;
5. removing the generated runtime-config files and YAML asset;
6. removing `yaml` when no other application code uses it;
7. updating starter metadata.

Because this evolution changes configuration ownership, prefer reverting it through version control
instead of performing an ad hoc production rollback.

## Troubleshooting

| Symptom                              | Likely cause                                                | Action                                                            |
| ------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| Preview lists environment references | Custom code still depends on the previous strategy.         | Migrate the listed files to `RuntimeConfigService`.               |
| Startup returns a YAML parse error   | `values.yml` does not match the required contract.          | Correct the fields and redeploy the asset.                        |
| Configuration request returns `404`  | The asset was not included or mounted at the expected path. | Verify Angular assets and deployment mapping.                     |
| SSR cannot resolve the config URL    | The request origin or configured path is invalid.           | Verify proxy headers, request URL and `RUNTIME_CONFIG_PATH`.      |
| Preview reports partial files        | A previous or manual installation is incomplete.            | Reconcile or remove those files before apply.                     |
| Secret is visible in browser tools   | A private value was incorrectly placed in `values.yml`.     | Remove it, rotate the secret and move it to server configuration. |

## Architecture reference

See:

- [Runtime Config Evolution](../evolutions/runtime-config.md)
- [Architecture](../evolutions/runtime-config/architecture.md)
- [Configuration](../evolutions/runtime-config/configuration.md)
- [Flow](../evolutions/runtime-config/flow.md)
- [API usage](../evolutions/runtime-config/api.md)
- [State usage](../evolutions/runtime-config/state-management.md)
