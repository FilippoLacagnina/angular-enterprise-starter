# Docker SSR CLI Installer

<!-- evolution-guide-standard -->

## Purpose

The `docker-ssr` evolution adds a minimal multi-stage container baseline for the Angular Node SSR
runtime.

Reference branch:

```text
evo/deployment/docker-ssr
```

## When to use it

Use Docker SSR when the application should build and run its Angular browser and server bundles in
a Node container.

The evolution intentionally does not add Docker Compose, Kubernetes, Nginx, a registry workflow or
platform-specific deployment configuration.

## Prerequisites

Before applying:

- keep the npm `package-lock.json`;
- keep a non-empty `build` script in `package.json`;
- keep the `angular-enterprise-starter` server build in `angular.json`;
- keep `outputMode` set to `server`;
- keep the SSR entry at `src/server.ts`;
- confirm that ports and runtime environment delivery will be owned by the deployment platform.

## Generated changes

The evolution creates:

```text
Dockerfile
.dockerignore
```

The Dockerfile uses:

```text
dependencies -> npm ci
build        -> npm run build
runtime      -> Node SSR server
```

The runtime image starts:

```text
node dist/angular-enterprise-starter/server/server.mjs
```

No Angular source, route, layout or feature file is modified.

## Dependencies

Docker SSR adds no npm dependency.

The generated image uses the npm lockfile and Node 22 Alpine images for dependency, build and
runtime stages.

## Options

Docker SSR has no evolution-specific options. Image naming, registry, platform and orchestration
remain deployment concerns outside this baseline.

## Preview and apply

Preview:

```bash
npm run starter:evolution -- --name docker-ssr --preview
```

Apply:

```bash
npm run starter:evolution -- --name docker-ssr --apply
```

Versioned npm CLI:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution \
  --name docker-ssr \
  --preview
```

## Configuration

Build the image:

```bash
docker build -t angular-enterprise-starter:ssr .
```

Run it on the default port:

```bash
docker run --rm -p 4000:4000 angular-enterprise-starter:ssr
```

Override the Node server port:

```bash
docker run --rm \
  -p 8080:8080 \
  -e PORT=8080 \
  angular-enterprise-starter:ssr
```

The container serves generated `dist` output. It does not run `ng serve` and does not rebuild when
source files change.

## Safety and repeatability

Docker SSR is non-repeatable.

Preview and apply share the same preflight, which validates:

- `package-lock.json`;
- the package build script;
- Angular server build configuration;
- `src/server.ts`;
- both generated file targets.

All checks complete before either Docker file is created. Existing `Dockerfile` or `.dockerignore`
files are never overwritten, and a single conflict prevents both writes.

## Compatibility

### Runtime Config

The Angular build includes the public `assets/config/values.yml` file. Build-once deploy-many
requires the deployment platform to replace or mount that browser asset at runtime. The Docker
baseline does not prescribe a mounting strategy.

### AI Genkit

AI Genkit runs inside the same Node SSR process. Supply server-only environment variables when the
container starts:

```bash
docker run --rm \
  -p 4000:4000 \
  --env-file .env \
  angular-enterprise-starter:ssr
```

Never copy a real `.env` file into the image. Production deployments should use platform-managed
secrets.

### Design systems and i18n

Bootstrap, Tailwind and Transloco are compiled into the normal Angular build and require no
Dockerfile-specific changes.

## Verification

After apply:

```bash
npm run build
docker build -t angular-enterprise-starter:ssr .
docker run --rm -p 4000:4000 angular-enterprise-starter:ssr
```

Verify:

- browser navigation;
- direct SSR navigation to a feature route;
- static assets;
- API endpoints owned by the Node backend;
- graceful container shutdown.

## Removal and rollback

The CLI does not provide automatic uninstall.

Remove `Dockerfile` and `.dockerignore`, then remove `docker-ssr` from starter metadata. No
application source rollback is required because the evolution is additive.

## Troubleshooting

| Symptom                             | Likely cause                                      | Action                                               |
| ----------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `npm ci` fails                      | Lockfile and `package.json` are not synchronized. | Run `npm install`, review the lockfile and rebuild.  |
| Runtime server file is missing      | Angular did not produce a server build.           | Verify `outputMode`, SSR entry and the build result. |
| Container starts but is unreachable | Port mapping differs from `PORT`.                 | Align `PORT`, exposed port and host mapping.         |
| Runtime configuration is stale      | The image still contains the build-time asset.    | Mount or replace the public runtime-config asset.    |
| AI reports missing credentials      | Server variables were not injected.               | Configure container environment or platform secrets. |

## Architecture reference

See [Docker SSR Evolution](../evolutions/docker-ssr.md) for container stages, runtime behavior,
environment conventions and reference-branch merge notes.
