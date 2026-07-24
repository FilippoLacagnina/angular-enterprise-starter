import { createLayoutShellCatalog } from './layout-shell-catalog.factory';

export const LAYOUT_SHELL_CATALOG_SCHEMA_VERSION = 1 as const;

export type LayoutShellMode = 'all' | 'select' | 'content-only';
export type LayoutShellComponentName = 'shell' | 'header' | 'sidebar' | 'footer';
export type LayoutShellRegionBehavior = 'flow' | 'sticky';
export type LayoutShellSidebarMode = 'persistent' | 'collapsible';
export type LayoutShellSidebarPosition = 'start' | 'end';
export type LayoutShellSidebarInitialState = 'expanded' | 'collapsed';
export type LayoutShellContentWidth = 'fluid' | 'contained';

export type LayoutShellCatalogOptionId =
  | 'layoutMode'
  | 'layoutComponents'
  | 'layoutHeaderBehavior'
  | 'layoutSidebarMode'
  | 'layoutSidebarPosition'
  | 'layoutSidebarInitialState'
  | 'layoutFooterBehavior'
  | 'layoutContentWidth';

export type LayoutShellCatalogValue =
  | LayoutShellMode
  | LayoutShellComponentName
  | LayoutShellRegionBehavior
  | LayoutShellSidebarMode
  | LayoutShellSidebarPosition
  | LayoutShellSidebarInitialState
  | LayoutShellContentWidth;

export type LayoutShellCatalogCondition =
  | {
      readonly kind: 'option-equals';
      readonly optionId: LayoutShellCatalogOptionId;
      readonly value: LayoutShellCatalogValue;
    }
  | {
      readonly kind: 'component-selected';
      readonly componentId: LayoutShellComponentName;
    }
  | {
      readonly kind: 'all';
      readonly conditions: readonly LayoutShellCatalogCondition[];
    };

export interface LayoutShellCatalogChoice {
  readonly value: LayoutShellCatalogValue;
  readonly label: string;
  readonly description: string;
  readonly order: number;
}

export interface LayoutShellCatalogMode extends LayoutShellCatalogChoice {
  readonly value: LayoutShellMode;
}

export interface LayoutShellCatalogComponent extends LayoutShellCatalogChoice {
  readonly value: LayoutShellComponentName;
}

export interface LayoutShellCatalogOption {
  readonly id: LayoutShellCatalogOptionId;
  readonly cliFlag: string;
  readonly description: string;
  readonly type: 'string' | 'string-list';
  readonly defaultValue: LayoutShellCatalogValue | readonly LayoutShellComponentName[];
  readonly values: readonly LayoutShellCatalogChoice[];
  readonly order: number;
  readonly multiple?: true;
  readonly separator?: ',';
  readonly visibleWhen?: LayoutShellCatalogCondition;
  readonly applicableWhen?: LayoutShellCatalogCondition;
  readonly dependsOn: readonly LayoutShellCatalogOptionId[];
}

export interface LayoutShellCatalog {
  readonly schemaVersion: typeof LAYOUT_SHELL_CATALOG_SCHEMA_VERSION;
  readonly renderContractHash: string;
  readonly evolution: {
    readonly id: 'layout-shell';
    readonly name: 'Layout Shell';
  };
  readonly defaults: {
    readonly mode: LayoutShellMode;
    readonly components: readonly LayoutShellComponentName[];
    readonly headerBehavior: LayoutShellRegionBehavior;
    readonly sidebarMode: LayoutShellSidebarMode;
    readonly sidebarPosition: LayoutShellSidebarPosition;
    readonly sidebarInitialState: LayoutShellSidebarInitialState;
    readonly footerBehavior: LayoutShellRegionBehavior;
    readonly contentWidth: LayoutShellContentWidth;
  };
  readonly modes: readonly LayoutShellCatalogMode[];
  readonly components: readonly LayoutShellCatalogComponent[];
  readonly requiredComponents: {
    readonly select: readonly ['shell'];
  };
  readonly options: readonly LayoutShellCatalogOption[];
  readonly contentOnly: {
    readonly mode: 'content-only';
    readonly components: readonly [];
    readonly allowedOptionIds: readonly ['layoutMode'];
    readonly rejectsAdditionalOptions: true;
    readonly renderingStrategy: 'direct-content';
  };
  readonly responsive: {
    readonly breakpoint: '64rem';
    readonly compactNavigation: 'drawer';
    readonly requiresComponents: readonly ['header', 'sidebar'];
    readonly initialOpen: false;
    readonly positions: readonly ['start', 'end'];
    readonly closeTriggers: readonly ['button', 'backdrop', 'escape', 'navigation-end'];
    readonly sidebarWithoutHeader: 'stacked';
  };
}

export const layoutShellCatalog: LayoutShellCatalog = createLayoutShellCatalog();

export default layoutShellCatalog;
