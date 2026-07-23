# Bootstrap CLI Installer

<!-- evolution-guide-standard -->

## Purpose

The `bootstrap` evolution installs Bootstrap and generates optional starter-owned Angular wrapper
components.

Reference branch:

```text
evo/design-system/bootstrap
```

## When to use it

Use Bootstrap when the product wants Bootstrap CSS and a small set of Angular-owned primitives
without coupling feature code directly to generated framework markup everywhere.

Choose one primary design-system evolution for a real product. Combining Bootstrap with another
global CSS framework requires an explicit integration and ownership strategy.

## Prerequisites

Before applying:

- decide whether all wrappers or only selected wrappers are needed;
- review existing global style imports;
- verify that selected component targets are not partially installed;
- decide which application layer will own additional Bootstrap customization or theming.

## Generated changes

The evolution:

- adds the Bootstrap CSS import to `src/styles.scss` when missing;
- generates selected wrappers under `src/app/shared/components/bootstrap/`;
- creates or updates the shared `index.ts`;
- leaves existing layout and feature templates unchanged.

Available wrappers:

| Component | Selector               |
| --------- | ---------------------- |
| `alert`   | `app-bootstrap-alert`  |
| `badge`   | `app-bootstrap-badge`  |
| `button`  | `app-bootstrap-button` |
| `card`    | `app-bootstrap-card`   |
| `input`   | `app-bootstrap-input`  |

Feature code imports only the primitives it uses:

```ts
import { BootstrapButton, BootstrapCard } from '@shared/components/bootstrap';
```

## Dependencies

| Package     | Supported range | Target         |
| ----------- | --------------- | -------------- |
| `bootstrap` | `^5.3.8`        | `dependencies` |

Compatible existing declarations are preserved. Invalid ranges, incompatible ranges and
declarations in the wrong dependency section block installation.

## Options

| Option                   | Default | Description                                            |
| ------------------------ | ------- | ------------------------------------------------------ |
| `--bootstrap-mode`       | `all`   | Generates `all` wrappers or a selected subset.         |
| `--bootstrap-components` | —       | Comma-separated component names used in `select` mode. |

Supported component values are `alert`, `badge`, `button`, `card` and `input`.

The interactive CLI also accepts displayed numbers or a mixture of numbers and names. Explicit
non-interactive commands should use component names.

## Preview and apply

Preview all wrappers:

```bash
npm run starter:evolution -- \
  --name bootstrap \
  --preview \
  --bootstrap-mode all
```

Preview a subset:

```bash
npm run starter:evolution -- \
  --name bootstrap \
  --preview \
  --bootstrap-mode select \
  --bootstrap-components button,input,card
```

Apply after reviewing the preview:

```bash
npm run starter:evolution -- \
  --name bootstrap \
  --apply \
  --bootstrap-mode select \
  --bootstrap-components button,input,card
```

## Configuration

The installer adds a supported Bootstrap stylesheet import only when one is not already present.
Existing global styles are preserved.

Generated wrappers expose a deliberately small starter-owned API. Extend those wrappers rather than
scattering inconsistent Bootstrap variants across features.

Button, Badge, Alert and Card share the same semantic inputs and outputs as the equivalent Tailwind
wrappers. This keeps feature-level contracts stable when a project standardizes on either provider;
the generated implementation and styling remain provider-specific.

Example:

```html
<app-bootstrap-card
  title="Dashboard"
  subtitle="Overview"
>
  Dashboard content
</app-bootstrap-card>
```

Wrapper inputs and selectors are documented in
[Bootstrap Evolution](../evolutions/bootstrap.md#evolution-cli-installer).

## Safety and repeatability

Bootstrap is repeatable.

Later invocations can add missing wrappers. Complete selected components are skipped safely, while a
component with only some required source files blocks the entire preflight.

New Button, Badge, Alert and Card wrappers include generated component tests. Tests are supplemental
for compatibility: existing complete wrappers without those tests stay complete and are not
modified by a later invocation.

All component and dependency checks run before package or stylesheet changes. Existing generated
files are never overwritten or silently completed.

## Compatibility

Bootstrap can be combined with Transloco, Runtime Config, SignalStore, Docker SSR and AI Genkit
because those evolutions own different architectural areas.

Avoid installing Tailwind as a second global design system in production unless the project
explicitly owns:

- CSS reset and specificity interaction;
- design-token ownership;
- bundle impact;
- component conventions;
- migration and maintenance responsibility.

## Verification

After apply:

```bash
npm install
npm run format:check
npm run lint
npm test -- --watch=false
npm run build
```

Render each selected wrapper in an isolated feature or component test before adopting it in product
layouts.

## Removal and rollback

The CLI does not provide automatic uninstall.

To remove Bootstrap:

1. remove application imports and usages of generated wrappers;
2. delete `src/app/shared/components/bootstrap/`;
3. remove the Bootstrap stylesheet import;
4. remove the `bootstrap` dependency when unused;
5. update starter metadata.

If only one wrapper is no longer needed, remove its export and files while keeping the remaining
installation intact.

## Troubleshooting

| Symptom                                | Likely cause                               | Action                                                       |
| -------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| Preview reports a partial component    | Only some wrapper files exist.             | Reconcile or remove that wrapper before applying.            |
| Component name is rejected             | The value is not in the manifest catalog.  | Use one of the documented component names.                   |
| Bootstrap styles are missing           | Global stylesheet import was removed.      | Restore the supported Bootstrap import in `src/styles.scss`. |
| Styles conflict with another framework | Multiple global design systems are active. | Define explicit ownership or remove one framework.           |

## Architecture reference

See [Bootstrap Evolution](../evolutions/bootstrap.md) for wrapper API details, usage examples,
guidelines and reference-branch merge notes.
