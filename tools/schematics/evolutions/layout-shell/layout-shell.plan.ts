import { SchematicsException } from '@angular-devkit/schematics';

import {
  DEFAULT_LAYOUT_CONTENT_WIDTH,
  DEFAULT_LAYOUT_FOOTER_BEHAVIOR,
  DEFAULT_LAYOUT_HEADER_BEHAVIOR,
  DEFAULT_LAYOUT_MODE,
  DEFAULT_LAYOUT_SIDEBAR_INITIAL_STATE,
  DEFAULT_LAYOUT_SIDEBAR_MODE,
  DEFAULT_LAYOUT_SIDEBAR_POSITION,
  LAYOUT_COMPONENT_NAMES,
  LAYOUT_CONTENT_WIDTHS,
  LAYOUT_MODES,
  LAYOUT_REGION_BEHAVIORS,
  LAYOUT_SIDEBAR_INITIAL_STATES,
  LAYOUT_SIDEBAR_MODES,
  LAYOUT_SIDEBAR_POSITIONS,
  type LayoutComponentName,
  type LayoutConfig,
  type LayoutShellEvolutionOptions,
  type LayoutShellInstallPlan,
} from './layout-shell.model';

export function createLayoutShellInstallPlan(
  options: LayoutShellEvolutionOptions,
): LayoutShellInstallPlan {
  const mode = options.layoutMode ?? DEFAULT_LAYOUT_MODE;

  assertSupportedValue(mode, LAYOUT_MODES, 'layout mode');

  if (mode === 'content-only') {
    assertContentOnlyOptions(options);

    return {
      mode,
      components: [],
    };
  }

  const components =
    mode === 'all'
      ? resolveAllComponents(options.layoutComponents)
      : parseSelectedComponents(options.layoutComponents);

  return {
    mode,
    components,
    config: createLayoutConfig(options, components),
  };
}

function resolveAllComponents(
  selectedComponents: string | undefined,
): readonly LayoutComponentName[] {
  if (selectedComponents !== undefined) {
    throw new SchematicsException(
      '--layout-components can be used only with --layout-mode select.',
    );
  }

  return LAYOUT_COMPONENT_NAMES;
}

function parseSelectedComponents(value: string | undefined): readonly LayoutComponentName[] {
  if (!value?.trim()) {
    throw new SchematicsException(
      'Layout component selection is required when using --layout-mode select.',
    );
  }

  const requestedComponents = value
    .split(',')
    .map((component) => component.trim().toLowerCase())
    .filter(Boolean);
  const unsupportedComponents = requestedComponents.filter(
    (component) => !LAYOUT_COMPONENT_NAMES.includes(component as LayoutComponentName),
  );

  if (unsupportedComponents.length > 0) {
    throw new SchematicsException(
      `Unsupported layout component selection: ${[...new Set(unsupportedComponents)].join(', ')}. Supported components: ${LAYOUT_COMPONENT_NAMES.join(', ')}.`,
    );
  }

  const uniqueComponents = new Set(requestedComponents as LayoutComponentName[]);

  if (!uniqueComponents.has('shell')) {
    throw new SchematicsException(
      'The Shell component is required when Header, Sidebar or Footer is selected. Use --layout-mode content-only to generate no layout components.',
    );
  }

  return LAYOUT_COMPONENT_NAMES.filter((component) => uniqueComponents.has(component));
}

function createLayoutConfig(
  options: LayoutShellEvolutionOptions,
  components: readonly LayoutComponentName[],
): LayoutConfig {
  const hasHeader = components.includes('header');
  const hasSidebar = components.includes('sidebar');
  const hasFooter = components.includes('footer');

  assertComponentOption(
    hasHeader,
    options.layoutHeaderBehavior,
    DEFAULT_LAYOUT_HEADER_BEHAVIOR,
    '--layout-header-behavior',
    'Header',
  );
  assertComponentOption(
    hasSidebar,
    options.layoutSidebarMode,
    DEFAULT_LAYOUT_SIDEBAR_MODE,
    '--layout-sidebar-mode',
    'Sidebar',
  );
  assertComponentOption(
    hasSidebar,
    options.layoutSidebarPosition,
    DEFAULT_LAYOUT_SIDEBAR_POSITION,
    '--layout-sidebar-position',
    'Sidebar',
  );
  assertComponentOption(
    hasSidebar,
    options.layoutSidebarInitialState,
    DEFAULT_LAYOUT_SIDEBAR_INITIAL_STATE,
    '--layout-sidebar-initial-state',
    'Sidebar',
  );
  assertComponentOption(
    hasFooter,
    options.layoutFooterBehavior,
    DEFAULT_LAYOUT_FOOTER_BEHAVIOR,
    '--layout-footer-behavior',
    'Footer',
  );

  const headerBehavior = options.layoutHeaderBehavior ?? DEFAULT_LAYOUT_HEADER_BEHAVIOR;
  const sidebarMode = options.layoutSidebarMode ?? DEFAULT_LAYOUT_SIDEBAR_MODE;
  const sidebarPosition = options.layoutSidebarPosition ?? DEFAULT_LAYOUT_SIDEBAR_POSITION;
  const sidebarInitialState =
    options.layoutSidebarInitialState ?? DEFAULT_LAYOUT_SIDEBAR_INITIAL_STATE;
  const footerBehavior = options.layoutFooterBehavior ?? DEFAULT_LAYOUT_FOOTER_BEHAVIOR;
  const contentWidth = options.layoutContentWidth ?? DEFAULT_LAYOUT_CONTENT_WIDTH;

  assertSupportedValue(headerBehavior, LAYOUT_REGION_BEHAVIORS, 'Header behavior');
  assertSupportedValue(sidebarMode, LAYOUT_SIDEBAR_MODES, 'Sidebar mode');
  assertSupportedValue(sidebarPosition, LAYOUT_SIDEBAR_POSITIONS, 'Sidebar position');
  assertSupportedValue(sidebarInitialState, LAYOUT_SIDEBAR_INITIAL_STATES, 'Sidebar initial state');
  assertSupportedValue(footerBehavior, LAYOUT_REGION_BEHAVIORS, 'Footer behavior');
  assertSupportedValue(contentWidth, LAYOUT_CONTENT_WIDTHS, 'content width');

  if (
    hasSidebar &&
    sidebarMode !== 'collapsible' &&
    options.layoutSidebarInitialState !== undefined &&
    options.layoutSidebarInitialState !== DEFAULT_LAYOUT_SIDEBAR_INITIAL_STATE
  ) {
    throw new SchematicsException(
      '--layout-sidebar-initial-state can be used only with --layout-sidebar-mode collapsible.',
    );
  }

  return {
    ...(hasHeader ? { header: { behavior: headerBehavior } } : {}),
    ...(hasSidebar
      ? {
          sidebar: {
            mode: sidebarMode,
            position: sidebarPosition,
            initialState: sidebarInitialState,
          },
        }
      : {}),
    ...(hasFooter ? { footer: { behavior: footerBehavior } } : {}),
    content: { width: contentWidth },
  };
}

function assertContentOnlyOptions(options: LayoutShellEvolutionOptions): void {
  const unsupportedFlags = [
    ['--layout-components', options.layoutComponents],
    [
      '--layout-header-behavior',
      options.layoutHeaderBehavior === DEFAULT_LAYOUT_HEADER_BEHAVIOR
        ? undefined
        : options.layoutHeaderBehavior,
    ],
    [
      '--layout-sidebar-mode',
      options.layoutSidebarMode === DEFAULT_LAYOUT_SIDEBAR_MODE
        ? undefined
        : options.layoutSidebarMode,
    ],
    [
      '--layout-sidebar-position',
      options.layoutSidebarPosition === DEFAULT_LAYOUT_SIDEBAR_POSITION
        ? undefined
        : options.layoutSidebarPosition,
    ],
    [
      '--layout-sidebar-initial-state',
      options.layoutSidebarInitialState === DEFAULT_LAYOUT_SIDEBAR_INITIAL_STATE
        ? undefined
        : options.layoutSidebarInitialState,
    ],
    [
      '--layout-footer-behavior',
      options.layoutFooterBehavior === DEFAULT_LAYOUT_FOOTER_BEHAVIOR
        ? undefined
        : options.layoutFooterBehavior,
    ],
    [
      '--layout-content-width',
      options.layoutContentWidth === DEFAULT_LAYOUT_CONTENT_WIDTH
        ? undefined
        : options.layoutContentWidth,
    ],
  ]
    .filter(([, value]) => value !== undefined)
    .map(([flag]) => flag);

  if (unsupportedFlags.length > 0) {
    throw new SchematicsException(
      `Layout behavior options are not available with --layout-mode content-only: ${unsupportedFlags.join(', ')}.`,
    );
  }
}

function assertComponentOption(
  componentSelected: boolean,
  value: string | undefined,
  defaultValue: string,
  flag: string,
  componentLabel: string,
): void {
  if (!componentSelected && value !== undefined && value !== defaultValue) {
    throw new SchematicsException(
      `${flag} requires the ${componentLabel} component to be selected.`,
    );
  }
}

function assertSupportedValue<TValue extends string>(
  value: string,
  supportedValues: readonly TValue[],
  label: string,
): asserts value is TValue {
  if (!supportedValues.includes(value as TValue)) {
    throw new SchematicsException(
      `Unsupported ${label}: ${value}. Supported values: ${supportedValues.join(', ')}.`,
    );
  }
}
