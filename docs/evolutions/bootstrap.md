# Bootstrap Evolution

## Index

- [Goal](#goal)
- [Official resources](#official-resources)
- [Current setup](#current-setup)
- [Evolution CLI installer](#evolution-cli-installer)
- [Usage](#usage)
- [Guidelines](#guidelines)
- [Merge notes](#merge-notes)

## Goal

This evolution adds a minimal Bootstrap baseline.

The goal is to make Bootstrap available as a styling foundation without turning the starter into a pre-designed UI kit.

This document owns Bootstrap architecture, wrapper API and usage conventions. For preview, apply,
component selection, safety and troubleshooting, see the
[Bootstrap CLI Installer](../evolution-cli/bootstrap.md).

## Official resources

- [Bootstrap documentation](https://getbootstrap.com/)
- [Bootstrap GitHub repository](https://github.com/twbs/bootstrap)

## Current setup

The branch installs Bootstrap from npm:

```text
bootstrap
```

Bootstrap CSS is imported globally from:

```text
src/styles.scss
```

The import is intentionally global because Bootstrap is a design-system-level dependency.

## Evolution CLI installer

Bootstrap can be installed through the Evolution CLI.
Use the branch as the reference implementation and the
[operational installer guide](../evolution-cli/bootstrap.md) for commands, component selection,
repeatability and safety behavior.

Available starter-owned wrapper components:

| Component | Selector               | Generated path                                 |
| --------- | ---------------------- | ---------------------------------------------- |
| `alert`   | `app-bootstrap-alert`  | `shared/components/bootstrap/alert/alert.ts`   |
| `badge`   | `app-bootstrap-badge`  | `shared/components/bootstrap/badge/badge.ts`   |
| `button`  | `app-bootstrap-button` | `shared/components/bootstrap/button/button.ts` |
| `card`    | `app-bootstrap-card`   | `shared/components/bootstrap/card/card.ts`     |
| `input`   | `app-bootstrap-input`  | `shared/components/bootstrap/input/input.ts`   |

The generated wrappers intentionally expose a small API:

| Component | Supported options                                                                   |
| --------- | ----------------------------------------------------------------------------------- |
| `card`    | `title`, `subtitle`, `imageSrc`, `imageAlt`, `imagePosition` (`top` or `bottom`).   |
| `input`   | `id`, `name`, `label`, `type`, `value`, `placeholder`, `size`, accessibility attrs. |

Generated wrappers are exported from:

```text
src/app/shared/components/bootstrap/index.ts
```

Feature code should import only what it uses:

```ts
import { BootstrapButton, BootstrapCard } from '@shared/components/bootstrap';
```

## Usage

Bootstrap utility classes and components can be used by application teams after cloning this branch.

Example:

```html
<button class="btn btn-primary">Primary action</button>
```

This branch does not apply Bootstrap classes to the existing layout or dashboard templates by default.
This keeps the evolution branch easier to merge with other optional branches.

Generated Angular wrappers use `input()` signals for dynamic options and stay aligned with Bootstrap 5.3 classes.

## Guidelines

- Keep Bootstrap usage intentional and project-specific.
- Avoid turning shared starter templates into business-specific UI examples.
- Prefer Bootstrap utilities for layout and spacing only when the project has selected Bootstrap as its design foundation.
- Add project-specific Bootstrap customization after cloning the starter.
- Avoid adding another UI framework on top of this branch unless the project explicitly needs it.

## Merge notes

This evolution is intentionally small and additive-first.

Expected merge points:

- `package.json`
- `package-lock.json`
- `src/styles.scss`
- `src/app/shared/components/bootstrap/`

No existing layout or feature templates are changed by this branch.
