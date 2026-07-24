import {
  APP_PATH,
  APP_SPEC_PATH,
  APP_TEMPLATE_PATH,
  LAYOUT_CONFIG_PATH,
  LAYOUT_MODEL_PATH,
  type LayoutBaselineFile,
} from './layout-shell.baseline';
import {
  LAYOUT_COMPACT_BREAKPOINT_REM,
  type LayoutComponentName,
  type LayoutConfig,
  type LayoutShellInstallPlan,
} from './layout-shell.model';

export interface LayoutGeneratedFile {
  readonly path: string;
  readonly content: string;
}

export function createLayoutShellGeneratedFiles(
  plan: LayoutShellInstallPlan,
): readonly LayoutGeneratedFile[] {
  if (!plan.config) {
    return [];
  }

  return [
    {
      path: LAYOUT_MODEL_PATH,
      content: createLayoutModelContent(),
    },
    {
      path: LAYOUT_CONFIG_PATH,
      content: createLayoutConfigContent(plan.config),
    },
    ...plan.components.flatMap((component) => createComponentFiles(component, plan)),
  ];
}

export function createContentOnlyAppFiles(includeSpec: boolean): readonly LayoutGeneratedFile[] {
  return [
    {
      path: APP_PATH,
      content: `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
`,
    },
    {
      path: APP_TEMPLATE_PATH,
      content: '<router-outlet></router-outlet>\n',
    },
    ...(includeSpec
      ? [
          {
            path: APP_SPEC_PATH,
            content: `import { TestBed } from '@angular/core/testing';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the application router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
`,
          },
        ]
      : []),
  ];
}

function createComponentFiles(
  component: LayoutComponentName,
  plan: LayoutShellInstallPlan,
): readonly LayoutGeneratedFile[] {
  switch (component) {
    case 'shell':
      return createShellFiles(plan);
    case 'header':
      return HEADER_FILES;
    case 'sidebar':
      return SIDEBAR_FILES;
    case 'footer':
      return FOOTER_FILES;
  }
}

function createLayoutModelContent(): string {
  return `export const LAYOUT_COMPACT_BREAKPOINT_REM = ${LAYOUT_COMPACT_BREAKPOINT_REM} as const;

export type LayoutRegionBehavior = 'flow' | 'sticky';
export type LayoutSidebarMode = 'persistent' | 'collapsible';
export type LayoutSidebarPosition = 'start' | 'end';
export type LayoutSidebarInitialState = 'expanded' | 'collapsed';
export type LayoutContentWidth = 'fluid' | 'contained';

export interface LayoutHeaderConfig {
  readonly behavior: LayoutRegionBehavior;
  readonly title: string;
  readonly menuLabel: string;
}

export interface LayoutSidebarConfig {
  readonly mode: LayoutSidebarMode;
  readonly position: LayoutSidebarPosition;
  readonly initialState: LayoutSidebarInitialState;
  readonly label: string;
  readonly expandLabel: string;
  readonly collapseLabel: string;
  readonly drawerCloseLabel: string;
}

export interface LayoutFooterConfig {
  readonly behavior: LayoutRegionBehavior;
  readonly text: string;
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
`;
}

function createLayoutConfigContent(config: LayoutConfig): string {
  const sections = [
    ...(config.header
      ? [
          `  header: {
    behavior: '${config.header.behavior}',
    title: 'Header',
    menuLabel: 'Toggle navigation',
  },`,
        ]
      : []),
    ...(config.sidebar
      ? [
          `  sidebar: {
    mode: '${config.sidebar.mode}',
    position: '${config.sidebar.position}',
    initialState: '${config.sidebar.initialState}',
    label: 'Sidebar',
    expandLabel: 'Expand navigation',
    collapseLabel: 'Collapse navigation',
    drawerCloseLabel: 'Close navigation',
  },`,
        ]
      : []),
    ...(config.footer
      ? [
          `  footer: {
    behavior: '${config.footer.behavior}',
    text: 'Footer',
  },`,
        ]
      : []),
    `  content: {
    width: '${config.content.width}',
  },`,
  ];

  return `import { InjectionToken } from '@angular/core';

import { type LayoutConfig } from './layout.model';

export const DEFAULT_LAYOUT_CONFIG = {
${sections.join('\n')}
} as const satisfies LayoutConfig;

export const LAYOUT_CONFIG = new InjectionToken<LayoutConfig>('LAYOUT_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_LAYOUT_CONFIG,
});
`;
}

function createShellFiles(plan: LayoutShellInstallPlan): readonly LayoutGeneratedFile[] {
  const hasHeader = plan.components.includes('header');
  const hasSidebar = plan.components.includes('sidebar');
  const hasFooter = plan.components.includes('footer');
  const hasCompactDrawer = hasHeader && hasSidebar;
  const angularCoreImport = hasCompactDrawer
    ? `import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';`
    : hasSidebar
      ? `import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';`
      : `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';`;
  const routerImports = hasCompactDrawer ? 'NavigationEnd, Router, RouterOutlet' : 'RouterOutlet';
  const componentImports = [
    ...(hasFooter ? ["import { FooterComponent } from '@layout/footer/footer';"] : []),
    ...(hasHeader ? ["import { HeaderComponent } from '@layout/header/header';"] : []),
    ...(hasSidebar ? ["import { SidebarComponent } from '@layout/sidebar/sidebar';"] : []),
  ];
  const angularImports = [
    'RouterOutlet',
    ...(hasHeader ? ['HeaderComponent'] : []),
    ...(hasSidebar ? ['SidebarComponent'] : []),
    ...(hasFooter ? ['FooterComponent'] : []),
  ];
  const sidebarState = hasSidebar
    ? `
  protected readonly sidebarCollapsed = signal(
    this.config.sidebar?.mode === 'collapsible' && this.config.sidebar.initialState === 'collapsed',
  );

  protected setSidebarCollapsed(collapsed: boolean): void {
    if (this.config.sidebar?.mode === 'collapsible') {
      this.sidebarCollapsed.set(collapsed);
    }
  }
`
    : '';
  const compactDrawerState = hasCompactDrawer
    ? `
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly shellElement = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly header = viewChild(HeaderComponent);
  private readonly sidebar = viewChild(SidebarComponent);

  protected readonly compactViewport = signal(false);
  protected readonly compactSidebarOpen = signal(false);

  constructor() {
    afterNextRender(() => this.observeContainer(), { injector: this.injector });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.closeCompactSidebar(false));
  }

  protected toggleCompactSidebar(): void {
    if (!this.compactViewport()) {
      return;
    }

    const open = !this.compactSidebarOpen();
    this.compactSidebarOpen.set(open);

    if (open) {
      afterNextRender(() => this.sidebar()?.focusDrawerClose(), { injector: this.injector });
    }
  }

  protected closeCompactSidebar(restoreFocus = true): void {
    if (!this.compactSidebarOpen()) {
      return;
    }

    this.compactSidebarOpen.set(false);

    if (restoreFocus) {
      afterNextRender(() => this.header()?.focusMenuToggle(), { injector: this.injector });
    }
  }

  private observeContainer(): void {
    const ResizeObserverConstructor = globalThis.ResizeObserver;

    if (!ResizeObserverConstructor) {
      return;
    }

    const updateCompactViewport = (inlineSize: number): void => {
      const rootFontSize =
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const compact = inlineSize <= LAYOUT_COMPACT_BREAKPOINT_REM * rootFontSize;

      if (compact === this.compactViewport()) {
        return;
      }

      this.compactViewport.set(compact);
      this.compactSidebarOpen.set(false);
    };
    const initialInlineSize = this.shellElement.nativeElement.getBoundingClientRect().width;

    if (initialInlineSize > 0) {
      updateCompactViewport(initialInlineSize);
    }

    const resizeObserver = new ResizeObserverConstructor(([entry]) => {
      if (entry) {
        updateCompactViewport(entry.contentRect.width);
      }
    });

    resizeObserver.observe(this.shellElement.nativeElement);
    this.destroyRef.onDestroy(() => resizeObserver.disconnect());
  }
`
    : '';
  const sidebarAttributes = hasSidebar
    ? `
  [attr.data-sidebar-position]="config.sidebar?.position"
  [attr.data-sidebar-collapsed]="sidebarCollapsed()"`
    : '';
  const compactDrawerAttributes = hasCompactDrawer
    ? `
  data-responsive-drawer="true"
  [attr.data-compact-viewport]="compactViewport()"
  [attr.data-sidebar-open]="compactSidebarOpen()"`
    : '';
  const decoratorHost = hasCompactDrawer
    ? `
  host: {
    '(document:keydown.escape)': 'closeCompactSidebar()',
  },`
    : '';
  const compactDrawerImports = hasCompactDrawer
    ? `import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
`
    : '';
  const compactBreakpointImport = hasCompactDrawer
    ? `import { LAYOUT_COMPACT_BREAKPOINT_REM } from '../layout.model';
`
    : '';
  const headerTemplate = hasHeader
    ? hasCompactDrawer
      ? `  <app-header
    [attr.inert]="compactSidebarOpen() ? '' : null"
    [menuAvailable]="compactViewport()"
    [menuExpanded]="compactSidebarOpen()"
    menuControls="application-sidebar"
    (menuToggle)="toggleCompactSidebar()"
  ></app-header>
`
      : '  <app-header></app-header>\n'
    : '';
  const mainTemplateOpening = hasCompactDrawer
    ? `  <main
    class="layout-shell__main"
    [attr.inert]="compactSidebarOpen() ? '' : null"
  >`
    : '  <main class="layout-shell__main">';
  const sidebarTemplate = hasSidebar
    ? hasCompactDrawer
      ? `  @if (compactViewport() && compactSidebarOpen()) {
    <button
      class="layout-shell__backdrop"
      type="button"
      tabindex="-1"
      [attr.aria-label]="config.sidebar?.drawerCloseLabel"
      (click)="closeCompactSidebar()"
    ></button>
  }

  <app-sidebar
    id="application-sidebar"
    [collapsed]="sidebarCollapsed()"
    [drawerMode]="compactViewport()"
    [drawerOpen]="compactSidebarOpen()"
    (collapsedChange)="setSidebarCollapsed($event)"
    (drawerClose)="closeCompactSidebar()"
  ></app-sidebar>
`
      : `  <app-sidebar
    [collapsed]="sidebarCollapsed()"
    (collapsedChange)="setSidebarCollapsed($event)"
  ></app-sidebar>
`
    : '';

  return [
    {
      path: '/src/app/layout/shell/shell.ts',
      content: `${angularCoreImport}
${compactDrawerImports}import { ${routerImports} } from '@angular/router';
${hasCompactDrawer ? "import { filter } from 'rxjs';\n" : ''}${componentImports.length > 0 ? `${componentImports.join('\n')}\n` : ''}
import { LAYOUT_CONFIG } from '../layout.config';
${compactBreakpointImport}@Component({
  selector: 'app-shell',
  imports: [${angularImports.join(', ')}],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,${decoratorHost}
})
export class ShellComponent {
  protected readonly config = inject(LAYOUT_CONFIG);
${sidebarState}${compactDrawerState}}
`,
    },
    {
      path: '/src/app/layout/shell/shell.html',
      content: `<div
  class="layout-shell"
  [attr.data-content-width]="config.content.width"${sidebarAttributes}${compactDrawerAttributes}
>
${headerTemplate}${sidebarTemplate}${mainTemplateOpening}
    <div class="layout-shell__content">
      <router-outlet></router-outlet>
    </div>
  </main>
${
  hasFooter
    ? hasCompactDrawer
      ? `  <app-footer [attr.inert]="compactSidebarOpen() ? '' : null"></app-footer>
`
      : '  <app-footer></app-footer>\n'
    : ''
}</div>
`,
    },
    {
      path: '/src/app/layout/shell/shell.scss',
      content: `:host {
  --layout-header-height: 4rem;
  --layout-sidebar-expanded-width: 18rem;
  --layout-sidebar-width: var(--layout-sidebar-expanded-width);
  --layout-sidebar-collapsed-width: 4rem;
  --layout-content-max-width: 90rem;
  --layout-inline-padding: 1.5rem;
  --layout-block-padding: 1.5rem;
  --layout-sticky-z-index: 20;
  --layout-motion-duration: 180ms;
  --layout-region-border-color: color-mix(in srgb, currentColor 18%, transparent);
  --layout-region-background: Canvas;
  --layout-drawer-backdrop-color: rgb(0 0 0 / 45%);
  --layout-drawer-shadow: 0 1rem 2.5rem rgb(0 0 0 / 25%);
  --layout-drawer-z-index: 40;
  --layout-viewport-min-block-size: 100dvh;

  container-name: layout-shell;
  container-type: inline-size;
  display: block;
  min-block-size: var(--layout-viewport-min-block-size);
}

.layout-shell {
  position: relative;
  display: grid;
  grid-template-areas:
    'header'
    'main'
    'footer';
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-block-size: var(--layout-viewport-min-block-size);
}

.layout-shell[data-sidebar-position='start'] {
  grid-template-areas:
    'header header'
    'sidebar main'
    'footer footer';
  grid-template-columns: var(--layout-sidebar-width) minmax(0, 1fr);
}

.layout-shell[data-sidebar-position='start'] app-sidebar {
  border-inline-end: 1px solid var(--layout-region-border-color);
}

.layout-shell[data-sidebar-position='end'] {
  grid-template-areas:
    'header header'
    'main sidebar'
    'footer footer';
  grid-template-columns: minmax(0, 1fr) var(--layout-sidebar-width);
}

.layout-shell[data-sidebar-position='end'] app-sidebar {
  border-inline-start: 1px solid var(--layout-region-border-color);
}

.layout-shell[data-sidebar-collapsed='true'] {
  --layout-sidebar-width: var(--layout-sidebar-collapsed-width);
}

app-header {
  border-block-end: 1px solid var(--layout-region-border-color);
}

app-footer {
  border-block-start: 1px solid var(--layout-region-border-color);
}

.layout-shell__main {
  grid-area: main;
  min-inline-size: 0;
  padding: var(--layout-block-padding) var(--layout-inline-padding);
}

.layout-shell__content {
  inline-size: 100%;
}

.layout-shell[data-content-width='contained'] .layout-shell__content {
  max-inline-size: var(--layout-content-max-width);
  margin-inline: auto;
}

@container layout-shell (width <= ${LAYOUT_COMPACT_BREAKPOINT_REM}rem) {
  .layout-shell[data-sidebar-position]:not([data-responsive-drawer='true']) {
    grid-template-areas:
      'header'
      'sidebar'
      'main'
      'footer';
    grid-template-columns: minmax(0, 1fr);
  }

  .layout-shell[data-sidebar-position]:not([data-responsive-drawer='true']) app-sidebar {
    border-inline: 0;
    border-block-end: 1px solid var(--layout-region-border-color);
  }

  .layout-shell[data-responsive-drawer='true'][data-sidebar-position] {
    grid-template-areas:
      'header'
      'main'
      'footer';
    grid-template-columns: minmax(0, 1fr);
  }

  .layout-shell[data-responsive-drawer='true'] app-sidebar {
    position: absolute;
    z-index: var(--layout-drawer-z-index);
    inset-block: 0;
    inline-size: min(var(--layout-sidebar-expanded-width), calc(100% - 3rem));
    overflow: auto;
    visibility: hidden;
    background: var(--layout-region-background);
    box-shadow: var(--layout-drawer-shadow);
    pointer-events: none;
    transition:
      transform var(--layout-motion-duration) ease,
      visibility 0s linear var(--layout-motion-duration);
  }

  .layout-shell[data-responsive-drawer='true'][data-sidebar-position='start'] app-sidebar {
    inset-inline-start: 0;
    border-inline: 0;
    transform: translateX(-100%);
  }

  .layout-shell[data-responsive-drawer='true'][data-sidebar-position='end'] app-sidebar {
    inset-inline-end: 0;
    border-inline: 0;
    transform: translateX(100%);
  }

  .layout-shell:dir(rtl)[data-responsive-drawer='true'][data-sidebar-position='start'] app-sidebar {
    transform: translateX(100%);
  }

  .layout-shell:dir(rtl)[data-responsive-drawer='true'][data-sidebar-position='end'] app-sidebar {
    transform: translateX(-100%);
  }

  .layout-shell[data-responsive-drawer='true'][data-sidebar-open='true'] app-sidebar {
    visibility: visible;
    pointer-events: auto;
    transform: translateX(0);
    transition-delay: 0s;
  }

  .layout-shell__backdrop {
    position: absolute;
    z-index: calc(var(--layout-drawer-z-index) - 1);
    inset: 0;
    border: 0;
    background: var(--layout-drawer-backdrop-color);
    cursor: pointer;
  }
}

@media (prefers-reduced-motion: reduce) {
  :host {
    --layout-motion-duration: 0ms;
  }
}
`,
    },
  ];
}

const HEADER_FILES: readonly LayoutBaselineFile[] = [
  {
    path: '/src/app/layout/header/header.ts',
    content: `import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { LAYOUT_CONFIG } from '../layout.config';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-behavior]': 'config.header?.behavior',
  },
})
export class HeaderComponent {
  readonly menuAvailable = input(false);
  readonly menuExpanded = input(false);
  readonly menuControls = input('application-sidebar');
  readonly menuToggle = output<void>();

  protected readonly config = inject(LAYOUT_CONFIG);
  private readonly menuToggleButton = viewChild<ElementRef<HTMLButtonElement>>('menuToggleButton');

  focusMenuToggle(): void {
    this.menuToggleButton()?.nativeElement.focus();
  }
}
`,
  },
  {
    path: '/src/app/layout/header/header.html',
    content: `<header class="layout-header">
  @if (menuAvailable()) {
    <button
      #menuToggleButton
      class="layout-header__menu-toggle"
      type="button"
      [attr.aria-controls]="menuControls()"
      [attr.aria-expanded]="menuExpanded()"
      [attr.aria-label]="config.header?.menuLabel"
      [attr.title]="config.header?.menuLabel"
      (click)="menuToggle.emit()"
    >
      <span
        class="layout-header__menu-icon"
        aria-hidden="true"
      >
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>
  }

  <span class="layout-header__title">{{ config.header?.title }}</span>
</header>
`,
  },
  {
    path: '/src/app/layout/header/header.scss',
    content: `:host {
  display: block;
  grid-area: header;
}

:host([data-behavior='sticky']) {
  position: sticky;
  inset-block-start: 0;
  z-index: var(--layout-sticky-z-index);
}

.layout-header {
  display: flex;
  align-items: center;
  min-block-size: var(--layout-header-height);
  padding-inline: var(--layout-inline-padding);
}

.layout-header__menu-toggle {
  display: none;
  flex: 0 0 auto;
  place-items: center;
  inline-size: 2.75rem;
  block-size: 2.75rem;
  padding: 0.625rem;
  border: 1px solid var(--layout-region-border-color);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.layout-header__menu-icon {
  display: grid;
  gap: 0.25rem;
  inline-size: 100%;
}

.layout-header__menu-icon span {
  display: block;
  block-size: 0.125rem;
  background: currentColor;
}

.layout-header__title {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@container layout-shell (width <= ${LAYOUT_COMPACT_BREAKPOINT_REM}rem) {
  .layout-header {
    gap: 0.75rem;
  }

  .layout-header__menu-toggle {
    display: grid;
  }
}
`,
  },
];

const SIDEBAR_FILES: readonly LayoutBaselineFile[] = [
  {
    path: '/src/app/layout/sidebar/sidebar.ts',
    content: `import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { LAYOUT_CONFIG } from '../layout.config';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-mode]': 'config.sidebar?.mode',
    '[attr.data-collapsed]': 'collapsed()',
    '[attr.data-drawer-mode]': 'drawerMode()',
    '[attr.data-drawer-open]': 'drawerOpen()',
  },
})
export class SidebarComponent {
  readonly collapsed = input(false);
  readonly drawerMode = input(false);
  readonly drawerOpen = input(false);
  readonly collapsedChange = output<boolean>();
  readonly drawerClose = output<void>();

  protected readonly config = inject(LAYOUT_CONFIG);
  private readonly drawerCloseButton =
    viewChild<ElementRef<HTMLButtonElement>>('drawerCloseButton');

  protected toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed());
  }

  focusDrawerClose(): void {
    this.drawerCloseButton()?.nativeElement.focus();
  }
}
`,
  },
  {
    path: '/src/app/layout/sidebar/sidebar.html',
    content: `@if (config.sidebar; as sidebar) {
  <aside
    class="layout-sidebar"
    [attr.aria-hidden]="drawerMode() && !drawerOpen() ? 'true' : null"
    [attr.aria-label]="sidebar.label"
    [attr.aria-modal]="drawerMode() ? 'true' : null"
    [attr.inert]="drawerMode() && !drawerOpen() ? '' : null"
    [attr.role]="drawerMode() ? 'dialog' : null"
  >
    @if (drawerMode()) {
      <button
        #drawerCloseButton
        class="layout-sidebar__drawer-close"
        type="button"
        [attr.aria-label]="sidebar.drawerCloseLabel"
        [attr.title]="sidebar.drawerCloseLabel"
        (click)="drawerClose.emit()"
      >
        <span aria-hidden="true">×</span>
      </button>
    } @else if (sidebar.mode === 'collapsible') {
      <button
        class="layout-sidebar__toggle"
        type="button"
        aria-controls="application-sidebar-content"
        [attr.aria-expanded]="!collapsed()"
        [attr.aria-label]="collapsed() ? sidebar.expandLabel : sidebar.collapseLabel"
        [attr.title]="collapsed() ? sidebar.expandLabel : sidebar.collapseLabel"
        (click)="toggleCollapsed()"
      >
        <span aria-hidden="true">{{ collapsed() ? '+' : '−' }}</span>
      </button>
    }

    <span
      id="application-sidebar-content"
      class="layout-sidebar__label"
      [hidden]="collapsed() && !drawerMode()"
    >
      {{ sidebar.label }}
    </span>
  </aside>
}
`,
  },
  {
    path: '/src/app/layout/sidebar/sidebar.scss',
    content: `:host {
  display: block;
  grid-area: sidebar;
  min-inline-size: 0;
  transition: inline-size var(--layout-motion-duration) ease;
}

.layout-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  block-size: 100%;
  padding: var(--layout-block-padding) var(--layout-inline-padding);
}

.layout-sidebar__toggle,
.layout-sidebar__drawer-close {
  align-self: flex-start;
  min-inline-size: 2.75rem;
  min-block-size: 2.75rem;
  border: 1px solid var(--layout-region-border-color);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.layout-sidebar__drawer-close {
  align-self: flex-end;
}

.layout-sidebar__label {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:host([data-collapsed='true']:not([data-drawer-mode='true'])) .layout-sidebar {
  padding-inline: 0.5rem;
}

@container layout-shell (width <= 64rem) {
  :host {
    inline-size: 100%;
  }
}
`,
  },
];

const FOOTER_FILES: readonly LayoutBaselineFile[] = [
  {
    path: '/src/app/layout/footer/footer.ts',
    content: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LAYOUT_CONFIG } from '../layout.config';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-behavior]': 'config.footer?.behavior',
  },
})
export class FooterComponent {
  protected readonly config = inject(LAYOUT_CONFIG);
}
`,
  },
  {
    path: '/src/app/layout/footer/footer.html',
    content: `<footer class="layout-footer">
  <small>{{ config.footer?.text }}</small>
</footer>
`,
  },
  {
    path: '/src/app/layout/footer/footer.scss',
    content: `:host {
  display: block;
  grid-area: footer;
}

:host([data-behavior='sticky']) {
  position: sticky;
  inset-block-end: 0;
  z-index: var(--layout-sticky-z-index);
}

.layout-footer {
  display: flex;
  align-items: center;
  min-block-size: 3rem;
  padding-inline: var(--layout-inline-padding);
}
`,
  },
];
