# AI Genkit CLI Installer

<!-- evolution-guide-standard -->

## Purpose

The `ai-genkit` evolution adds an optional server-side Genkit foundation to Angular Enterprise
Starter.

It currently installs a Google AI adapter for Gemini while keeping the provider-neutral core ready
for additional adapters. Angular never receives provider credentials and never calls a provider
directly.

Foundation-only installation is the default. The summary API and Angular test feature are generated
only when explicitly selected.

Reference branch:

```text
evo/ai/genkit
```

## When to use it

Use this evolution when the application needs:

- server-side generative AI orchestration;
- typed and validated Genkit flows;
- provider credentials isolated from browser configuration;
- a provider registry that can support different server flows through different adapters;
- standard and streaming API examples that can be removed after evaluation.

Do not select it only to expose a provider SDK from Angular. The generated architecture requires
the Node SSR backend and intentionally keeps all provider execution on the server.

The initial release does not include RAG, MCP, tool calling, agents, image generation, conversation
persistence or a concrete second provider.

## Prerequisites

Before applying:

- start from a compatible Angular Enterprise Starter workspace;
- keep the Express and Angular SSR backend in `src/server.ts`;
- use a supported Node version for the starter;
- verify that the selected Gemini model is available to the target Google AI account;
- decide whether the removable summary example is required;
- plan an application authentication and authorization guard before exposing AI routes.

The installer never requests or writes a real API key.

## Generated changes

Foundation-only installation generates:

```text
src/server/ai/
  ai.runtime.ts
  config/
  logging/
  providers/
```

It also:

- registers the Google AI adapter in the managed provider catalog;
- merges server-only placeholders into `.env.example`;
- adds `.env` ignore rules;
- records the evolution in starter metadata;
- leaves `src/server.ts`, Angular routes and application UI unchanged.

With `--ai-example summary`, the installer additionally generates:

```text
src/server/ai/examples/summary/
src/server/ai/http/
src/contracts/ai/
src/app/features/ai-summary/
```

and registers:

```text
POST /api/ai/summarize
POST /api/ai/summarize/stream
GET  /ai-summary
```

The example contains typed validation, normalized errors, request correlation, timeouts,
cancellation, NDJSON streaming and a minimal Angular page for testing both APIs.

## Dependencies

The current Google AI installation requires runtime dependencies:

| Package                   | Supported range |
| ------------------------- | --------------- |
| `genkit`                  | `^1.40.0`       |
| `@genkit-ai/google-genai` | `^1.40.0`       |

The installer preserves compatible existing declarations and blocks invalid ranges, incompatible
ranges or packages declared in `devDependencies`.

## Options

| Option          | Default            | Description                                                                |
| --------------- | ------------------ | -------------------------------------------------------------------------- |
| `--ai-provider` | `google-ai`        | Provider adapter to install.                                               |
| `--ai-example`  | `none`             | Generates only the foundation or also the removable `summary` example.     |
| `--ai-model`    | `gemini-3.5-flash` | Model identifier written to `.env.example`; availability must be verified. |

API keys are not CLI options because command arguments can be retained in shell history and process
metadata.

## Preview and apply

Preview the foundation:

```bash
npm run starter:evolution -- \
  --name ai-genkit \
  --preview \
  --ai-example none
```

Preview the complete example:

```bash
npm run starter:evolution -- \
  --name ai-genkit \
  --preview \
  --ai-provider google-ai \
  --ai-example summary \
  --ai-model gemini-3.5-flash
```

Apply only after reviewing dependencies, generated targets and blocking notes:

```bash
npm run starter:evolution -- \
  --name ai-genkit \
  --apply \
  --ai-provider google-ai \
  --ai-example summary \
  --ai-model gemini-3.5-flash
```

The same options work with the versioned npm CLI described in
[Evolution CLI usage channels](../schematics.md#usage-channels).

## Configuration

`.env.example` contains placeholders only. For local testing, create an ignored `.env` file:

```dotenv
AI_GENKIT_ENABLED=true
AI_GENKIT_DEFAULT_PROVIDER=google-ai
AI_GENKIT_TIMEOUT_MS=30000

AI_GENKIT_GOOGLE_AI_ENABLED=true
AI_GENKIT_GOOGLE_AI_MODEL=replace-with-a-supported-model
GEMINI_API_KEY=replace-with-server-side-api-key

# Generated only with the removable summary example.
AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE=false
```

Production deployments should provide the same values through platform-managed environment
variables or a secret manager. A physical `.env` file is only one local loading mechanism and is
not required in production.

Build and start the Node SSR process:

```bash
npm run build
node --env-file=.env dist/angular-enterprise-starter/server/server.mjs
```

`npm run build` creates the server bundle but does not start the backend. The `/api/ai` endpoints
exist only while the generated Node process is running.

Never place `GEMINI_API_KEY` in Angular environment files, `values.yml`, source code, browser
storage or any public Runtime Config value.

## Request flow

The summary example uses real Genkit flows:

```text
Angular client
  -> /api/ai
    -> Express request guard and validation
      -> summary flow
        -> provider registry
          -> Google Gemini adapter
            -> Genkit Google AI plugin
              -> Gemini model
```

The standard endpoint returns one validated response. The streaming endpoint uses Genkit streaming
and forwards validated NDJSON frames while generation is active.

For the complete internal execution path, see
[How a request flows through Genkit](../evolutions/ai-genkit.md#how-a-request-flows-through-genkit).

## Safety and repeatability

The evolution validates the complete installation plan before changing dependencies or creating
files.

It blocks:

- a missing or unsupported Node SSR backend;
- partial AI core, provider or example files;
- incompatible dependency declarations;
- missing packaged installer assets;
- partial `.env.example` configuration;
- an existing `/api/ai` implementation;
- partial or unsupported backend and Angular route wiring;
- an inconsistent managed provider catalog.

The evolution is repeatable for supported additive flows:

- install foundation only;
- install foundation and summary together;
- add the summary example after installing the foundation;
- rerun a complete installation without overwriting generated files;
- add future provider adapters without replacing the provider-neutral core.

The generated example denies requests by default. For an explicit local test only:

```dotenv
AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE=true
```

Shared and production environments must supply an application request guard:

```ts
app.use(
  '/api/ai',
  createAiSummaryRouter({
    requestGuard: authenticateAiRequest,
  }),
);
```

Authentication, authorization, quota and cost-control policy remain application responsibilities.

## Compatibility

### Runtime Config

AI Genkit and Runtime Config can be installed in either order because they own different
configuration boundaries:

| Configuration source           | Visibility      | Intended values                         |
| ------------------------------ | --------------- | --------------------------------------- |
| `src/assets/config/values.yml` | Public/browser  | Deployable application configuration.   |
| Node process environment       | Private/server  | Provider keys, model and AI enablement. |
| `.env.example`                 | Repository-safe | Server-side placeholders only.          |

Neither installer copies AI configuration into `values.yml`.

### Docker SSR

The Docker image starts the Node SSR bundle, but secrets still need to be supplied at container
runtime:

```bash
docker run --rm \
  -p 4000:4000 \
  --env-file .env \
  angular-enterprise-starter:ssr
```

Do not copy a real `.env` file into the image.

### Multiple providers

The current release installs only Google AI. The generated registry can later resolve either the
configured default provider or an enabled provider by ID. Provider selection must remain a
server-owned policy and must not be accepted directly from an untrusted client.

## Verification

After apply:

```bash
npm install
npm run format:check
npm run lint
npm test -- --watch=false
npm run build
```

For a manual provider test, start the SSR server with valid server environment variables and call
the standard and streaming endpoints. Automated tests mock Genkit and never make real provider
calls.

## Removal and rollback

The CLI does not provide an automatic uninstall command.

The summary example is intentionally removable without deleting the foundation. Follow
[Removing the example](../evolutions/ai-genkit.md#removing-the-example) to remove its Angular
feature, routes, contracts and server flows.

Removing the foundation also requires removing provider registration, environment placeholders,
runtime dependencies and starter metadata. Perform that change manually in a dedicated branch and
verify that no product flow imports the provider registry first.

## Troubleshooting

| Symptom                       | Likely cause                                       | Action                                                           |
| ----------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| `AI_DISABLED`                 | `AI_GENKIT_ENABLED` is not `true`.                 | Enable AI in the Node process environment.                       |
| `AI_CONFIGURATION_ERROR`      | Example access is denied or configuration invalid. | Add a request guard or explicitly enable the local example.      |
| Provider `404`                | The selected model is unavailable to the account.  | Update `AI_GENKIT_GOOGLE_AI_MODEL` to an available model.        |
| Provider `429` or `503`       | Quota or temporary provider demand.                | Retry according to the typed retryable response and your policy. |
| API route not reachable       | Only the Angular build was executed.               | Start the generated Node SSR server.                             |
| Preview reports partial state | Some generated files or wiring already exist.      | Reconcile or remove the partial state before apply.              |

Provider error bodies, prompts, user content, credentials and model responses are intentionally
excluded from application logs.

## Architecture reference

See [AI Genkit Evolution](../evolutions/ai-genkit.md) for:

- provider-neutral runtime design;
- flow and streaming internals;
- multi-provider selection;
- logging and security boundaries;
- model lifecycle;
- manual example removal.
