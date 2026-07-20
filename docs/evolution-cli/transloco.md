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
- decide whether the default `en` and `it` assets fit the initial localization strategy.

## Generated changes

The evolution creates:

```text
src/app/core/i18n/
  i18n.provider.ts
  transloco-http-loader.ts

src/assets/i18n/
  en.json
  it.json
```

It also:

- registers `src/assets` in `angular.json` when needed;
- registers `provideI18n()` in `src/app/app.config.ts`;
- records the evolution in starter metadata;
- leaves application templates unchanged.

The generated assets contain neutral uppercase and nested key examples.

## Dependencies

| Package              | Supported range | Target         |
| -------------------- | --------------- | -------------- |
| `@jsverse/transloco` | `^8.3.0`        | `dependencies` |

Compatible existing declarations are preserved. Invalid ranges, incompatible ranges or a
declaration in `devDependencies` block installation.

## Options

Transloco has no evolution-specific options. The initial language set and provider baseline are
deterministic starter defaults that can be customized after installation.

## Preview and apply

Preview:

```bash
npm run starter:evolution -- --name transloco --preview
```

Apply:

```bash
npm run starter:evolution -- --name transloco --apply
```

Versioned npm CLI:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution \
  --name transloco \
  --preview
```

## Configuration

The default provider configures:

```text
available languages: en, it
default language:    en
fallback language:   en
```

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
- all generated target files;
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

Then verify that the built browser assets contain `assets/i18n/en.json` and `assets/i18n/it.json`.

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

## Architecture reference

See [Transloco Evolution](../evolutions/i18n-transloco.md) for runtime language switching,
translation-key conventions and architectural guidelines.
