# AI Genkit Evolution

## Goal

The `evo/ai/genkit` branch provides an optional enterprise-oriented foundation for server-side generative AI in Angular Enterprise Starter.

It uses Genkit as the orchestration layer and initially integrates Google Gemini through `@genkit-ai/google-genai`. Angular never receives provider credentials and never invokes Gemini directly.

## Scope

The first version includes:

- server-only Genkit initialization;
- central environment validation;
- a provider registry designed for multiple installed adapters;
- a Google AI provider definition and Gemini adapter;
- structured output and text-streaming capabilities;
- normalized provider errors, including explicit `429` handling;
- safe structured request logging;
- timeout and abort propagation;
- a removable summary example with standard and streaming APIs;
- typed Angular clients and a minimal test page;
- unit and HTTP integration tests without real provider calls.

It intentionally excludes RAG, MCP, tool calling, agents, image/video generation, conversation persistence and concrete support for additional providers.

## Architecture

```text
Angular feature
  -> /api/ai summary endpoints
    -> summary flow module
      -> provider capability requested from registry
        -> Google Gemini adapter
          -> Genkit Google AI plugin
```

The foundation is independent from the example:

```text
src/server/ai/
  ai.runtime.ts              # provider-neutral Genkit runtime
  config/                    # server environment validation
  logging/                   # Genkit-safe logging defaults
  providers/                 # definitions, capabilities and adapters

src/server/ai/examples/
  summary/                   # removable flow and router composition
```

`createAiRuntime()` creates only Genkit and the provider registry. It does not register product-specific flows. Each feature requests only the capability it uses.

## How a request flows through Genkit

The summary example executes real Genkit flows. The HTTP endpoints do not call Gemini directly and
the provider adapter does not contain product-specific flow logic.

For a standard summary request, the execution path is:

```text
HTTP client
  -> POST /api/ai/summarize
    -> Express summary router
      -> access guard, request ID and JSON body parsing
        -> load and validate the server AI configuration
        -> lazily createAiSummaryRuntime()
          -> createAiRuntime()
            -> initialize Genkit with installed provider plugins
            -> create the provider registry
          -> request the structuredOutput capability
          -> define summarizeFlow with Genkit
        -> validate the request input
        -> execute summarizeFlow with timeout and abort propagation
          -> validate the flow input schema
          -> build the summary prompt
          -> Google Gemini provider adapter
            -> ai.generate()
              -> Genkit Google AI plugin
                -> Gemini model
          -> validate the structured output schema
        -> return the typed HTTP response
```

The main responsibilities remain separated:

1. `summary.routes.ts` owns the HTTP lifecycle, access control and safe error response;
2. `summary.runtime.ts` composes the provider-neutral runtime with the example flows;
3. `ai.runtime.ts` initializes Genkit and the provider registry;
4. `summary.flow.ts` defines the typed Genkit flow and its business operation;
5. `summary.prompt.ts` owns the example prompt;
6. `google-gemini.provider.ts` translates provider-neutral generation requests into Genkit calls;
7. the Google AI Genkit plugin sends the request to the configured Gemini model.

The streaming endpoint follows the same path until flow execution. The difference is that
`summarizeStreamFlow` uses `ai.generateStream()`: text chunks are validated and forwarded as NDJSON
frames while the request is active, then the final response is validated and emitted as a
`complete` frame. Timeout, cancellation or provider failure abort the same server-side execution
chain and produce a normalized response or terminal stream frame.

Removing the summary example removes its routes, prompt and flows. The Genkit runtime, provider
registry, installed adapters and secure configuration remain available for application-specific
flows.

## Multi-provider-ready model

Installed provider definitions are listed in:

```text
src/server/ai/providers/installed-ai-providers.ts
```

The catalog contains installer-managed import and entry sections. Future Evolution CLI releases
can add an adapter to those sections without replacing the core or modifying existing provider
implementations. Core files, provider files and examples are validated as independent install sets.

Each definition owns:

- provider-specific environment parsing;
- credential capture;
- Genkit plugin creation;
- adapter creation;
- provider and model identity.

Credentials are captured inside server-side factory closures and are not stored in serializable runtime configuration.

Providers may implement only the capabilities they support. The registry verifies both the declared capability and the corresponding implementation before returning a provider.

### Selecting a provider for an application flow

The registry supports both default and explicit provider selection:

```ts
const defaultProvider = runtime.providers.getDefault('structuredOutput');
const selectedProvider = runtime.providers.get('provider-id', 'structuredOutput');
```

`getDefault()` resolves `AI_GENKIT_DEFAULT_PROVIDER`. `get()` resolves an enabled provider by its
server-side identifier. Both methods verify that the provider implements the capability required by
the flow, such as `structuredOutput` or `textStreaming`.

This allows an application to bind different flows, and therefore different backend APIs, to
different providers:

```text
/api/ai/summarize       -> provider A -> structuredOutput
/api/ai/classify        -> provider B -> structuredOutput
/api/ai/support/stream  -> provider C -> textStreaming
```

Provider selection should be an application-owned server policy. A project can use environment
variables or another private server configuration source to map use cases to installed provider
identifiers. Provider identifiers must not be accepted directly from an untrusted HTTP client,
because that would expose decisions about credentials, cost, data processing and availability.

The removable summary example uses `getDefault()` for both its standard and streaming flows. It
demonstrates the default-provider path and does not expose provider selection through its HTTP API.
Applications that need provider-specific APIs can compose their own flows with `get()`.

The initial release remains intentionally limited:

- Google Gemini is the only concrete provider adapter;
- no automatic fallback, load balancing or cross-provider retry is included;
- no client-controlled or per-request provider selection is included;
- no generic use-case-to-provider environment convention is imposed on product applications.

Additional provider adapters must be installed, enabled and registered before explicit selection can
be used. When concrete multi-provider routing is introduced, request logging must record the
provider and model selected for each operation rather than assuming the configured default.

## Configuration

Generic variables:

| Variable                     | Purpose                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `AI_GENKIT_ENABLED`          | Enables the optional AI foundation. Defaults to `false`. |
| `AI_GENKIT_DEFAULT_PROVIDER` | Selects the installed default provider.                  |
| `AI_GENKIT_TIMEOUT_MS`       | Server request deadline between 1,000 and 120,000 ms.    |

Google AI variables:

| Variable                      | Purpose                                                |
| ----------------------------- | ------------------------------------------------------ |
| `AI_GENKIT_GOOGLE_AI_ENABLED` | Enables the Google AI adapter.                         |
| `AI_GENKIT_GOOGLE_AI_MODEL`   | Required model identifier when the adapter is enabled. |
| `GEMINI_API_KEY`              | Server-side Gemini API key.                            |

Summary example variable:

| Variable                                  | Purpose                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE` | Allows explicit local demo access. Defaults to and should remain `false` outside local testing. |

There is intentionally no permanent model fallback in application code. Model availability changes independently from starter releases, so deployments must select and validate an available model explicitly.

## Security model

- AI is disabled by default.
- the generated summary route is denied until an application guard is supplied or local demo access is explicitly enabled;
- Provider keys stay in server environment variables.
- `.env` files are ignored while `.env.example` contains placeholders only.
- Angular environment and public Runtime Config are not used for secrets.
- provider errors are normalized before reaching clients;
- request logs contain request ID, provider, model, duration, HTTP status and result status;
- prompts, user content, provider response bodies and credentials are not logged;
- Genkit internal logging is disabled by default because upstream errors can contain sensitive payloads.

The Runtime Config evolution and AI Genkit can be installed in either order. Their responsibilities
remain intentionally separate: `src/assets/config/values.yml` is public browser configuration,
while AI credentials and provider settings are injected into the Node process. Neither installer
rewrites the other evolution's configuration. Provider keys must never be added to `values.yml`.

The example router exposes a `requestGuard` integration point. Real products must connect their own authentication, authorization and cost-control policy before enabling the endpoint publicly. The `AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE=true` escape hatch is intended only for deliberate local testing.

## Standard API

```http
POST /api/ai/summarize
Content-Type: application/json

{
  "text": "Text to summarize"
}
```

Successful response:

```json
{
  "summary": "Validated summary"
}
```

## Streaming API

```http
POST /api/ai/summarize/stream
Content-Type: application/json
```

The response uses newline-delimited JSON:

```json
{"type":"chunk","delta":"Progressive "}
{"type":"chunk","delta":"summary"}
{"type":"complete","output":{"summary":"Validated summary"},"requestId":"request-id"}
```

If an error occurs after headers have been sent, the stream ends with a typed `error` frame. The final complete event always contains schema-validated output.

## Removing the example

The Evolution CLI can avoid generating it with:

```bash
--ai-example none
```

To remove an existing example manually:

1. delete `src/app/features/ai-summary/`;
2. delete `src/server/ai/examples/summary/`;
3. delete `src/server/ai/http/`;
4. delete `src/server/ai/logging/ai-request.logger*`;
5. delete `src/contracts/ai/`;
6. remove the `/api/ai` import and registration from `src/server.ts`;
7. remove the `ai-summary` entry from `src/app/app.routes.ts`.
8. remove `AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE` from server environment templates and deployment configuration.

The provider-neutral runtime, configuration, Genkit logging and provider catalog remain available for product flows.

## Model lifecycle

Model names and availability are provider concerns, not stable starter APIs. A model can be unavailable to new users, temporarily overloaded or removed.

Treat the model variable as deployment configuration, verify it for each environment and update it independently from Angular builds.

## Quality checks

```bash
npm run lint
npm test -- --watch=false
npm run build
npm run schematics:test
```

The test suite mocks Genkit and provider behavior. Only explicit manual verification should use a real API key.
