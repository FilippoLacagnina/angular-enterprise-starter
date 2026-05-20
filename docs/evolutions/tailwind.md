# Tailwind Evolution

## Index

- [Goal](#goal)
- [Official resources](#official-resources)
- [Current setup](#current-setup)
- [Usage](#usage)
- [Guidelines](#guidelines)
- [Merge notes](#merge-notes)

## Goal

This evolution adds a minimal Tailwind CSS baseline.

The goal is to make Tailwind available as a utility-first styling foundation without turning the starter into a pre-designed UI kit.

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
