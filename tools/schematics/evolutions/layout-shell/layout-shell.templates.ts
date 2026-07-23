import {
  APP_PATH,
  APP_SPEC_PATH,
  APP_TEMPLATE_PATH,
  LAYOUT_CONFIG_PATH,
  LAYOUT_MODEL_PATH,
  type LayoutBaselineFile,
} from './layout-shell.baseline';
import {
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
  return `export type LayoutRegionBehavior = 'flow' | 'sticky';
export type LayoutSidebarMode = 'persistent' | 'collapsible';
export type LayoutSidebarPosition = 'start' | 'end';
export type LayoutSidebarInitialState = 'expanded' | 'collapsed';
export type LayoutContentWidth = 'fluid' | 'contained';

export interface LayoutHeaderConfig {
  readonly behavior: LayoutRegionBehavior;
  readonly title: string;
}

export interface LayoutSidebarConfig {
  readonly mode: LayoutSidebarMode;
  readonly position: LayoutSidebarPosition;
  readonly initialState: LayoutSidebarInitialState;
  readonly label: string;
  readonly expandLabel: string;
  readonly collapseLabel: string;
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
  const angularCoreImports = hasSidebar
    ? 'ChangeDetectionStrategy, Component, inject, signal'
    : 'ChangeDetectionStrategy, Component, inject';
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
  const sidebarAttributes = hasSidebar
    ? `
  [attr.data-sidebar-position]="config.sidebar?.position"
  [attr.data-sidebar-collapsed]="sidebarCollapsed()"`
    : '';

  return [
    {
      path: '/src/app/layout/shell/shell.ts',
      content: `import { ${angularCoreImports} } from '@angular/core';
import { RouterOutlet } from '@angular/router';
${componentImports.length > 0 ? `${componentImports.join('\n')}\n` : ''}
import { LAYOUT_CONFIG } from '../layout.config';

@Component({
  selector: 'app-shell',
  imports: [${angularImports.join(', ')}],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly config = inject(LAYOUT_CONFIG);
${sidebarState}}
`,
    },
    {
      path: '/src/app/layout/shell/shell.html',
      content: `<div
  class="layout-shell"
  [attr.data-content-width]="config.content.width"${sidebarAttributes}
>
${hasHeader ? '  <app-header></app-header>\n' : ''}${
        hasSidebar
          ? `  <app-sidebar
    [collapsed]="sidebarCollapsed()"
    (collapsedChange)="setSidebarCollapsed($event)"
  ></app-sidebar>
`
          : ''
      }  <main class="layout-shell__main">
    <div class="layout-shell__content">
      <router-outlet></router-outlet>
    </div>
  </main>
${hasFooter ? '  <app-footer></app-footer>\n' : ''}</div>
`,
    },
    {
      path: '/src/app/layout/shell/shell.scss',
      content: `:host {
  --layout-header-height: 4rem;
  --layout-sidebar-width: 18rem;
  --layout-sidebar-collapsed-width: 4rem;
  --layout-content-max-width: 90rem;
  --layout-inline-padding: 1.5rem;
  --layout-block-padding: 1.5rem;
  --layout-sticky-z-index: 20;
  --layout-motion-duration: 180ms;
  --layout-region-border-color: color-mix(in srgb, currentColor 18%, transparent);
  --layout-viewport-min-block-size: 100dvh;

  container-name: layout-shell;
  container-type: inline-size;
  display: block;
  min-block-size: var(--layout-viewport-min-block-size);
}

.layout-shell {
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

@container layout-shell (width <= 64rem) {
  .layout-shell[data-sidebar-position] {
    grid-template-areas:
      'header'
      'sidebar'
      'main'
      'footer';
    grid-template-columns: minmax(0, 1fr);
  }

  .layout-shell[data-sidebar-position] app-sidebar {
    border-inline: 0;
    border-block-end: 1px solid var(--layout-region-border-color);
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
    content: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

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
  protected readonly config = inject(LAYOUT_CONFIG);
}
`,
  },
  {
    path: '/src/app/layout/header/header.html',
    content: `<header class="layout-header">
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

.layout-header__title {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`,
  },
];

const SIDEBAR_FILES: readonly LayoutBaselineFile[] = [
  {
    path: '/src/app/layout/sidebar/sidebar.ts',
    content: `import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

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
  },
})
export class SidebarComponent {
  readonly collapsed = input(false);
  readonly collapsedChange = output<boolean>();

  protected readonly config = inject(LAYOUT_CONFIG);

  protected toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed());
  }
}
`,
  },
  {
    path: '/src/app/layout/sidebar/sidebar.html',
    content: `@if (config.sidebar; as sidebar) {
  <aside class="layout-sidebar">
    @if (sidebar.mode === 'collapsible') {
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
      [hidden]="collapsed()"
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

.layout-sidebar__toggle {
  align-self: flex-start;
  min-inline-size: 2.75rem;
  min-block-size: 2.75rem;
  font: inherit;
}

.layout-sidebar__label {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:host([data-collapsed='true']) .layout-sidebar {
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
