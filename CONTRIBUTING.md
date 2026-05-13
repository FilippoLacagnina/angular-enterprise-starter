# Contributing

Thank you for considering contributing to Angular Enterprise Starter.

## Project status

This project is currently in pre-release.
The public API, folder structure, scripts and examples may change before the first stable version.

## Before opening a pull request

Run the following checks:

```bash
npm run format:check
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npm run build
```

## Contribution guidelines

- Keep the starter minimal and enterprise-oriented.
- Avoid adding UI libraries by default.
- Avoid adding business-specific logic.
- Prefer documented examples over hidden conventions.
- Keep feature examples easy to remove after cloning.
- Update documentation when architecture, scripts or conventions change.

## Branch naming

Use this branch naming pattern:

```text
<type>/<scope>/<short-description>
```

Allowed branch types:

- `feature`: application or starter capabilities.
- `fix`: bug fixes or regressions.
- `docs`: documentation-only changes.
- `refactor`: internal restructuring without behavior changes.
- `setup`: tooling, repository or configuration setup.
- `release`: versioning and release preparation.

Examples:

```text
feature/layout/shell-structure
feature/dashboard/base-route
fix/routing/dashboard-redirect
docs/architecture/folder-guidelines
docs/configuration/environment-scripts
refactor/layout/remove-default-styles
setup/github/ci-workflow
release/first-public-alpha
```

## Pull requests

Pull requests should explain:

- What changed.
- Why it changed.
- How it was tested.
