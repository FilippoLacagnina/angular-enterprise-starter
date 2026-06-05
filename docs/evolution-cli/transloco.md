# Transloco CLI Installer

## Index

- [Goal](#goal)
- [Reference branch](#reference-branch)
- [What the CLI adds](#what-the-cli-adds)
- [Generated structure](#generated-structure)
- [Commands](#commands)
- [Safety behavior](#safety-behavior)
- [After installation](#after-installation)

## Goal

The Transloco installer adds a minimal runtime i18n baseline without changing existing layout or feature templates.

Use it when the project needs internationalization support but should stay free from business-specific labels during starter setup.

## Reference branch

Reference branch:

```text
evo/i18n/transloco
```

Branch documentation:

```text
docs/evolutions/i18n-transloco.md
```

## What the CLI adds

The installer:

- adds `@jsverse/transloco` to `package.json`;
- creates an application-level i18n provider;
- creates a Transloco HTTP loader;
- creates `en` and `it` translation assets;
- registers `src/assets` in `angular.json`;
- registers `provideI18n()` in `src/app/app.config.ts`;
- keeps existing components and templates unchanged.

## Generated structure

```text
src/app/core/i18n/
  i18n.provider.ts
  transloco-http-loader.ts

src/assets/i18n/
  en.json
  it.json
```

Translation files include uppercase and nested key examples:

```json
{
  "EXAMPLE": "Example",
  "EXAMPLE_GROUP": {
    "DESCRIPTION": "Description",
    "TITLE": "Title"
  }
}
```

## Commands

Preview:

```bash
npm run starter:evolution -- --name transloco --preview
```

Apply:

```bash
npm run starter:evolution -- --name transloco --apply
```

Package mode:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution --name transloco --preview
```

## Safety behavior

The installer stops before overwriting existing generated targets.

If one of the i18n provider, loader or translation files already exists, the CLI reports the conflict and points to the reference branch for manual inspection.

The installer does not generate documentation files inside the consumer project.
Canonical documentation remains in this repository.

## After installation

Run:

```bash
npm install
```

Then run the normal project checks:

```bash
npm run format:check
npm run lint
npm run build
```

When the product is ready to translate UI text, import `TranslocoPipe` in the standalone component that needs it and use translation keys in the template.
