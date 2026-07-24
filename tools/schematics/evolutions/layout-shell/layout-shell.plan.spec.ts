import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LAYOUT_CONTENT_WIDTH,
  DEFAULT_LAYOUT_FOOTER_BEHAVIOR,
  DEFAULT_LAYOUT_HEADER_BEHAVIOR,
  DEFAULT_LAYOUT_SIDEBAR_INITIAL_STATE,
  DEFAULT_LAYOUT_SIDEBAR_MODE,
  DEFAULT_LAYOUT_SIDEBAR_POSITION,
  type LayoutShellEvolutionOptions,
} from './layout-shell.model';
import { createLayoutShellInstallPlan } from './layout-shell.plan';

describe('Layout Shell installation plan', () => {
  it('selects every component with neutral defaults', () => {
    expect(createLayoutShellInstallPlan({})).toEqual({
      mode: 'all',
      components: ['shell', 'header', 'sidebar', 'footer'],
      config: {
        header: { behavior: DEFAULT_LAYOUT_HEADER_BEHAVIOR },
        sidebar: {
          mode: DEFAULT_LAYOUT_SIDEBAR_MODE,
          position: DEFAULT_LAYOUT_SIDEBAR_POSITION,
          initialState: DEFAULT_LAYOUT_SIDEBAR_INITIAL_STATE,
        },
        footer: { behavior: DEFAULT_LAYOUT_FOOTER_BEHAVIOR },
        content: { width: DEFAULT_LAYOUT_CONTENT_WIDTH },
      },
    });
  });

  it('creates a deterministic custom selection and removes duplicates', () => {
    expect(
      createLayoutShellInstallPlan({
        layoutMode: 'select',
        layoutComponents: 'footer, shell, sidebar,footer',
        layoutSidebarMode: 'collapsible',
        layoutSidebarPosition: 'end',
        layoutSidebarInitialState: 'collapsed',
        layoutFooterBehavior: 'sticky',
        layoutContentWidth: 'contained',
      }),
    ).toEqual({
      mode: 'select',
      components: ['shell', 'sidebar', 'footer'],
      config: {
        sidebar: {
          mode: 'collapsible',
          position: 'end',
          initialState: 'collapsed',
        },
        footer: { behavior: 'sticky' },
        content: { width: 'contained' },
      },
    });
  });

  it('supports a Shell-only layout', () => {
    expect(
      createLayoutShellInstallPlan({
        layoutMode: 'select',
        layoutComponents: 'shell',
      }),
    ).toEqual({
      mode: 'select',
      components: ['shell'],
      config: {
        content: { width: 'fluid' },
      },
    });
  });

  it('supports an explicit content-only application root', () => {
    expect(createLayoutShellInstallPlan({ layoutMode: 'content-only' })).toEqual({
      mode: 'content-only',
      components: [],
    });
  });

  it('ignores schema-injected defaults for components that are not selected', () => {
    expect(
      createLayoutShellInstallPlan({
        layoutMode: 'select',
        layoutComponents: 'shell',
        layoutHeaderBehavior: 'sticky',
        layoutSidebarMode: 'persistent',
        layoutSidebarPosition: 'start',
        layoutSidebarInitialState: 'expanded',
        layoutFooterBehavior: 'flow',
        layoutContentWidth: 'fluid',
      }),
    ).toEqual({
      mode: 'select',
      components: ['shell'],
      config: {
        content: { width: 'fluid' },
      },
    });

    expect(
      createLayoutShellInstallPlan({
        layoutMode: 'content-only',
        layoutHeaderBehavior: 'sticky',
        layoutSidebarMode: 'persistent',
        layoutSidebarPosition: 'start',
        layoutSidebarInitialState: 'expanded',
        layoutFooterBehavior: 'flow',
        layoutContentWidth: 'fluid',
      }),
    ).toEqual({
      mode: 'content-only',
      components: [],
    });
  });

  it('requires an explicit selection in select mode', () => {
    expect(() =>
      createLayoutShellInstallPlan({
        layoutMode: 'select',
      }),
    ).toThrow('Layout component selection is required');
  });

  it('requires Shell for every selected layout region', () => {
    expect(() =>
      createLayoutShellInstallPlan({
        layoutMode: 'select',
        layoutComponents: 'header,footer',
      }),
    ).toThrow('The Shell component is required');
  });

  it('rejects unsupported components and modes', () => {
    expect(() =>
      createLayoutShellInstallPlan({
        layoutMode: 'select',
        layoutComponents: 'shell,navigation',
      }),
    ).toThrow('Unsupported layout component selection: navigation');

    expect(() =>
      createLayoutShellInstallPlan({
        layoutMode: 'invalid',
      } as unknown as LayoutShellEvolutionOptions),
    ).toThrow('Unsupported layout mode: invalid');
  });

  it('rejects component selection outside select mode', () => {
    expect(() =>
      createLayoutShellInstallPlan({
        layoutMode: 'all',
        layoutComponents: 'shell,header',
      }),
    ).toThrow('--layout-components can be used only with --layout-mode select');
  });

  it('rejects options for components that are not selected', () => {
    expect(() =>
      createLayoutShellInstallPlan({
        layoutMode: 'select',
        layoutComponents: 'shell',
        layoutHeaderBehavior: 'flow',
      }),
    ).toThrow('--layout-header-behavior requires the Header component');

    expect(() =>
      createLayoutShellInstallPlan({
        layoutMode: 'select',
        layoutComponents: 'shell,header',
        layoutSidebarPosition: 'end',
      }),
    ).toThrow('--layout-sidebar-position requires the Sidebar component');
  });

  it('rejects an initial state for a persistent Sidebar', () => {
    expect(() =>
      createLayoutShellInstallPlan({
        layoutMode: 'select',
        layoutComponents: 'shell,sidebar',
        layoutSidebarMode: 'persistent',
        layoutSidebarInitialState: 'collapsed',
      }),
    ).toThrow(
      '--layout-sidebar-initial-state can be used only with --layout-sidebar-mode collapsible',
    );
  });

  it('rejects behavior options in content-only mode', () => {
    expect(() =>
      createLayoutShellInstallPlan({
        layoutMode: 'content-only',
        layoutContentWidth: 'contained',
      }),
    ).toThrow(
      'Layout behavior options are not available with --layout-mode content-only: --layout-content-width',
    );
  });

  it('rejects unsupported behavior values defensively', () => {
    expect(() =>
      createLayoutShellInstallPlan({
        layoutHeaderBehavior: 'fixed',
      } as unknown as LayoutShellEvolutionOptions),
    ).toThrow('Unsupported Header behavior: fixed');
  });
});
