# Bootstrap CLI Installer

## Index

- [Purpose](#purpose)
- [Generated output](#generated-output)
- [Setup modes](#setup-modes)
- [Available components](#available-components)
- [Wrapper API](#wrapper-api)
- [Usage examples](#usage-examples)
- [Repeatable usage](#repeatable-usage)
- [Safety rules](#safety-rules)

## Purpose

The Bootstrap installer adds Bootstrap and optional starter-owned Angular wrapper components through the Evolution CLI.

When available, the CLI is more powerful than using the `evo/design-system/bootstrap` branch directly because it supports dynamic component selection, preview mode, repeatable installation and safe skip/block behavior.
Bootstrap is backed by shared design-system installer utilities, so Tailwind follows the same model and future Angular Material or PrimeNG primitives can reuse the same preview/apply safety rules.

The related reference branch is:

```text
evo/design-system/bootstrap
```

## Generated output

The installer always:

- adds the `bootstrap` dependency when missing;
- adds the global Bootstrap CSS import when missing;
- keeps existing layout and feature templates untouched.

Generated wrappers live under:

```text
src/app/shared/components/bootstrap/
```

The installer also maintains:

```text
src/app/shared/components/bootstrap/index.ts
```

Feature code should import only the components it needs:

```ts
import { BootstrapButton, BootstrapCard } from '@shared/components/bootstrap';
```

## Setup modes

| Mode     | Description                                                      |
| -------- | ---------------------------------------------------------------- |
| `all`    | Generates every Bootstrap wrapper component provided by the CLI. |
| `select` | Generates only the requested Bootstrap wrapper components.       |

Examples:

```bash
npm run starter:evolution -- --name bootstrap --preview --bootstrap-mode all
npm run starter:evolution -- --name bootstrap --preview --bootstrap-mode select --bootstrap-components button,input
```

When using interactive mode with `select`, the CLI accepts:

| Input style | Example        |
| ----------- | -------------- |
| Numbers     | `3,5`          |
| Names       | `button,input` |
| Mixed       | `3,input`      |

The recommended starter selection is:

```text
button,input,card
```

## Available components

| Component | Selector               | Generated path                                 |
| --------- | ---------------------- | ---------------------------------------------- |
| `alert`   | `app-bootstrap-alert`  | `shared/components/bootstrap/alert/alert.ts`   |
| `badge`   | `app-bootstrap-badge`  | `shared/components/bootstrap/badge/badge.ts`   |
| `button`  | `app-bootstrap-button` | `shared/components/bootstrap/button/button.ts` |
| `card`    | `app-bootstrap-card`   | `shared/components/bootstrap/card/card.ts`     |
| `input`   | `app-bootstrap-input`  | `shared/components/bootstrap/input/input.ts`   |

## Wrapper API

Generated wrappers expose only a small starter-owned API surface.

| Component | Supported options                                                                   |
| --------- | ----------------------------------------------------------------------------------- |
| `card`    | `title`, `subtitle`, `imageSrc`, `imageAlt`, `imagePosition` (`top` or `bottom`).   |
| `input`   | `id`, `name`, `label`, `type`, `value`, `placeholder`, `size`, accessibility attrs. |

## Usage examples

Button:

```html
<app-bootstrap-button variant="primary">Save</app-bootstrap-button>
```

Input:

```html
<app-bootstrap-input
  id="email"
  label="Email"
  type="email"
  placeholder="Insert email"
/>
```

Card:

```html
<app-bootstrap-card
  title="Dashboard"
  subtitle="Overview"
  imageSrc="assets/images/dashboard.png"
  imageAlt="Dashboard preview"
>
  Dashboard content
</app-bootstrap-card>
```

Alert:

```html
<app-bootstrap-alert variant="warning">Review pending configuration.</app-bootstrap-alert>
```

Badge:

```html
<app-bootstrap-badge variant="success">Active</app-bootstrap-badge>
```

## Repeatable usage

Bootstrap is repeatable.

After Bootstrap is enabled, teams can run it again to add missing wrapper components without duplicating starter metadata.
Complete wrapper components are skipped safely.

## Safety rules

The installer stops when a selected Bootstrap component is partially installed.

This prevents the CLI from silently completing or overwriting ambiguous component state.
