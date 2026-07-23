# Tailwind CLI Installer

<!-- evolution-guide-standard -->

## Purpose

The `tailwind` evolution installs Tailwind CSS v4 with PostCSS and generates optional starter-owned
Angular wrapper components.

Reference branch:

```text
evo/design-system/tailwind
```

## When to use it

Use Tailwind when the product wants utility-first styling while preserving Angular Enterprise
Starter's SCSS setup and a small reusable wrapper layer.

Select one primary design system for production. Combining Tailwind with another global CSS
framework requires explicit ownership of resets, tokens, specificity and bundle impact.

## Prerequisites

Before applying:

- decide whether all wrappers or a selected subset is required;
- verify that `.postcssrc.json` contains valid JSON with an object-shaped `plugins` field;
- review `src/styles.scss`, where the Tailwind `@use` directive must precede other Sass or CSS rules;
- verify that selected component targets are not partially installed.

## Generated changes

The evolution:

- creates or updates `.postcssrc.json` with `@tailwindcss/postcss`;
- adds `@use 'tailwindcss';` to `src/styles.scss` when missing;
- generates selected wrappers under `src/app/shared/components/tailwind/`;
- creates or updates the shared `index.ts`;
- leaves existing layout and feature templates unchanged.

Available wrappers:

| Component | Selector              |
| --------- | --------------------- |
| `alert`   | `app-tailwind-alert`  |
| `badge`   | `app-tailwind-badge`  |
| `button`  | `app-tailwind-button` |
| `card`    | `app-tailwind-card`   |
| `input`   | `app-tailwind-input`  |

Feature code imports only the primitives it uses:

```ts
import { TailwindButton, TailwindCard } from '@shared/components/tailwind';
```

## Dependencies

| Package                | Supported range | Target            |
| ---------------------- | --------------- | ----------------- |
| `tailwindcss`          | `^4.3.0`        | `devDependencies` |
| `@tailwindcss/postcss` | `^4.3.0`        | `devDependencies` |
| `postcss`              | `^8.5.14`       | `devDependencies` |

The installer preserves compatible declarations and validates all three dependencies before
writing any of them.

## Options

| Option                  | Default | Description                                            |
| ----------------------- | ------- | ------------------------------------------------------ |
| `--tailwind-mode`       | `all`   | Generates `all` wrappers or a selected subset.         |
| `--tailwind-components` | —       | Comma-separated component names used in `select` mode. |

Supported values are `alert`, `badge`, `button`, `card` and `input`.

The interactive CLI accepts displayed numbers or names. Explicit non-interactive commands should
use names.

## Preview and apply

Preview all wrappers:

```bash
npm run starter:evolution -- \
  --name tailwind \
  --preview \
  --tailwind-mode all
```

Preview a subset:

```bash
npm run starter:evolution -- \
  --name tailwind \
  --preview \
  --tailwind-mode select \
  --tailwind-components button,input,card
```

Apply:

```bash
npm run starter:evolution -- \
  --name tailwind \
  --apply \
  --tailwind-mode select \
  --tailwind-components button,input,card
```

## Configuration

The generated global import is:

```scss
@use 'tailwindcss';
```

Keep it before other Sass or CSS rules.

Templates can use utility classes for small local layouts. Reusable product primitives should
prefer a stable semantic wrapper API, with `@apply` in component SCSS where it improves
readability.

Button, Badge, Alert and Card share the same semantic inputs and outputs as the equivalent Bootstrap
wrappers. This keeps feature-level contracts stable when a project standardizes on either provider;
the generated implementation and styling remain provider-specific.

Example:

```html
<app-tailwind-card
  title="Dashboard"
  subtitle="Overview"
>
  Dashboard content
</app-tailwind-card>
```

Wrapper inputs and usage guidance are documented in
[Tailwind Evolution](../evolutions/tailwind.md#evolution-cli-installer).

## Safety and repeatability

Tailwind is repeatable.

Before dependencies, styles or components change, the preflight validates:

- all dependency declarations;
- existing PostCSS JSON and plugin structure;
- complete or partial state for every selected wrapper.

Complete wrappers are skipped. Wrappers with only some required source files, invalid PostCSS
configuration or dependency conflicts block the complete invocation without leaving package or
style changes.

New Button, Badge, Alert and Card wrappers include generated component tests. Tests are supplemental
for compatibility: existing complete wrappers without those tests stay complete and are not
modified by a later invocation.

## Compatibility

Tailwind can be combined with non-design-system evolutions because it owns styling and shared UI
primitives only.

Avoid combining it with Bootstrap in production unless the team explicitly owns CSS interaction,
token strategy, component conventions and bundle cost.

Runtime Config assets, Transloco assets and AI routes do not require Tailwind-specific
configuration.

## Verification

After apply:

```bash
npm install
npm run format:check
npm run lint
npm test -- --watch=false
npm run build
```

Verify that Tailwind utilities are emitted and each selected wrapper renders with its intended
variants.

## Removal and rollback

The CLI does not provide automatic uninstall.

To remove Tailwind:

1. remove product usage of generated wrappers and utility classes;
2. delete `src/app/shared/components/tailwind/`;
3. remove `@use 'tailwindcss';`;
4. remove the Tailwind PostCSS plugin, preserving other plugins;
5. remove the three development dependencies when unused;
6. update starter metadata.

Removing only one wrapper requires deleting its files and index export while preserving the rest of
the foundation.

## Troubleshooting

| Symptom                             | Likely cause                                    | Action                                                   |
| ----------------------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| Preview reports invalid PostCSS     | `.postcssrc.json` is malformed or incompatible. | Correct it before applying.                              |
| Preview reports a partial component | Only some wrapper files exist.                  | Reconcile or remove that wrapper before applying.        |
| Tailwind utilities are missing      | PostCSS plugin or global import is absent.      | Verify `.postcssrc.json` and `src/styles.scss`.          |
| Sass reports `@use` ordering errors | Tailwind import follows another rule.           | Move `@use 'tailwindcss';` to the beginning of the file. |
| Styles conflict with Bootstrap      | Two global design systems are active.           | Define explicit ownership or remove one framework.       |

## Architecture reference

See [Tailwind Evolution](../evolutions/tailwind.md) for SCSS conventions, wrapper API details,
guidelines and reference-branch merge notes.
