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
0.2.0-alpha.0
```

The package remains marked as private:

```json
{
  "private": true
}
```

This does not prevent the GitHub repository from becoming public.
It only prevents accidental publication to npm.

Current Git tag:

```text
v0.2.0-alpha.0
```

Current GitHub Release:

```text
v0.2.0-alpha.0 - Evolution branches and runtime configuration baseline
```

## Version strategy

The project follows semantic versioning with pre-release identifiers.

Recommended flow:

```text
0.1.0-alpha.0   -> first public alpha baseline
0.2.0-alpha.0   -> evolution branches and runtime configuration baseline
0.2.0-alpha.N   -> alpha iterations with possible breaking changes
0.2.0-beta.0    -> structure mostly stable, feedback phase
1.0.0           -> stable starter baseline
```

## Evolution branches

Evolution branches do not have independent semantic versions while the starter is in alpha.

The `main` branch owns the public version, Git tag and GitHub Release.
Each implemented evolution branch declares which `main` baseline it is compatible with.

Example:

```text
main                  -> v0.2.0-alpha.0
evo/i18n/transloco    -> compatible with v0.2.0-alpha.0
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
```

For future releases, create and push a new tag:

```bash
git tag v0.2.0-alpha.0
git push origin v0.2.0-alpha.0
```

Suggested GitHub release title:

```text
v0.2.0-alpha.0 - Evolution branches and runtime configuration baseline
```

## npm publication

This repository is currently intended as a GitHub starter/template, not as an npm package.

Keep `private: true` unless there is a clear decision to publish a package to npm.
(wip)
