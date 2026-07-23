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
It executes bundled schematics directly, so the target workspace does not need a preinstalled local Angular CLI before running an installer.

## Available installers

| Installer      | Name             | Purpose                                                         |
| -------------- | ---------------- | --------------------------------------------------------------- |
| Transloco      | `transloco`      | Add runtime i18n with configurable language assets and default. |
| Runtime Config | `runtime-config` | Add deployable values.yml runtime configuration with guards.    |
| Layout Shell   | `layout-shell`   | Generate a configurable application Shell and layout regions.   |
| SignalStore    | `signal-store`   | Generate feature/root NgRx SignalStore state files.             |
| Docker SSR     | `docker-ssr`     | Add an SSR-oriented Docker deployment baseline.                 |
| Bootstrap      | `bootstrap`      | Add Bootstrap and selected starter-owned UI wrapper components. |
| Tailwind       | `tailwind`       | Add Tailwind CSS and selected starter-owned UI wrappers.        |
| AI Genkit      | `ai-genkit`      | Add a server-side Genkit foundation and opt-in summary demo.    |

## Usage

Start the guided CLI:

```bash
npx @filippolacagnina/angular-enterprise-starter evolution
```

This is the main usage flow.
After running the command, the CLI asks which evolution to install and guides the required choices.
No additional command options are needed for the interactive flow.

Non-interactive examples are available when you want to script or test a specific evolution directly.

Preview before applying:

```bash
npx @filippolacagnina/angular-enterprise-starter evolution --name tailwind --preview
```

Apply when ready:

```bash
npx @filippolacagnina/angular-enterprise-starter evolution --name tailwind --apply
```

Use `--apply` only after validating the command with `--preview`.
For installer-specific options, see the Evolution CLI guide.

## Design system data contracts

The package exposes two versioned, serializable contracts for tools such as the Interactive Builder.
They let a trusted Node build process inspect and compile the starter-owned Bootstrap and Tailwind
components without copying implementations or importing internal Schematics paths.

The semantic catalog describes selectors, imports, inputs, outputs and representative examples:

```ts
import {
  designSystemCatalog,
  type DesignSystemCatalog,
} from '@filippolacagnina/angular-enterprise-starter/design-system-catalog';
```

The source manifest contains the same components' generated runtime files, provider style strategy,
declared package requirements and deterministic SHA-256 drift hashes:

```ts
import {
  designSystemSources,
  type DesignSystemSources,
} from '@filippolacagnina/angular-enterprise-starter/design-system-sources';
```

Raw JSON assets are available for non-TypeScript tooling:

```text
@filippolacagnina/angular-enterprise-starter/design-system-catalog.json
@filippolacagnina/angular-enterprise-starter/design-system-sources.json
```

Consume both contracts from the same pinned package version:

```text
validate schemas -> correlate components -> check hashes -> materialize files -> install styles -> compile
```

The catalog and source manifest have independent `schemaVersion` values. Validate both before use
and reject misaligned provider IDs, component IDs or class names. Source hashes support drift
detection and caching; they are not authenticity signatures. Package-manager integrity, provenance
and the consumer lockfile remain the trust boundary.

The Evolution CLI remains responsible for safely installing components into product workspaces.
The source manifest is a build-time integration contract, not an Angular runtime component library.

## Layout Shell catalog

The package exposes the serializable Layout Shell configuration contract for build-time tools such
as the Interactive Builder:

```ts
import {
  layoutShellCatalog,
  type LayoutShellCatalog,
} from '@filippolacagnina/angular-enterprise-starter/layout-shell-catalog';
```

Raw JSON is available from:

```text
@filippolacagnina/angular-enterprise-starter/layout-shell-catalog.json
```

The catalog contains ordered modes, components, defaults, CLI flags, applicability conditions and
content-only behavior. `renderContractHash` fingerprints representative generated output so a
static preview can detect when it requires visual review. It does not expose Angular runtime
components or source files.

## Safety model

The CLI is conservative by design:

- preview before writing files;
- stop before overwriting generated targets;
- ask for explicit choices when an installer is parametrized;
- skip already installed pieces when safe;
- run preflight guards before destructive configuration changes;
- stop on partial or ambiguous project state;
- keep the related `evo/*` branch available as a manual fallback.

## Scope

The CLI is designed for projects based on Angular Enterprise Starter.
It is not intended to patch arbitrary Angular applications with unrelated structure or conventions.

## npm tags

The default command follows the npm `latest` dist-tag:

```bash
npx @filippolacagnina/angular-enterprise-starter evolution
```

Use the explicit `@alpha` tag when a workflow should keep tracking the public alpha line:

```bash
npx @filippolacagnina/angular-enterprise-starter@alpha evolution
```

During the current public alpha, releases are intentionally assigned to both `latest` and `alpha`.

## Documentation

- [Starter documentation](https://github.com/FilippoLacagnina/angular-enterprise-starter#documentation)
- [Interactive Builder](https://angular-enterprise-starter-builder.onrender.com/)
- [Evolution CLI guide](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/schematics.md)
- [Evolution catalog](https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/evolutions.md)
