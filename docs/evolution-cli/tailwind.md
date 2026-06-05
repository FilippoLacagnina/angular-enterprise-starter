# Tailwind CLI Installer

## Index

- [Purpose](#purpose)
- [Generated output](#generated-output)
- [SCSS usage](#scss-usage)
- [Setup modes](#setup-modes)
- [Available components](#available-components)
- [Wrapper API](#wrapper-api)
- [Usage examples](#usage-examples)
- [Repeatable usage](#repeatable-usage)
- [Safety rules](#safety-rules)

## Purpose

The Tailwind installer adds Tailwind CSS v4 and optional starter-owned Angular wrapper components through the Evolution CLI.

When available, the CLI is more powerful than using the `evo/design-system/tailwind` branch directly because it supports dynamic component selection, preview mode, repeatable installation and safe skip/block behavior.
Tailwind uses the same shared design-system installer utilities as Bootstrap, so both installers follow the same preview/apply safety model.

The related reference branch is:

```text
evo/design-system/tailwind
```

## Generated output

The installer always:

- adds `tailwindcss`, `@tailwindcss/postcss` and `postcss` when missing;
- creates or updates `.postcssrc.json` with the Tailwind PostCSS plugin;
- adds the global Tailwind CSS import when missing;
- keeps existing layout and feature templates untouched.

Tailwind should be selected intentionally as the project design-system baseline.
Avoid combining multiple design-system CSS frameworks in a real product unless the project explicitly owns that integration.

Generated wrappers live under:

```text
src/app/shared/components/tailwind/
```

The installer also maintains:

```text
src/app/shared/components/tailwind/index.ts
```

Feature code should import only the components it needs:

```ts
import { TailwindButton, TailwindCard } from '@shared/components/tailwind';
```

## SCSS usage

Angular Enterprise Starter keeps SCSS as the default style format.
Tailwind can still be used from `src/styles.scss` and from component `*.scss` files.

The global Tailwind import is:

```scss
@use 'tailwindcss';
```

Because this is a Sass `@use` rule, it must stay before any other CSS/Sass rule in `src/styles.scss`.

Component templates may use utility classes directly for small local layouts.
For reusable wrapper components, prefer semantic classes in the template and move Tailwind utilities into the component SCSS with `@apply` when it improves readability.

## Setup modes

| Mode     | Description                                                     |
| -------- | --------------------------------------------------------------- |
| `all`    | Generates every Tailwind wrapper component provided by the CLI. |
| `select` | Generates only the requested Tailwind wrapper components.       |

Examples:

```bash
npm run starter:evolution -- --name tailwind --preview --tailwind-mode all
npm run starter:evolution -- --name tailwind --preview --tailwind-mode select --tailwind-components button,input
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

| Component | Selector              | Generated path                                |
| --------- | --------------------- | --------------------------------------------- |
| `alert`   | `app-tailwind-alert`  | `shared/components/tailwind/alert/alert.ts`   |
| `badge`   | `app-tailwind-badge`  | `shared/components/tailwind/badge/badge.ts`   |
| `button`  | `app-tailwind-button` | `shared/components/tailwind/button/button.ts` |
| `card`    | `app-tailwind-card`   | `shared/components/tailwind/card/card.ts`     |
| `input`   | `app-tailwind-input`  | `shared/components/tailwind/input/input.ts`   |

## Wrapper API

Generated wrappers expose only a small starter-owned API surface.

| Component | Supported options                                                                   |
| --------- | ----------------------------------------------------------------------------------- |
| `alert`   | `variant`, `dismissible`.                                                           |
| `badge`   | `variant`, `pill`.                                                                  |
| `button`  | `variant`, `size`, `type`, `disabled`.                                              |
| `card`    | `title`, `subtitle`, `imageSrc`, `imageAlt`, `imagePosition` (`top` or `bottom`).   |
| `input`   | `id`, `name`, `label`, `type`, `value`, `placeholder`, `size`, accessibility attrs. |

## Usage examples

Button:

```html
<app-tailwind-button variant="primary">Save</app-tailwind-button>
```

Input:

```html
<app-tailwind-input
  id="email"
  label="Email"
  type="email"
  placeholder="Insert email"
/>
```

Card:

```html
<app-tailwind-card
  title="Dashboard"
  subtitle="Overview"
  imageSrc="assets/images/dashboard.png"
  imageAlt="Dashboard preview"
>
  Dashboard content
</app-tailwind-card>
```

Alert:

```html
<app-tailwind-alert variant="warning">Review pending configuration.</app-tailwind-alert>
```

Badge:

```html
<app-tailwind-badge variant="success">Active</app-tailwind-badge>
```

## Repeatable usage

Tailwind is repeatable.

After Tailwind is enabled, teams can run it again to add missing wrapper components without duplicating starter metadata.
Complete wrapper components are skipped safely.

## Safety rules

The installer stops when a selected Tailwind component is partially installed.

This prevents the CLI from silently completing or overwriting ambiguous component state.
