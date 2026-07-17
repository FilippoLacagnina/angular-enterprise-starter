# AI Genkit CLI Installer

## Purpose

The `ai-genkit` installer adds an optional, server-side Genkit foundation to Angular Enterprise Starter.

The installer currently provides a Google AI adapter for Gemini and keeps the provider boundary open for additional adapters. Provider credentials are never accepted as CLI arguments and are never written to Angular configuration.

Foundation-only installation is the default. Application examples must be selected explicitly.

Reference branch:

```text
evo/ai/genkit
```

## Preview

Preview the complete foundation and summary example:

```bash
npm run starter:evolution -- \
  --name ai-genkit \
  --preview \
  --ai-provider google-ai \
  --ai-example summary \
  --ai-model gemini-3.5-flash
```

Install only the server foundation:

```bash
npm run starter:evolution -- \
  --name ai-genkit \
  --preview \
  --ai-example none
```

Replace `--preview` with `--apply` only after reviewing the generated targets.

## Options

| Option          | Default            | Description                                                                             |
| --------------- | ------------------ | --------------------------------------------------------------------------------------- |
| `--ai-provider` | `google-ai`        | Provider adapter to install. The catalog is designed for future providers.              |
| `--ai-example`  | `none`             | Installs the foundation only, or explicitly generates `summary`.                        |
| `--ai-model`    | `gemini-3.5-flash` | Model identifier written to `.env.example`. Verify availability for the target account. |

API keys are intentionally not supported as command options because shell arguments can be retained in shell history and process metadata.

## Foundation output

Foundation-only installation generates:

```text
src/server/ai/
  ai.runtime.ts
  config/
  logging/
  providers/
```

It also:

- adds `genkit` and `@genkit-ai/google-genai` runtime dependencies;
- registers the adapter inside the managed provider catalog;
- merges server-only environment placeholders into `.env.example`;
- adds `.env` ignore rules;
- leaves `src/server.ts` and Angular routes unchanged.

## Summary example

The `summary` option additionally generates:

```text
src/server/ai/examples/summary/
src/server/ai/http/
src/contracts/ai/
src/app/features/ai-summary/
```

It registers:

```text
POST /api/ai/summarize
POST /api/ai/summarize/stream
GET  /ai-summary
```

The API includes typed validation, structured errors, request correlation, timeout handling, cancellation and an NDJSON streaming protocol. The Angular feature lets users test standard and progressive responses from the same page.

See [How a request flows through Genkit](../evolutions/ai-genkit.md#how-a-request-flows-through-genkit)
for the complete server-side execution path from the HTTP endpoint to the configured Gemini model.

## Configuration

Copy `.env.example` to a local ignored `.env` file and provide server-side values:

```dotenv
AI_GENKIT_ENABLED=true
AI_GENKIT_DEFAULT_PROVIDER=google-ai
AI_GENKIT_TIMEOUT_MS=30000

AI_GENKIT_GOOGLE_AI_ENABLED=true
AI_GENKIT_GOOGLE_AI_MODEL=replace-with-a-supported-model
GEMINI_API_KEY=replace-with-server-side-api-key

# Present only when the removable summary example is installed.
AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE=false
```

Start the built SSR server with Node environment-file loading:

```bash
node --env-file=.env dist/angular-enterprise-starter/server/server.mjs
```

Never move `GEMINI_API_KEY` into Angular environment files, public runtime config, source code or browser storage.

### Runtime Config compatibility

`ai-genkit` and `runtime-config` have separate configuration boundaries and can be installed in
either order:

- `src/assets/config/values.yml` is public, browser-readable deployment configuration;
- `.env` or platform-provided process environment variables are private Node server configuration;
- `.env.example` documents server-side placeholders only and never contains real credentials.

Installing `ai-genkit` does not modify `values.yml`. Installing `runtime-config` does not modify the
AI environment placeholders, provider catalog or backend registration. Never copy provider keys or
other secrets into `values.yml`, including when that file is supplied through Docker, Kubernetes or
a CI/CD deployment pipeline.

## Authorization and cost control

The generated example is denied by default, even after enabling the AI foundation. For an explicit local manual test, set:

```dotenv
AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE=true
```

Never enable that flag in a shared or production environment. Real products must register their authentication, authorization, quota or rate-limit middleware through `requestGuard`:

```ts
app.use(
  '/api/ai',
  createAiSummaryRouter({
    requestGuard: authenticateAiRequest,
  }),
);
```

The guard runs before configuration loading and provider execution.
An application guard takes precedence over the local unauthenticated-example flag. Errors passed
by the guard through `next(error)` are forwarded to the application error pipeline rather than
being normalized as provider errors.

## Repeatable use

`ai-genkit` is repeatable by design.

The initial release supports these safe flows:

- install foundation only;
- install foundation and summary together;
- add the summary example after foundation-only installation;
- rerun against a complete installation without overwriting generated files.

Future releases can add provider adapters through the same evolution without replacing the foundation.
Each invocation installs one adapter. The CLI keeps the provider files, dependencies, environment
block and managed catalog registration separate from the provider-neutral core.

The current release is multi-provider-ready but includes only the Google Gemini adapter. Once
additional adapters are available, application flows can resolve either the configured default
provider or an enabled provider by ID. Provider routing remains a private server-side application
policy and is never selected by the Angular client. See
[Selecting a provider for an application flow](../evolutions/ai-genkit.md#selecting-a-provider-for-an-application-flow).

## Safety guards

The installer stops when it detects:

- a missing Node SSR backend;
- missing Express or Angular SSR dependencies;
- a partial AI core, provider adapter or summary example;
- an existing incompatible Genkit major version;
- Genkit incorrectly installed as a development dependency;
- a partial `.env.example` AI configuration;
- an existing `/api/ai` implementation;
- partial backend or Angular route registration;
- unsupported modifications to required route insertion points.

Existing core, provider and example files are never overwritten. The installer updates only the
explicitly marked sections of `installed-ai-providers.ts` when registering another adapter.

## Verification

After apply:

```bash
npm install
npm run format:check
npm run lint
npm test -- --watch=false
npm run build
```

Provider tests use mocks and do not make real Gemini calls.
