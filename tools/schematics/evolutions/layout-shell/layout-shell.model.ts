export const LAYOUT_COMPONENT_NAMES = ['shell', 'header', 'sidebar', 'footer'] as const;
export const LAYOUT_MODES = ['all', 'select', 'content-only'] as const;
export const LAYOUT_REGION_BEHAVIORS = ['flow', 'sticky'] as const;
export const LAYOUT_SIDEBAR_MODES = ['persistent', 'collapsible'] as const;
export const LAYOUT_SIDEBAR_POSITIONS = ['start', 'end'] as const;
export const LAYOUT_SIDEBAR_INITIAL_STATES = ['expanded', 'collapsed'] as const;
export const LAYOUT_CONTENT_WIDTHS = ['fluid', 'contained'] as const;
export const LAYOUT_COMPACT_BREAKPOINT_REM = 64 as const;

export type LayoutComponentName = (typeof LAYOUT_COMPONENT_NAMES)[number];
export type LayoutMode = (typeof LAYOUT_MODES)[number];
export type LayoutRegionBehavior = (typeof LAYOUT_REGION_BEHAVIORS)[number];
export type LayoutSidebarMode = (typeof LAYOUT_SIDEBAR_MODES)[number];
export type LayoutSidebarPosition = (typeof LAYOUT_SIDEBAR_POSITIONS)[number];
export type LayoutSidebarInitialState = (typeof LAYOUT_SIDEBAR_INITIAL_STATES)[number];
export type LayoutContentWidth = (typeof LAYOUT_CONTENT_WIDTHS)[number];

export interface LayoutShellEvolutionOptions {
  readonly layoutMode?: LayoutMode;
  readonly layoutComponents?: string;
  readonly layoutHeaderBehavior?: LayoutRegionBehavior;
  readonly layoutSidebarMode?: LayoutSidebarMode;
  readonly layoutSidebarPosition?: LayoutSidebarPosition;
  readonly layoutSidebarInitialState?: LayoutSidebarInitialState;
  readonly layoutFooterBehavior?: LayoutRegionBehavior;
  readonly layoutContentWidth?: LayoutContentWidth;
}

export interface LayoutHeaderConfig {
  readonly behavior: LayoutRegionBehavior;
}

export interface LayoutSidebarConfig {
  readonly mode: LayoutSidebarMode;
  readonly position: LayoutSidebarPosition;
  readonly initialState: LayoutSidebarInitialState;
}

export interface LayoutFooterConfig {
  readonly behavior: LayoutRegionBehavior;
}

export interface LayoutContentConfig {
  readonly width: LayoutContentWidth;
}

export interface LayoutConfig {
  readonly header?: LayoutHeaderConfig;
  readonly sidebar?: LayoutSidebarConfig;
  readonly footer?: LayoutFooterConfig;
  readonly content: LayoutContentConfig;
}

export interface LayoutShellInstallPlan {
  readonly mode: LayoutMode;
  readonly components: readonly LayoutComponentName[];
  readonly config?: LayoutConfig;
}

export const DEFAULT_LAYOUT_MODE: LayoutMode = 'all';
export const DEFAULT_LAYOUT_HEADER_BEHAVIOR: LayoutRegionBehavior = 'sticky';
export const DEFAULT_LAYOUT_SIDEBAR_MODE: LayoutSidebarMode = 'persistent';
export const DEFAULT_LAYOUT_SIDEBAR_POSITION: LayoutSidebarPosition = 'start';
export const DEFAULT_LAYOUT_SIDEBAR_INITIAL_STATE: LayoutSidebarInitialState = 'expanded';
export const DEFAULT_LAYOUT_FOOTER_BEHAVIOR: LayoutRegionBehavior = 'flow';
export const DEFAULT_LAYOUT_CONTENT_WIDTH: LayoutContentWidth = 'fluid';
