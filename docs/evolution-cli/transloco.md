# Transloco CLI Installer

<!-- evolution-guide-standard -->

## Purpose

The `transloco` evolution adds a minimal runtime internationalization foundation without replacing
existing layout or feature text.

Reference branch:

```text
evo/i18n/transloco
```

## When to use it

Use Transloco when the product needs runtime language switching, translation assets and a shared
i18n provider.

The installer intentionally avoids business-specific translations, language persistence, lazy
scopes and a language-switcher UI. Add those capabilities only when product requirements are known.

## Prerequisites

Before applying:

- start from a compatible Angular Enterprise Starter workspace;
- keep valid Angular build options in `angular.json`;
- keep a supported provider anchor in `src/app/app.config.ts`;
- choose the initial languages and which selected language should be the application default.

## Generated changes

The evolution creates:

```text
src/app/core/i18n/
  i18n.config.ts
  i18n.provider.ts
  transloco-http-loader.ts

src/assets/i18n/
  <language>.json
```

It also:

- registers `src/assets` in `angular.json` when needed;
- registers `provideI18n()` in `src/app/app.config.ts`;
- records the evolution in starter metadata;
- leaves application templates unchanged.

The installer generates one asset for every selected language. The default selection creates
`en.json` and `it.json`. The assets contain neutral uppercase and nested key examples.

## Dependencies

| Package              | Supported range | Target         |
| -------------------- | --------------- | -------------- |
| `@jsverse/transloco` | `^8.3.0`        | `dependencies` |

Compatible existing declarations are preserved. Invalid ranges, incompatible ranges or a
declaration in `devDependencies` block installation.

## Options

| Option                         | Values                                           | Default |
| ------------------------------ | ------------------------------------------------ | ------- |
| `--transloco-languages`        | Comma-separated supported language codes         | `en,it` |
| `--transloco-default-language` | One language included in `--transloco-languages` | `en`    |

Supported language codes:

| Code | Language | Code | Language   |
| ---- | -------- | ---- | ---------- |
| `en` | English  | `it` | Italian    |
| `es` | Spanish  | `fr` | French     |
| `de` | German   | `pt` | Portuguese |
| `nl` | Dutch    | `zh` | Chinese    |
| `ja` | Japanese | `ko` | Korean     |
| `ar` | Arabic   | `hi` | Hindi      |

At least one language is required. Duplicates are normalized and unknown codes are rejected.
If `--transloco-default-language` is omitted, the default is always `en`; therefore `en` must be
selected unless another default is supplied explicitly. The fallback initially matches the default.

## Preview and apply

Preview:

```bash
npm run starter:evolution -- --name transloco --preview
```

Apply:

```bash
npm run starter:evolution -- --name transloco --apply
```

Custom language set:

```bash
npm run starter:evolution -- \
  --name transloco \
  --transloco-languages en,it,es,fr \
  --transloco-default-language en \
  --preview
```

Versioned npm CLI:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution \
  --name transloco \
  --preview
```

## Configuration

The default installer configuration produces:

```text
available languages: en, it
default language:    en
fallback language:   en
```

The generated `i18n.config.ts` centralizes the runtime contract:

```ts
export const SUPPORTED_LANGUAGES = ['en', 'it'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const FALLBACK_LANGUAGE: SupportedLanguage = DEFAULT_LANGUAGE;
```

The provider consumes these constants, so future language-switcher UI does not need to duplicate
the supported codes.

Translation files are loaded from:

```text
./assets/i18n/<lang>.json
```

The relative path remains compatible with deployments that use a non-root base path.

Standalone components opt in by importing `TranslocoPipe`:

```ts
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  imports: [TranslocoPipe],
})
export class ExampleComponent {}
```

```html
{{ 'EXAMPLE_GROUP.TITLE' | transloco }}
```

## Safety and repeatability

Transloco is non-repeatable.

Before changing dependencies or Angular configuration, the installer validates:

- `angular.json` and its build assets structure;
- `src/app/app.config.ts` and its provider insertion point;
- the selected languages and default-language relationship;
- every dynamically generated target file;
- the dependency declaration.

Existing i18n files are never overwritten. A blocking preflight leaves dependencies, Angular
configuration and application files unchanged.

## Compatibility

Runtime Config can be installed before or after Transloco. Both may register `src/assets`, and the
installers preserve compatible asset entries.

The evolution does not translate generated design-system wrappers, SignalStore examples or AI
features automatically. Product teams retain ownership of translation keys and UI language
selection.

## Verification

After apply:

```bash
npm install
npm run format:check
npm run lint
npm test -- --watch=false
npm run build
```

Then verify that the built browser assets contain one file under `assets/i18n/` for every selected
language.

## Removal and rollback

The CLI does not provide automatic uninstall.

To remove the foundation manually:

1. remove `provideI18n()` and its import from `app.config.ts`;
2. delete `src/app/core/i18n/`;
3. delete `src/assets/i18n/` when no other code owns those assets;
4. remove `@jsverse/transloco` when unused;
5. remove the `src/assets` registration only if no other feature needs it;
6. update starter metadata.

Prefer version-control rollback when application templates already contain translation keys.

## Troubleshooting

| Symptom                           | Likely cause                                   | Action                                                      |
| --------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| Translation request returns `404` | Assets were not built or the path changed.     | Verify Angular assets and the deployment base path.         |
| Key is rendered literally         | Key or active language entry is missing.       | Add the key to the corresponding translation file.          |
| Preview reports an app anchor     | `app.config.ts` was customized.                | Register the provider manually or restore a supported form. |
| Preview reports existing files    | A manual or partial i18n setup already exists. | Reconcile that setup before applying the evolution.         |
| Default language is rejected      | It is not part of the selected language set.   | Select it or explicitly choose another selected default.    |
| Language code is rejected         | It is not in the supported installer catalog.  | Use a supported code or add it manually after installation. |

## Architecture reference

See [Transloco Evolution](../evolutions/i18n-transloco.md) for runtime language switching,
translation-key conventions and architectural guidelines.
