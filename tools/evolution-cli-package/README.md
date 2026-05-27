# Angular Enterprise Starter Evolution CLI

Versioned Evolution CLI and schematics for Angular Enterprise Starter.

Use this package to add validated starter evolutions from npm, especially after removing local installer tooling from a product repository.

## Usage

Interactive mode:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution
```

Preview an evolution:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution --name bootstrap --preview
npx @filippolacagnina/angular-enterprise-starter@alpha evolution --name tailwind --preview
```

Apply an evolution:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution --name bootstrap --apply
npx @filippolacagnina/angular-enterprise-starter@alpha evolution --name tailwind --apply
```

Parametrized design-system examples:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution --name bootstrap --preview --bootstrap-mode select --bootstrap-components button,input
npx @filippolacagnina/angular-enterprise-starter@alpha evolution --name tailwind --preview --tailwind-mode select --tailwind-components button,input
```

## Scope

The CLI is designed for projects based on Angular Enterprise Starter.
It is not intended to patch arbitrary Angular applications with unrelated structure or conventions.

## Documentation

Starter documentation:

https://github.com/FilippoLacagnina/angular-enterprise-starter#documentation

Evolution CLI guide:

https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/schematics.md
