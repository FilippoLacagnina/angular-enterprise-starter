# Versioning

## Index

- [Current status](#current-status)
- [Version strategy](#version-strategy)
- [Pre-release phases](#pre-release-phases)
- [GitHub releases](#github-releases)
- [npm publication](#npm-publication)

## Current status

The project is currently in alpha pre-release.

Current package version:

```text
0.1.0-alpha.0
```

The package remains marked as private:

```json
"private": true
```

This does not prevent the GitHub repository from becoming public.
It only prevents accidental publication to npm.

## Version strategy

The project follows semantic versioning with pre-release identifiers.

Recommended flow:

```text
0.1.0-alpha.0   -> first public alpha baseline
0.1.0-alpha.N   -> alpha iterations with possible breaking changes
0.1.0-beta.0    -> structure mostly stable, feedback phase
1.0.0           -> stable starter baseline
```

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

Example:

```bash
git tag v0.1.0-alpha.0
git push origin v0.1.0-alpha.0
```

Suggested GitHub release title:

```text
v0.1.0-alpha.0 - First public alpha
```

## npm publication

This repository is currently intended as a GitHub starter/template, not as an npm package.

Keep `private: true` unless there is a clear decision to publish a package to npm.
(wip)
