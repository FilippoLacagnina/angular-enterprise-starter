# Angular Enterprise Starter Evolution CLI

Versioned Evolution CLI and schematics for Angular Enterprise Starter.

![Angular Enterprise Starter Evolution CLI](https://raw.githubusercontent.com/FilippoLacagnina/angular-enterprise-starter/main/docs/assets/starter-evolution-cli.svg)

The Evolution CLI adds validated optional capabilities to projects based on
[Angular Enterprise Starter](https://github.com/FilippoLacagnina/angular-enterprise-starter).

Use this package when:

- you started from Angular Enterprise Starter;
- you removed local installer tooling from the product repository;
- you want to receive newer installer behavior through npm;
- you prefer a preview-first workflow before modifying the workspace.

The CLI is intentionally modular: install only the evolutions your project needs.

## Available installers

| Installer   | Name           | Purpose                                                         |
| ----------- | -------------- | --------------------------------------------------------------- |
| SignalStore | `signal-store` | Generate feature/root NgRx SignalStore state files.             |
| Docker SSR  | `docker-ssr`   | Add an SSR-oriented Docker deployment baseline.                 |
| Bootstrap   | `bootstrap`    | Add Bootstrap and selected starter-owned UI wrapper components. |
| Tailwind    | `tailwind`     | Add Tailwind CSS and selected starter-owned UI wrappers.        |

## Usage

Start the guided CLI:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution
```

This is the main usage flow.
After running the command, the CLI asks which evolution to install and guides the required choices.
No additional command options are needed for the interactive flow.

Non-interactive examples are available when you want to script or test a specific evolution directly.

Preview before applying:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution --name tailwind --preview
```

Apply when ready:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution --name tailwind --apply
```

Use `--apply` only after validating the command with `--preview`.
For installer-specific options, see the Evolution CLI guide.

## Safety model

The CLI is conservative by design:

- preview before writing files;
- stop before overwriting generated targets;
- ask for explicit choices when an installer is parametrized;
- skip already installed pieces when safe;
- stop on partial or ambiguous project state;
- keep the related `evo/*` branch available as a manual fallback.

## Scope

The CLI is designed for projects based on Angular Enterprise Starter.
It is not intended to patch arbitrary Angular applications with unrelated structure or conventions.

## npm tag

During alpha, use the `@alpha` tag:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution
```

Future stable releases will use the default npm `latest` tag.

## Documentation

- [Starter documentation](https://github.com/FilippoLacagnina/angular-enterprise-starter#documentation)
- [Evolution CLI guide](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/schematics.md)
- [Evolution catalog](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions.md)
