# Layout Shell Evolution

## Goal

`layout-shell` provides a configurable application composition root without coupling the starter to
a design system.

It is distributed through the Evolution CLI and intentionally has no `evo/*` reference branch.

## Architecture

The generated layout separates:

- `layout.model.ts`: typed behavior contract;
- `layout.config.ts`: default configuration and `LAYOUT_CONFIG` token;
- Shell: region composition and routed-content host;
- Header, Sidebar and Footer: optional structural regions.

The real Shell always keeps `RouterOutlet`. Content-only removes Shell and renders the router outlet
directly from the application root.

## Responsive behavior

Shell establishes an inline-size container named `layout-shell`. At or below `64rem`, Sidebar and
content change from a two-column grid to vertical stacking.

`--layout-viewport-min-block-size` defaults to `100dvh` and can be overridden when Shell is embedded
in another constrained surface.

## Design-system boundary

The evolution owns layout structure and behavior. Bootstrap, Tailwind or a product-specific design
system owns visual styling. Logical CSS properties preserve Sidebar `start` and `end` behavior
across writing directions.

## Builder contract

The npm package exposes a serializable `layout-shell-catalog` contract. A Builder can use its
options, defaults and conditions to render a static Layout Studio and serialize the official CLI
flags.

`renderContractHash` fingerprints representative `all`, `select` and `content-only` output. A
Builder should pin the expected hash and require visual review when it changes.

The catalog does not expose Angular components and does not turn the Evolution CLI package into a
runtime component library.

## Operational guide

See [Layout Shell CLI Installer](../evolution-cli/layout-shell.md).
