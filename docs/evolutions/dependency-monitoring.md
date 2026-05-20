# Dependency Monitoring

## Index

- [Goal](#goal)
- [Command](#command)
- [Branch coverage](#branch-coverage)
- [Report scope](#report-scope)
- [Report fields](#report-fields)
- [Angular-aware classification](#angular-aware-classification)
- [Options](#options)
- [Recommended workflow](#recommended-workflow)
- [Limitations](#limitations)
- [Future improvements](#future-improvements)

## Goal

Angular Enterprise Starter includes a read-only dependency monitoring tool.

The tool helps maintain the starter and its optional evolution branches by checking whether npm packages have newer `latest` versions available.

It is intentionally conservative:

- it does not update `package.json`
- it does not update `package-lock.json`
- it does not create commits
- it does not open pull requests
- it only prints a report

This keeps dependency decisions explicit, reviewable and aligned with the starter release strategy.

## Command

Run the dependency report with:

```bash
npm run deps:check
```

The script reads `package.json` from Git refs and does not need to switch branches.

## Branch coverage

By default, the report checks:

- `main`
- local `evo/*` branches
- `origin/evo/*` branches when available locally

This allows the starter maintainer to monitor dependencies introduced by optional evolution branches such as i18n, design systems, runtime configuration and deployment variants.

The tool reads Git refs available in the local repository.
It does not call GitHub to discover branches.

Before running the report, refresh local remote refs when needed:

```bash
git fetch --all --prune
npm run deps:check
```

## Report scope

For every supported branch, the tool checks these dependency sections:

- `dependencies`
- `devDependencies`
- `peerDependencies`
- `optionalDependencies`

For each package, it compares the current version specifier with the npm `latest` dist-tag.
It also adds an Angular-aware classification to separate straightforward candidates from compatibility-bound updates.

Example output:

```text
Angular Enterprise Starter dependency report

Branch: main
  @angular/core                    21.2.0       -> 21.2.4       patch    safe candidate
  typescript                       5.9.2        -> 6.0.3        major    angular-bound
  eslint                           9.39.4       -> 10.4.0       major    needs migration

Branch: evo/i18n/transloco
  @jsverse/transloco               8.1.0        -> 8.2.0        minor    needs review

Summary by branch
Branch                                        Checked Outdated Up to date Skipped Safe cand. Needs review Needs migration Angular-bound
main                                               26       22          4       0         10            3               6             3
evo/i18n/transloco                                 30       24          6       0         10            4               7             3

Global summary
Branches checked: 2
Dependencies checked: 40
Outdated dependencies: 3
Up-to-date dependencies: 37
Skipped dependencies: 0
Safe candidates: 20
Needs review: 7
Needs migration: 13
Angular-bound: 6
```

## Report fields

The report is split into detailed branch sections, a `Summary by branch` table and a `Global summary`.

Branch detail sections list outdated dependencies for each branch.

Example:

```text
Branch: main
  @angular/core                    21.2.0       -> 21.2.4       patch    safe candidate
```

This means:

- `@angular/core`: package name.
- `21.2.0`: version currently declared by the branch `package.json`.
- `21.2.4`: latest version available from the npm `latest` dist-tag.
- `patch`: update type detected by comparing semantic version parts.
- `safe candidate`: Angular-aware classification.

The `Summary by branch` table explains the dependency status for every checked branch.

| Column            | Meaning                                                      |
| ----------------- | ------------------------------------------------------------ |
| `Branch`          | Git branch whose `package.json` was checked.                 |
| `Checked`         | Total dependencies read from that branch.                    |
| `Outdated`        | Dependencies with a newer npm `latest` version available.    |
| `Up to date`      | Dependencies already aligned with the npm `latest` version.  |
| `Skipped`         | Dependencies that could not be checked against npm.          |
| `Safe cand.`      | Outdated dependencies classified as safe candidates.         |
| `Needs review`    | Outdated dependencies that require manual review.            |
| `Needs migration` | Outdated dependencies that require an explicit migration.    |
| `Angular-bound`   | Outdated dependencies bound to Angular compatibility ranges. |

The `Global summary` aggregates the same information across all checked branches.

| Field                     | Meaning                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `Branches checked`        | Number of branches included in the report.                  |
| `Dependencies checked`    | Total dependency checks across all branches.                |
| `Outdated dependencies`   | Total dependencies with a newer npm version available.      |
| `Up-to-date dependencies` | Total dependencies already aligned with npm `latest`.       |
| `Skipped dependencies`    | Total dependencies that could not be checked against npm.   |
| `Safe candidates`         | Total outdated dependencies classified as safe candidates.  |
| `Needs review`            | Total outdated dependencies requiring manual review.        |
| `Needs migration`         | Total outdated dependencies requiring migration work.       |
| `Angular-bound`           | Total outdated dependencies bound to Angular compatibility. |

The same package can be counted more than once when it exists in multiple branches.
This is intentional because every branch can declare a different dependency version.

Example:

```text
@angular/core in main
@angular/core in evo/i18n/transloco
@angular/core in evo/design-system/bootstrap
```

These are three independent dependency checks.

Skipped dependencies usually mean that:

- npm registry was not reachable
- the package could not be found on npm
- the dependency uses an unsupported version specifier such as a local file or Git URL

## Angular-aware classification

The report is intentionally Angular-aware because npm `latest` is not enough to decide whether an update is appropriate for an Angular baseline.

Classifications:

| Classification        | Meaning                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `safe-candidate`      | Update appears compatible with the current Angular major line. Still run quality checks. |
| `review-required`     | Patch/minor update outside the Angular core set. Review changelog before updating.       |
| `migration-required`  | Major update or Angular-related migration. Treat it as a dedicated maintenance task.     |
| `compatibility-bound` | Package should follow Angular compatibility ranges instead of npm `latest` blindly.      |

Operational handling:

| Classification    | How to treat it                                           |
| ----------------- | --------------------------------------------------------- |
| `Safe cand.`      | Update through the normal maintenance flow.               |
| `Needs review`    | Read changelog and release notes before updating.         |
| `Needs migration` | Treat as a dedicated task with possible breaking changes. |
| `Angular-bound`   | Verify Angular compatibility before updating.             |

Current classification rules:

- `@angular/*` packages within the same Angular major are `safe-candidate`.
- `@angular/*` packages across major versions are `migration-required`.
- `angular-eslint` and `@angular-eslint/*` should stay aligned with the Angular baseline.
- `typescript`, `rxjs` and `zone.js` are `compatibility-bound`.
- generic major updates are `migration-required`.
- generic patch/minor updates are `review-required`.

Important: `safe-candidate` does not mean auto-merge.
It means the update is a good candidate for a normal maintenance PR after running lint, tests and build.

## Options

Show all dependencies, including packages already up to date:

```bash
npm run deps:check -- --all
```

Generate JSON output:

```bash
npm run deps:check -- --json
```

Check one branch:

```bash
npm run deps:check -- --branch main
```

If argument forwarding behaves differently on a specific shell, use the direct Node command:

```bash
node tools/dependency-update-report.mjs --branch main
```

Check a specific evolution branch:

```bash
npm run deps:check -- --branch evo/i18n/transloco
```

Direct Node alternative:

```bash
node tools/dependency-update-report.mjs --branch evo/i18n/transloco
```

Check multiple branches:

```bash
npm run deps:check -- --branch main --branch evo/design-system/primeng
```

Direct Node alternative:

```bash
node tools/dependency-update-report.mjs --branch main --branch evo/design-system/primeng
```

## Recommended workflow

Use the report before planned maintenance releases.

Suggested flow:

1. Run `npm run deps:check`.
2. Review the `Summary by branch`.
3. Start from `safe-candidate` updates.
4. Review `review-required` updates with changelog and project checks.
5. Treat `migration-required` updates as dedicated maintenance tasks.
6. Validate `compatibility-bound` updates against the Angular compatibility matrix.
7. Update one branch at a time.
8. Run quality checks before merging.
9. Document dependency strategy changes in the release notes when relevant.

## Limitations

The report compares against the npm `latest` dist-tag only.

It does not currently:

- fetch or enforce the official Angular compatibility matrix
- inspect peer dependency compatibility deeply
- guarantee that `safe-candidate` updates are risk-free
- update lock files
- open automated pull requests

This is intentional for the first implementation.
The tool should support decisions, not replace review.

## Future improvements

Possible future improvements:

- GitHub Action scheduled report
- markdown summary artifact
- dependency grouping by area
- Angular ecosystem compatibility notes
- optional Dependabot configuration for selected branches
- security-focused report mode
