# Tailwind Evolution

## Index

- [Goal](#goal)
- [Official resources](#official-resources)
- [Current setup](#current-setup)
- [Usage](#usage)
- [Evolution CLI installer](#evolution-cli-installer)
- [Guidelines](#guidelines)
- [Merge notes](#merge-notes)

## Goal

This evolution adds a minimal Tailwind CSS baseline.

The goal is to make Tailwind available as a utility-first styling foundation without turning the starter into a pre-designed UI kit.

This document owns Tailwind architecture, SCSS conventions and wrapper API. For preview, apply,
component selection, safety and troubleshooting, see the
[Tailwind CLI Installer](../evolution-cli/tailwind.md).

## Official resources

- [Tailwind CSS documentation](https://tailwindcss.com/docs)
- [Tailwind CSS Angular guide](https://tailwindcss.com/docs/guides/angular)
- [Tailwind CSS GitHub repository](https://github.com/tailwindlabs/tailwindcss)
- [Angular Tailwind guide](https://angular.dev/guide/tailwind)

## Current setup

The branch installs Tailwind CSS v4 with PostCSS integration:

```text
tailwindcss
@tailwindcss/postcss
postcss
```

PostCSS is configured in:

```text
.postcssrc.json
```

Tailwind is imported globally from:

```text
src/styles.scss
```

The setup intentionally does not add a `tailwind.config` file because Tailwind CSS v4 is CSS-first by default.

## Usage

Tailwind utility classes can be used by application teams after cloning this branch.

Example:

```html
<button class="rounded-md bg-sky-600 px-4 py-2 text-white">Primary action</button>
```

This branch does not apply Tailwind classes to the existing layout or dashboard templates by default.
This keeps the evolution branch easier to merge with other optional branches.

## Evolution CLI installer

Tailwind can be installed through the Evolution CLI.
Use the branch as the reference implementation and the
[operational installer guide](../evolution-cli/tailwind.md) for commands, component selection,
repeatability and safety behavior.

The installer can also generate starter-owned UI wrappers:

| Component | Selector              | Generated path                                |
| --------- | --------------------- | --------------------------------------------- |
| `alert`   | `app-tailwind-alert`  | `shared/components/tailwind/alert/alert.ts`   |
| `badge`   | `app-tailwind-badge`  | `shared/components/tailwind/badge/badge.ts`   |
| `button`  | `app-tailwind-button` | `shared/components/tailwind/button/button.ts` |
| `card`    | `app-tailwind-card`   | `shared/components/tailwind/card/card.ts`     |
| `input`   | `app-tailwind-input`  | `shared/components/tailwind/input/input.ts`   |

The wrappers expose the same semantic contract as their Bootstrap counterparts:

| Component | Supported options                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| `alert`   | `variant`, `dismissible`, `dismissLabel`, `role`, two-way `open`, `dismissed`.                                      |
| `badge`   | `variant`, `pill`, `ariaLabel`.                                                                                     |
| `button`  | `variant`, `outline`, `size`, `type`, `disabled`, `loading`, `fullWidth`, `ariaLabel`.                              |
| `card`    | `title`, `subtitle`, `headingLevel`, image source, alternative text, position, loading and dimensions, `ariaLabel`. |
| `input`   | `id`, `name`, `label`, `type`, `value`, `placeholder`, `size`, accessibility attributes.                            |

Alert and Badge support `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`,
`dark` and `neutral`. Button supports the same semantic variants except `neutral`, plus `link` and
`ghost`.

Button, Badge, Alert and Card use `ChangeDetectionStrategy.OnPush`. Newly generated versions also
include focused component tests. These tests are supplemental: a complete wrapper created by an
older CLI version remains valid and is never overwritten only because its generated test is absent.

Example loading action:

```html
<app-tailwind-button
  ariaLabel="Save account"
  loading
>
  Save
</app-tailwind-button>
```

Example controlled alert:

```html
<app-tailwind-alert
  dismissLabel="Dismiss notification"
  dismissible
  role="status"
  variant="success"
  [(open)]="notificationOpen"
  (dismissed)="handleNotificationDismissed()"
>
  Account saved.
</app-tailwind-alert>
```

## Guidelines

- Keep Tailwind usage intentional and project-specific.
- Avoid turning shared starter templates into business-specific UI examples.
- Prefer project-level design tokens and conventions after cloning the starter.
- Add project-specific theme customization after selecting Tailwind as the design foundation.
- Avoid adding another UI framework on top of this branch unless the project explicitly needs it.

## Merge notes

This evolution is intentionally small and additive-first.

Expected merge points:

- `package.json`
- `package-lock.json`
- `.postcssrc.json`
- `src/styles.scss`

No existing layout or feature templates are changed by this branch.
