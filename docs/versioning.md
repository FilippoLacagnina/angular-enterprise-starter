# Versioning

## Index

- [Current status](#current-status)
- [Version strategy](#version-strategy)
- [Evolution branches](#evolution-branches)
- [Pre-release phases](#pre-release-phases)
- [GitHub releases](#github-releases)
- [npm publication](#npm-publication)

## Current status

The project is currently in alpha pre-release.

Current package version:

```text
0.10.0-alpha.0
```

The package remains marked as private:

```json
{
  "private": true
}
```

This does not prevent the GitHub repository from becoming public.
It only prevents accidental publication of the Angular starter application itself to npm.

The Evolution CLI is packaged separately under:

```text
@filippolacagnina/angular-enterprise-starter
```

That package can be published to npm while the root starter application remains private.

Current Git tag:

```text
v0.10.0-alpha.0
```

Current GitHub Release:

```text
v0.10.0-alpha.0 - Configurable Layout Shell and responsive navigation
```

## Version strategy

The project follows semantic versioning with pre-release identifiers.

Recommended flow:

```text
0.1.0-alpha.0   -> first public alpha baseline
0.2.0-alpha.0   -> evolution branches and runtime configuration baseline
0.3.0-alpha.0   -> centralized documentation and Evolution CLI preview
0.4.0-alpha.0   -> versioned Evolution CLI npm package
0.5.0-alpha.0   -> Transloco and Tailwind Evolution CLI installers
0.5.1-alpha.0   -> Render-safe Evolution CLI schematic execution
0.6.0-alpha.0   -> Runtime Config Evolution CLI installer
0.7.0-alpha.0   -> AI Genkit Evolution CLI installer
0.8.0-alpha.0   -> Evolution CLI hardening and configurable Transloco
0.9.0-alpha.0   -> Builder-ready design-system contracts and component hardening
0.10.0-alpha.0  -> Configurable Layout Shell and responsive navigation
0.10.x-alpha.N  -> CLI and documentation iterations with possible breaking changes
0.10.x-beta.0   -> structure mostly stable, feedback phase
1.0.0           -> stable starter baseline
```

## Evolution branches

Evolution branches do not have independent semantic versions while the starter is in alpha.

The `main` branch owns the public version, Git tag and GitHub Release.
Each implemented evolution branch declares which `main` baseline it is compatible with.

Example:

```text
main                  -> v0.10.0-alpha.0
evo/i18n/transloco    -> compatible with v0.5.0-alpha.0+
```

This avoids maintaining separate release lifecycles for optional variants before the starter baseline is stable.

## Pre-release phases

Use alpha versions while architecture, scripts and examples can still change frequently.

Use beta versions when:

- folder structure is considered stable
- documentation is complete enough for external usage
- cleanup flow is stable
- CI and repository protection rules are active

Use `1.0.0` when the starter can be safely reused as a stable public baseline.

## GitHub releases

Create Git tags only for meaningful public milestones.

Published alpha releases:

```text
v0.1.0-alpha.0 - First public alpha
v0.2.0-alpha.0 - Evolution branches and runtime configuration baseline
v0.3.0-alpha.0 - Centralized documentation and Evolution CLI preview
v0.4.0-alpha.0 - Versioned Evolution CLI npm package
v0.5.0-alpha.0 - Transloco and Tailwind Evolution CLI installers
v0.5.1-alpha.0 - Render-safe Evolution CLI schematic execution
v0.6.0-alpha.0 - Runtime Config Evolution CLI installer
v0.7.0-alpha.0 - AI Genkit Evolution CLI installer
v0.8.0-alpha.0 - Evolution CLI hardening and configurable Transloco
v0.9.0-alpha.0 - Builder-ready design-system contracts and component hardening
v0.10.0-alpha.0 - Configurable Layout Shell and responsive navigation
```

For future releases, create and push a new tag:

```bash
git tag v0.10.0-alpha.0
git push origin v0.10.0-alpha.0
```

Suggested GitHub release title:

```text
v0.10.0-alpha.0 - Configurable Layout Shell and responsive navigation
```

## npm publication

The root Angular application remains a GitHub starter/template and should stay marked as private.

The versioned npm surface is the Evolution CLI package assembled from:

```text
tools/evolution-cli-package/
```

Build and pack it locally before publication:

```bash
npm run evolution-cli:pack
```

Publish alpha versions with the `alpha` dist-tag:

```bash
npm publish ./dist/evolution-cli-package --access public --tag alpha
```

After verification, assign the same published version to `latest`:

```bash
npm dist-tag add @filippolacagnina/angular-enterprise-starter@<version> latest
```

The generated tarball is created under:

```text
dist/filippolacagnina-angular-enterprise-starter-<version>.tgz
```

Before publishing a new CLI package version:

- run schematic tests;
- run a package smoke test through the generated tarball;
- test at least one preview flow;
- test at least one apply flow in a temporary consumer workspace;
- run `npm install`, `npm run format:check`, `npm run lint` and `npm run build` in that consumer workspace.

The public consumer command is:

```bash
npx @filippolacagnina/angular-enterprise-starter evolution
```

The project intentionally exposes the verified public alpha through both `latest` and `alpha`.
Use the untagged command for the default supported release and `@alpha` when a workflow should explicitly track the alpha line.
