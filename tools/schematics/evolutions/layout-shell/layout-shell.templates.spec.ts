import { format } from 'prettier';
import { describe, expect, it } from 'vitest';

import { APP_SPEC_PATH } from './layout-shell.baseline';
import { createLayoutShellInstallPlan } from './layout-shell.plan';
import {
  createContentOnlyAppFiles,
  createLayoutShellGeneratedFiles,
  type LayoutGeneratedFile,
} from './layout-shell.templates';

describe('Layout Shell generated templates', () => {
  it('keeps complete-layout files formatted', async () => {
    await expectFilesFormatted(createLayoutShellGeneratedFiles(createLayoutShellInstallPlan({})));
  });

  it('keeps Shell-only files formatted', async () => {
    await expectFilesFormatted(
      createLayoutShellGeneratedFiles(
        createLayoutShellInstallPlan({
          layoutMode: 'select',
          layoutComponents: 'shell',
        }),
      ),
    );
  });

  it('generates neutral regions and an accessible compact navigation drawer', () => {
    const files = createLayoutShellGeneratedFiles(createLayoutShellInstallPlan({}));
    const config = readGeneratedFile(files, '/src/app/layout/layout.config.ts');
    const model = readGeneratedFile(files, '/src/app/layout/layout.model.ts');
    const shellTypeScript = readGeneratedFile(files, '/src/app/layout/shell/shell.ts');
    const shellTemplate = readGeneratedFile(files, '/src/app/layout/shell/shell.html');
    const shellStyles = readGeneratedFile(files, '/src/app/layout/shell/shell.scss');
    const headerTemplate = readGeneratedFile(files, '/src/app/layout/header/header.html');
    const sidebarTypeScript = readGeneratedFile(files, '/src/app/layout/sidebar/sidebar.ts');
    const sidebarTemplate = readGeneratedFile(files, '/src/app/layout/sidebar/sidebar.html');
    const sidebarStyles = readGeneratedFile(files, '/src/app/layout/sidebar/sidebar.scss');

    expect(config).toContain("title: 'Header'");
    expect(config).toContain("menuLabel: 'Toggle navigation'");
    expect(config).toContain("label: 'Sidebar'");
    expect(config).toContain("drawerCloseLabel: 'Close navigation'");
    expect(config).toContain("text: 'Footer'");
    expect(config).not.toContain('Dashboard');
    expect(model).toContain('LAYOUT_COMPACT_BREAKPOINT_REM = 64');
    expect(model).not.toContain('LayoutNavigationItem');
    expect(sidebarTypeScript).not.toContain('RouterLink');
    expect(sidebarTemplate).toContain('{{ sidebar.label }}');
    expect(shellTypeScript).toContain('globalThis.ResizeObserver');
    expect(shellTypeScript).toContain('event instanceof NavigationEnd');
    expect(shellTypeScript).toContain('this.closeCompactSidebar(false)');
    expect(shellTypeScript).toContain("'(document:keydown.escape)': 'closeCompactSidebar()'");
    expect(shellTemplate).toContain('[menuAvailable]="compactViewport()"');
    expect(shellTemplate).toContain('[menuExpanded]="compactSidebarOpen()"');
    expect(
      shellTemplate.match(/\[attr\.inert\]="compactSidebarOpen\(\) \? '' : null"/g),
    ).toHaveLength(3);
    expect(shellTemplate).toContain('menuControls="application-sidebar"');
    expect(shellTemplate).toContain('(menuToggle)="toggleCompactSidebar()"');
    expect(shellTemplate).toContain('class="layout-shell__backdrop"');
    expect(shellTemplate).toContain('(drawerClose)="closeCompactSidebar()"');
    expect(headerTemplate).toContain('[attr.aria-controls]="menuControls()"');
    expect(headerTemplate).toContain('[attr.aria-expanded]="menuExpanded()"');
    expect(headerTemplate).toContain('[attr.aria-label]="config.header?.menuLabel"');
    expect(sidebarTemplate).toContain('[attr.aria-modal]="drawerMode() ? \'true\' : null"');
    expect(sidebarTemplate).toContain('[attr.inert]="drawerMode() && !drawerOpen() ? \'\' : null"');
    expect(sidebarTemplate).toContain('[attr.aria-label]="sidebar.drawerCloseLabel"');
    expect(sidebarStyles).toContain(
      ":host([data-collapsed='true']:not([data-drawer-mode='true']))",
    );
    expect(shellStyles).toContain('--layout-region-border-color');
    expect(shellStyles).toContain("data-sidebar-position='start'");
    expect(shellStyles).toContain("data-sidebar-position='end'");
    expect(shellStyles).toContain('--layout-viewport-min-block-size: 100dvh');
    expect(shellStyles).toContain('container-name: layout-shell');
    expect(shellStyles).toContain('container-type: inline-size');
    expect(shellStyles).toContain('@container layout-shell (width <= 64rem)');
    expect(shellStyles).not.toContain('@media (width <= 64rem)');
    expect(shellStyles).toContain("data-responsive-drawer='true'");
    expect(shellStyles).toContain("data-sidebar-open='true'");
    expect(shellStyles).toContain('transform: translateX(-100%)');
    expect(shellStyles).toContain('transform: translateX(100%)');
    expect(shellStyles).toContain('border-block-end');
  });

  it('keeps compact stacking when Sidebar is selected without Header', () => {
    const files = createLayoutShellGeneratedFiles(
      createLayoutShellInstallPlan({
        layoutMode: 'select',
        layoutComponents: 'shell,sidebar',
      }),
    );
    const shellTypeScript = readGeneratedFile(files, '/src/app/layout/shell/shell.ts');
    const shellTemplate = readGeneratedFile(files, '/src/app/layout/shell/shell.html');
    const shellStyles = readGeneratedFile(files, '/src/app/layout/shell/shell.scss');

    expect(shellTypeScript).not.toContain('ResizeObserver');
    expect(shellTypeScript).not.toContain('NavigationEnd');
    expect(shellTemplate).not.toContain('data-responsive-drawer');
    expect(shellTemplate).not.toContain('layout-shell__backdrop');
    expect(shellTemplate).not.toContain('[drawerMode]');
    expect(shellStyles).toContain(":not([data-responsive-drawer='true'])");
  });

  it('does not generate compact navigation orchestration without Sidebar', () => {
    const files = createLayoutShellGeneratedFiles(
      createLayoutShellInstallPlan({
        layoutMode: 'select',
        layoutComponents: 'shell,header',
      }),
    );
    const shellTypeScript = readGeneratedFile(files, '/src/app/layout/shell/shell.ts');
    const shellTemplate = readGeneratedFile(files, '/src/app/layout/shell/shell.html');

    expect(shellTypeScript).not.toContain('compactSidebarOpen');
    expect(shellTemplate).toContain('<app-header></app-header>');
    expect(shellTemplate).not.toContain('menuAvailable');
  });

  it('keeps content-only App files formatted with and without a specification', async () => {
    const withSpec = createContentOnlyAppFiles(true);
    const withoutSpec = createContentOnlyAppFiles(false);

    await expectFilesFormatted(withSpec);
    await expectFilesFormatted(withoutSpec);
    expect(withSpec.some((file) => file.path === APP_SPEC_PATH)).toBe(true);
    expect(withoutSpec.some((file) => file.path === APP_SPEC_PATH)).toBe(false);
  });
});

async function expectFilesFormatted(files: readonly LayoutGeneratedFile[]): Promise<void> {
  for (const file of files) {
    const parser = getPrettierParser(file.path);
    const formatted = await format(file.content, {
      arrowParens: 'always',
      bracketSpacing: true,
      parser,
      printWidth: 100,
      semi: true,
      singleAttributePerLine: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'all',
      useTabs: false,
    });

    expect(file.content, `${file.path} should be formatted`).toBe(formatted);
  }
}

function readGeneratedFile(files: readonly LayoutGeneratedFile[], path: string): string {
  const file = files.find((candidate) => candidate.path === path);

  expect(file, `${path} should be generated`).toBeDefined();

  return file?.content ?? '';
}

function getPrettierParser(path: string): 'angular' | 'scss' | 'typescript' {
  if (path.endsWith('.html')) {
    return 'angular';
  }

  if (path.endsWith('.scss')) {
    return 'scss';
  }

  return 'typescript';
}
