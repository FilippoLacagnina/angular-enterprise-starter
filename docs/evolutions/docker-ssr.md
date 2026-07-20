# Docker SSR Evolution

## Index

- [Goal](#goal)
- [Current setup](#current-setup)
- [Build image](#build-image)
- [Run container](#run-container)
- [Runtime model](#runtime-model)
- [Environment variables](#environment-variables)
- [Guidelines](#guidelines)
- [Merge notes](#merge-notes)

## Goal

This evolution adds a minimal Docker baseline for the Angular SSR runtime.

The goal is to containerize the existing Angular Node server without changing application code or introducing a deployment platform opinion.

This document owns container architecture and reference-branch decisions. For preview, apply,
preflight behavior, compatibility and troubleshooting, see the
[Docker SSR CLI Installer](../evolution-cli/docker-ssr.md).

## Current setup

This evolution adds:

```text
Dockerfile
.dockerignore
docs/evolutions/docker-ssr.md
```

The Dockerfile uses a multi-stage build:

```text
dependencies -> install npm dependencies
build        -> generate Angular browser and server bundles
runtime      -> run the generated Node SSR server
```

The final container runs:

```bash
node dist/angular-enterprise-starter/server/server.mjs
```

## Build image

Build the Docker image from the repository root:

```bash
docker build -t angular-enterprise-starter:ssr .
```

## Run container

Run the SSR container locally:

```bash
docker run --rm -p 4000:4000 angular-enterprise-starter:ssr
```

Open:

```text
http://localhost:4000
```

## Runtime model

`ng serve` is only for local development.

The Docker container follows the production SSR flow:

```text
npm run build
node dist/angular-enterprise-starter/server/server.mjs
```

This means the container serves the generated `dist` output, not live source files.

If styles or templates look outdated while testing SSR locally, rebuild first:

```bash
npm run build
npm run serve:ssr
```

## Environment variables

The SSR server reads the `PORT` environment variable and defaults to `4000`.

Example:

```bash
docker run --rm -p 8080:8080 -e PORT=8080 angular-enterprise-starter:ssr
```

Application environment files are still selected at build time by Angular configurations.
Runtime configuration through deployable files should be handled by a dedicated runtime-config evolution.

## Guidelines

- Keep this branch focused on Docker SSR only.
- Do not add Docker Compose in this branch.
- Do not add Nginx static hosting in this branch.
- Do not change application layout, routing or business features.
- Use a dedicated evolution for Docker Compose or static hosting if needed later.

## Merge notes

This evolution is intentionally small and additive-first.

Expected merge points:

- `Dockerfile`
- `.dockerignore`
- `docs/evolutions/docker-ssr.md`
- `README.md`
- `docs/evolutions.md`

No application source files are changed by this branch.
