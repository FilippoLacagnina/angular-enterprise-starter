# Docker SSR CLI Installer

## Index

- [Purpose](#purpose)
- [Generated output](#generated-output)
- [Preview and apply](#preview-and-apply)
- [Runtime model](#runtime-model)
- [Safety rules](#safety-rules)

## Purpose

The Docker SSR installer adds a minimal Docker baseline for the Angular SSR runtime through the Evolution CLI.

The related reference branch is:

```text
evo/deployment/docker-ssr
```

## Generated output

The installer creates:

```text
Dockerfile
.dockerignore
```

The Dockerfile follows a multi-stage flow:

```text
dependencies -> install npm dependencies
build        -> generate Angular browser and server bundles
runtime      -> run the generated Node SSR server
```

## Preview and apply

Preview:

```bash
npm run starter:evolution -- --name docker-ssr --preview
```

Apply:

```bash
npm run starter:evolution -- --name docker-ssr --apply
```

## Runtime model

The generated container follows the production SSR flow:

```text
npm run build
node dist/angular-enterprise-starter/server/server.mjs
```

This means the container serves generated `dist` output, not live source files.

Build image:

```bash
docker build -t angular-enterprise-starter:ssr .
```

Run container:

```bash
docker run --rm -p 4000:4000 angular-enterprise-starter:ssr
```

## Safety rules

The installer is intentionally small and non-repeatable.

It stops before overwriting existing Docker files and points users to the reference branch for manual inspection if needed.
