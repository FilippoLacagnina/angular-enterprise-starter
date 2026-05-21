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
Bootstrap is the first installer backed by the shared design-system installer utilities, so future Tailwind, Angular Material or PrimeNG primitives can reuse the same preview/apply safety model.

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
| `alert`   | `aes-bootstrap-alert`  | `shared/components/bootstrap/alert/alert.ts`   |
| `badge`   | `aes-bootstrap-badge`  | `shared/components/bootstrap/badge/badge.ts`   |
| `button`  | `aes-bootstrap-button` | `shared/components/bootstrap/button/button.ts` |
| `card`    | `aes-bootstrap-card`   | `shared/components/bootstrap/card/card.ts`     |
| `input`   | `aes-bootstrap-input`  | `shared/components/bootstrap/input/input.ts`   |

## Wrapper API

Generated wrappers expose only a small starter-owned API surface.

| Component | Supported options                                                                   |
| --------- | ----------------------------------------------------------------------------------- |
| `card`    | `title`, `subtitle`, `imageSrc`, `imageAlt`, `imagePosition` (`top` or `bottom`).   |
| `input`   | `id`, `name`, `label`, `type`, `value`, `placeholder`, `size`, accessibility attrs. |

## Usage examples

Button:

```html
<aes-bootstrap-button variant="primary">Save</aes-bootstrap-button>
```

Input:

```html
<aes-bootstrap-input
  id="email"
  label="Email"
  type="email"
  placeholder="Insert email"
/>
```

Card:

```html
<aes-bootstrap-card
  title="Dashboard"
  subtitle="Overview"
  imageSrc="assets/images/dashboard.png"
  imageAlt="Dashboard preview"
>
  Dashboard content
</aes-bootstrap-card>
```

Alert:

```html
<aes-bootstrap-alert variant="warning">Review pending configuration.</aes-bootstrap-alert>
```

Badge:

```html
<aes-bootstrap-badge variant="success">Active</aes-bootstrap-badge>
```

## Repeatable usage

Bootstrap is repeatable.

After Bootstrap is enabled, teams can run it again to add missing wrapper components without duplicating starter metadata.
Complete wrapper components are skipped safely.

## Safety rules

The installer stops when a selected Bootstrap component is partially installed.

This prevents the CLI from silently completing or overwriting ambiguous component state.
