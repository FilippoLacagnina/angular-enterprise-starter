import { describe, expect, it } from 'vitest';

import {
  LAYOUT_COMPONENT_NAMES,
  LAYOUT_CONTENT_WIDTHS,
  LAYOUT_MODES,
  LAYOUT_REGION_BEHAVIORS,
  LAYOUT_SIDEBAR_INITIAL_STATES,
  LAYOUT_SIDEBAR_MODES,
  LAYOUT_SIDEBAR_POSITIONS,
} from './layout-shell.model';
import {
  createLayoutShellRenderContractHash,
  createLayoutShellCatalog,
} from './layout-shell-catalog.factory';
import { LAYOUT_SHELL_CATALOG_SCHEMA_VERSION, layoutShellCatalog } from './layout-shell-catalog';
import { createLayoutShellInstallPlan } from './layout-shell.plan';

describe('Layout Shell Catalog', () => {
  it('is JSON-serializable and uses an independent schema version', () => {
    expect(JSON.parse(JSON.stringify(layoutShellCatalog))).toEqual(layoutShellCatalog);
    expect(layoutShellCatalog.schemaVersion).toBe(LAYOUT_SHELL_CATALOG_SCHEMA_VERSION);
    expect(layoutShellCatalog.renderContractHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('derives modes, components, values and defaults from the real layout contract', () => {
    expect(layoutShellCatalog.modes.map(({ value }) => value)).toEqual(LAYOUT_MODES);
    expect(layoutShellCatalog.components.map(({ value }) => value)).toEqual(LAYOUT_COMPONENT_NAMES);
    expect(optionValues('layoutHeaderBehavior')).toEqual(LAYOUT_REGION_BEHAVIORS);
    expect(optionValues('layoutSidebarMode')).toEqual(LAYOUT_SIDEBAR_MODES);
    expect(optionValues('layoutSidebarPosition')).toEqual(LAYOUT_SIDEBAR_POSITIONS);
    expect(optionValues('layoutSidebarInitialState')).toEqual(LAYOUT_SIDEBAR_INITIAL_STATES);
    expect(optionValues('layoutFooterBehavior')).toEqual(LAYOUT_REGION_BEHAVIORS);
    expect(optionValues('layoutContentWidth')).toEqual(LAYOUT_CONTENT_WIDTHS);
    expect(layoutShellCatalog.defaults.components).toEqual(LAYOUT_COMPONENT_NAMES);
  });

  it('keeps option identifiers, flags, dependencies and order deterministic', () => {
    expectUnique(layoutShellCatalog.options.map((option) => option.id));
    expectUnique(layoutShellCatalog.options.map((option) => option.cliFlag));
    expect(layoutShellCatalog.options.map((option) => option.order)).toEqual(
      layoutShellCatalog.options.map((_, index) => index),
    );

    for (const option of layoutShellCatalog.options) {
      expect(option.cliFlag).toBe(
        `--${option.id.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`,
      );
      expectUnique(option.values.map((value) => String(value.value)));
    }
  });

  it('represents plan applicability and content-only restrictions', () => {
    expect(layoutShellCatalog.requiredComponents.select).toEqual(['shell']);
    expect(layoutShellCatalog.contentOnly).toEqual({
      mode: 'content-only',
      components: [],
      allowedOptionIds: ['layoutMode'],
      rejectsAdditionalOptions: true,
      renderingStrategy: 'direct-content',
    });
    expect(() =>
      createLayoutShellInstallPlan({
        layoutMode: 'select',
        layoutComponents: 'header',
      }),
    ).toThrow('Shell component is required');
    expect(() =>
      createLayoutShellInstallPlan({
        layoutMode: 'content-only',
        layoutContentWidth: 'contained',
      }),
    ).toThrow('Layout behavior options are not available');
    expect(() =>
      createLayoutShellInstallPlan({
        layoutSidebarMode: 'persistent',
        layoutSidebarInitialState: 'collapsed',
      }),
    ).toThrow('can be used only with --layout-sidebar-mode collapsible');
  });

  it('produces a reproducible hash and detects render source drift', () => {
    expect(createLayoutShellCatalog().renderContractHash).toBe(
      layoutShellCatalog.renderContractHash,
    );

    const baseline = [
      {
        id: 'profile',
        files: [{ path: '/shell.html', content: '<main></main>\n' }],
      },
    ];
    const changed = [
      {
        id: 'profile',
        files: [{ path: '/shell.html', content: '<main>Changed</main>\n' }],
      },
    ];

    expect(createLayoutShellRenderContractHash(baseline)).not.toBe(
      createLayoutShellRenderContractHash(changed),
    );
  });
});

function optionValues(optionId: string): readonly string[] {
  return (
    layoutShellCatalog.options
      .find((option) => option.id === optionId)
      ?.values.map(({ value }) => String(value)) ?? []
  );
}

function expectUnique(values: readonly string[]): void {
  expect(new Set(values).size).toBe(values.length);
}
