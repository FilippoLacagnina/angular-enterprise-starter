# Layout Shell CLI Installer

<!-- evolution-guide-standard -->

## Purpose

The `layout-shell` evolution replaces the pristine layout placeholders with a configurable,
design-system-neutral application shell.

It is owned by the Evolution CLI and does not depend on an `evo/*` reference branch.

## When to use it

Use this evolution when a project needs an explicit Shell, optional Header, Sidebar and Footer
regions, or a content-only application root.

Apply it before customizing baseline layout files.

## Prerequisites

- Keep the starter layout files pristine.
- Decide which layout regions the application needs.
- Decide whether the Sidebar is persistent or collapsible.
- Preview deletions before selecting a partial or content-only layout.

## Generated changes

Shell-based modes create `src/app/layout/layout.model.ts`,
`src/app/layout/layout.config.ts` and the selected layout component files.

Unselected pristine regions are removed. Content-only mode replaces the root Shell with a direct
`RouterOutlet` and removes the pristine layout directories.

## Dependencies

The evolution adds no package dependencies.

## Options

| Option                           | Default    | Values                                 |
| -------------------------------- | ---------- | -------------------------------------- |
| `--layout-mode`                  | `all`      | `all`, `select`, `content-only`        |
| `--layout-components`            | all        | `shell`, `header`, `sidebar`, `footer` |
| `--layout-header-behavior`       | `flow`     | `flow`, `sticky`                       |
| `--layout-sidebar-mode`          | persistent | `persistent`, `collapsible`            |
| `--layout-sidebar-position`      | `start`    | `start`, `end`                         |
| `--layout-sidebar-initial-state` | `expanded` | `expanded`, `collapsed`                |
| `--layout-footer-behavior`       | `flow`     | `flow`, `sticky`                       |
| `--layout-content-width`         | `fluid`    | `fluid`, `contained`                   |

`select` requires Shell. Sidebar initial state applies only to a collapsible Sidebar.
Content-only accepts no layout behavior options.

## Preview and apply

Preview the complete layout:

```bash
npm run starter:evolution -- --name layout-shell --preview
```

Preview selected regions:

```bash
npm run starter:evolution -- \
  --name layout-shell \
  --preview \
  --layout-mode select \
  --layout-components shell,header,sidebar \
  --layout-header-behavior sticky \
  --layout-sidebar-mode collapsible \
  --layout-sidebar-position end \
  --layout-sidebar-initial-state collapsed \
  --layout-content-width contained
```

Replace the root with routed content only:

```bash
npm run starter:evolution -- \
  --name layout-shell \
  --preview \
  --layout-mode content-only
```

Replace `--preview` with `--apply` only after reviewing the plan.

## Configuration

Shell-based installations expose `LAYOUT_CONFIG` and `DEFAULT_LAYOUT_CONFIG` from
`src/app/layout/layout.config.ts`. Projects can replace the provider or edit the generated default
after installation.

Structural sizing, borders and motion are exposed as CSS custom properties on Shell. Responsive
stacking uses a `64rem` container query. The default
`--layout-viewport-min-block-size: 100dvh` keeps the application at least viewport height while
allowing constrained previews and embedded shells to override it.

## Safety and repeatability

The installer preflights every create, update and delete before changing the tree. It stops when:

- a baseline layout file was customized;
- a component directory is partial or contains extra files;
- generated model or configuration targets already exist;
- content-only cannot safely replace the root.

The evolution is not repeatable.

## Compatibility

- Angular `21`
- TypeScript `5.9`
- Bootstrap and Tailwind evolutions remain optional and independent
- left-to-right and right-to-left layouts through logical CSS properties

## Verification

```bash
npm run schematics:test
npm run schematics:build
npm run lint
npm run format:check
```

After apply, run the application and verify the selected regions, Sidebar behavior, sticky regions,
contained width and responsive stacking.

## Removal and rollback

Before commit, restore the workspace using normal version-control review. After adoption, remove or
replace generated files manually because the CLI does not provide an uninstall command.

Content-only is a generation choice, not an automatic rollback path for customized layouts.

## Troubleshooting

| Symptom                            | Cause                                  | Resolution                                    |
| ---------------------------------- | -------------------------------------- | --------------------------------------------- |
| Shell selection is rejected        | `select` omitted the required Shell.   | Include `shell` or use `content-only`.        |
| Sidebar initial state is rejected  | Sidebar is not collapsible.            | Select `collapsible` or omit the option.      |
| Preflight blocks the installation  | Layout files differ from the baseline. | Review and migrate customized files manually. |
| Content-only rejects extra options | Layout behavior flags were supplied.   | Pass only `--layout-mode content-only`.       |

## Architecture reference

See [Layout Shell Evolution](../evolutions/layout-shell.md), [Architecture](../architecture.md) and
the shared [Evolution CLI guide](../schematics.md).
