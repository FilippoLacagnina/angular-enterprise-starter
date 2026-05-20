# Bootstrap Evolution

## Index

- [Goal](#goal)
- [Official resources](#official-resources)
- [Current setup](#current-setup)
- [Usage](#usage)
- [Guidelines](#guidelines)
- [Merge notes](#merge-notes)

## Goal

This evolution adds a minimal Bootstrap baseline.

The goal is to make Bootstrap available as a styling foundation without turning the starter into a pre-designed UI kit.

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

## Usage

Bootstrap utility classes and components can be used by application teams after cloning this branch.

Example:

```html
<button class="btn btn-primary">Primary action</button>
```

This branch does not apply Bootstrap classes to the existing layout or dashboard templates by default.
This keeps the evolution branch easier to merge with other optional branches.

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

No existing layout or feature templates are changed by this branch.
