# Transloco Evolution

## Index

- [Goal](#goal)
- [Official resources](#official-resources)
- [Current setup](#current-setup)
- [Translation files](#translation-files)
- [Usage](#usage)
- [Runtime language switching](#runtime-language-switching)
- [Translation key conventions](#translation-key-conventions)
- [Guidelines](#guidelines)

## Goal

This evolution adds a minimal Transloco runtime i18n baseline.

The goal is to provide a clean internationalization setup without turning the starter into a business-specific application.

This document owns runtime architecture and translation conventions. For preview, apply,
verification, compatibility and troubleshooting, see the
[Transloco CLI Installer](../evolution-cli/transloco.md).

## Official resources

- [Transloco GitHub repository](https://github.com/jsverse/transloco)
- [Transloco documentation](https://jsverse.gitbook.io/transloco)

## Current setup

The branch uses `@jsverse/transloco`, the current Transloco package scope.

Application-level i18n providers live in:

```text
src/app/core/i18n/
  i18n.config.ts
  i18n.provider.ts
  transloco-http-loader.ts
```

The provider is registered in `app.config.ts`.

The reference branch uses the deterministic defaults:

```text
en
it
```

Default language:

```text
en
```

The Evolution CLI can instead select a configurable language set and default during installation.
The generated `i18n.config.ts` centralizes supported, default and fallback languages for reuse by
application code.

## Translation files

Translation files are served from Angular static assets:

```text
src/assets/i18n/<language>.json
```

The HTTP loader resolves translations with:

```text
./assets/i18n/<lang>.json
```

This keeps the path compatible with deployments that use a non-root base path.

## Usage

This branch does not apply translation keys to existing layout or feature templates by default.
This keeps the evolution branch easier to merge with other optional branches.

When a project is ready to translate a component, standalone components can import `TranslocoPipe`:

```ts
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  imports: [TranslocoPipe],
})
export class ExampleComponent {}
```

Templates can then use translation keys:

```html
{{ 'EXAMPLE_GROUP.TITLE' | transloco }}
```

## Runtime language switching

This branch enables runtime language changes through Transloco:

```ts
import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

const transloco = inject(TranslocoService);
transloco.setActiveLang('it');
```

No language switcher UI is included by default.
Applications should add one only when the product experience requires it.

## Translation key conventions

Use uppercase translation keys by default:

```json
{
  "EXAMPLE": "Example"
}
```

Nested keys are supported and recommended when they improve readability:

```json
{
  "EXAMPLE_GROUP": {
    "DESCRIPTION": "Description",
    "TITLE": "Title"
  }
}
```

Usage:

```html
{{ 'EXAMPLE' | transloco }} {{ 'EXAMPLE_GROUP.TITLE' | transloco }}
```

## Guidelines

- Keep translation keys stable and descriptive.
- Avoid business-specific translations in the starter.
- Prefer uppercase keys such as `SAVE`, `CANCEL` or `EXAMPLE_GROUP.TITLE`.
- Use nested keys when a feature or domain has multiple related labels.
- Keep shared layout keys under a dedicated namespace only when the product layout is ready to be translated.
- Add language persistence only when the product requirement is clear.
- Add lazy translation scopes only when features grow enough to justify them.
