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

Shell establishes an inline-size container named `layout-shell` and uses the same `64rem` contract
for its `ResizeObserver`-managed state and CSS container queries.

When Header and Sidebar coexist, compact navigation is a closed-by-default overlay drawer:

- Header exposes the hamburger trigger and emits `menuToggle`;
- Shell owns viewport and open state, including route and keyboard orchestration;
- Sidebar renders the drawer surface and emits `drawerClose`;
- `start` and `end` determine the opening edge with logical, RTL-compatible positioning;
- close button, backdrop, `Escape` and `NavigationEnd` close the drawer;
- focus enters the close control on open and returns to the hamburger for direct dismissals;
- `aria-expanded`, `aria-controls`, labels, modal semantics and `inert` protect the compact
  accessibility contract.

Desktop persistent and collapsible behavior is unchanged. A Sidebar without Header retains vertical
compact stacking rather than becoming an inaccessible drawer. Header without Sidebar does not show
the hamburger.

`--layout-viewport-min-block-size` defaults to `100dvh` and can be overridden when Shell is embedded
in another constrained surface.

## Design-system boundary

The evolution owns layout structure and behavior. Bootstrap, Tailwind or a product-specific design
system owns visual styling. Logical CSS properties preserve Sidebar `start` and `end` behavior
across writing directions.

## Builder contract

The npm package exposes a serializable `layout-shell-catalog` contract. A Builder can use its
options, defaults, conditions and standard responsive drawer metadata to render a static Layout
Studio and serialize the official CLI flags.

`renderContractHash` fingerprints default and configured `all` output together with representative
`select` and `content-only` output. A Builder should pin the expected hash and require visual review
when it changes.

The catalog does not expose Angular components and does not turn the Evolution CLI package into a
runtime component library.

## Operational guide

See [Layout Shell CLI Installer](../evolution-cli/layout-shell.md).
