import { HostTree, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import { type EvolutionDefinition } from '../evolution-definition';
import {
  APP_BASELINE_FILES,
  APP_SPEC_BASELINE_FILE,
  LAYOUT_BASELINE_FILE_SETS,
  LAYOUT_CONFIG_PATH,
  LAYOUT_MODEL_PATH,
} from './layout-shell.baseline';
import { installLayoutShellEvolution } from './layout-shell.installer';

describe('Layout Shell evolution installer', () => {
  it('installs the complete configurable layout with neutral behavior', () => {
    const tree = createBaselineTree();

    install(tree, {});

    expect(tree.exists(LAYOUT_MODEL_PATH)).toBe(true);
    expect(tree.exists(LAYOUT_CONFIG_PATH)).toBe(true);
    expect(tree.readText(LAYOUT_CONFIG_PATH)).toContain("behavior: 'sticky'");
    expect(tree.readText(LAYOUT_CONFIG_PATH)).toContain("mode: 'persistent'");
    expect(tree.readText(LAYOUT_CONFIG_PATH)).toContain("title: 'Header'");
    expect(tree.readText(LAYOUT_CONFIG_PATH)).toContain("label: 'Sidebar'");
    expect(tree.readText(LAYOUT_CONFIG_PATH)).toContain("text: 'Footer'");
    expect(tree.readText(LAYOUT_CONFIG_PATH)).not.toContain('Dashboard');
    expect(tree.readText('/src/app/layout/shell/shell.html')).toContain('<app-header');
    expect(tree.readText('/src/app/layout/shell/shell.html')).toContain('<app-sidebar');
    expect(tree.readText('/src/app/layout/shell/shell.html')).toContain('<app-footer');
    expect(tree.readText('/src/app/layout/shell/shell.html')).toContain(
      '[menuAvailable]="compactViewport()"',
    );
    expect(tree.readText('/src/app/layout/shell/shell.html')).toContain(
      '(drawerClose)="closeCompactSidebar()"',
    );
    expect(tree.readText('/src/app/layout/header/header.html')).toContain(
      '[attr.aria-expanded]="menuExpanded()"',
    );
    expect(tree.readText('/src/app/layout/sidebar/sidebar.html')).toContain(
      '[attr.aria-label]="sidebar.drawerCloseLabel"',
    );
    expect(tree.readText('/src/app/layout/shell/shell.scss')).not.toContain('bootstrap');
    expect(tree.readText('/src/app/layout/shell/shell.scss')).not.toContain('@apply');
    expect(tree.readText('/src/app/layout/shell/shell.scss')).toContain(
      '@container layout-shell (width <= 64rem)',
    );
    expect(tree.readText('/src/app/layout/shell/shell.scss')).toContain(
      '--layout-viewport-min-block-size: 100dvh',
    );
    expect(tree.readText('/src/app/layout/shell/shell.scss')).toContain('position: sticky');
    expect(tree.readText('/src/app/layout/shell/shell.scss')).toContain('overflow-y: auto');
    expect(tree.readText('/src/app/layout/shell/shell.scss')).toContain(
      '--layout-sidebar-header-reserve: var(--layout-header-height)',
    );
  });

  it('installs only selected components and removes pristine unselected regions', () => {
    const tree = createBaselineTree();

    install(tree, {
      layoutMode: 'select',
      layoutComponents: 'shell,header,sidebar',
      layoutHeaderBehavior: 'sticky',
      layoutSidebarMode: 'collapsible',
      layoutSidebarPosition: 'end',
      layoutSidebarInitialState: 'collapsed',
      layoutContentWidth: 'contained',
    });

    expect(tree.exists('/src/app/layout/header/header.ts')).toBe(true);
    expect(tree.exists('/src/app/layout/sidebar/sidebar.ts')).toBe(true);
    expect(tree.exists('/src/app/layout/footer/footer.ts')).toBe(false);
    expect(tree.readText(LAYOUT_CONFIG_PATH)).toContain("behavior: 'sticky'");
    expect(tree.readText(LAYOUT_CONFIG_PATH)).toContain("mode: 'collapsible'");
    expect(tree.readText(LAYOUT_CONFIG_PATH)).toContain("position: 'end'");
    expect(tree.readText(LAYOUT_CONFIG_PATH)).toContain("initialState: 'collapsed'");
    expect(tree.readText(LAYOUT_CONFIG_PATH)).toContain("width: 'contained'");
    expect(tree.readText('/src/app/layout/shell/shell.ts')).not.toContain('FooterComponent');
    expect(tree.readText('/src/app/layout/shell/shell.html')).not.toContain('<app-footer>');
    expect(tree.readText('/src/app/layout/shell/shell.ts')).toContain('ResizeObserver');
  });

  it('installs a Shell-only layout without orphan imports', () => {
    const tree = createBaselineTree();

    install(tree, {
      layoutMode: 'select',
      layoutComponents: 'shell',
    });

    expect(tree.exists('/src/app/layout/header/header.ts')).toBe(false);
    expect(tree.exists('/src/app/layout/sidebar/sidebar.ts')).toBe(false);
    expect(tree.exists('/src/app/layout/footer/footer.ts')).toBe(false);
    expect(tree.readText('/src/app/layout/shell/shell.ts')).not.toContain('HeaderComponent');
    expect(tree.readText('/src/app/layout/shell/shell.ts')).not.toContain('SidebarComponent');
    expect(tree.readText('/src/app/layout/shell/shell.ts')).not.toContain('FooterComponent');
    expect(tree.readText('/src/app/layout/shell/shell.html')).toContain('<router-outlet>');
  });

  it('converts the root to content-only and removes the pristine layout', () => {
    const tree = createBaselineTree();

    install(tree, { layoutMode: 'content-only' });

    expect(tree.readText('/src/app/app.ts')).toContain('imports: [RouterOutlet]');
    expect(tree.readText('/src/app/app.ts')).not.toContain('ShellComponent');
    expect(tree.readText('/src/app/app.html')).toBe('<router-outlet></router-outlet>\n');
    expect(tree.readText('/src/app/app.spec.ts')).toContain("querySelector('router-outlet')");
    expect(tree.exists('/src/app/layout/shell/shell.ts')).toBe(false);
    expect(tree.exists('/src/app/layout/header/header.ts')).toBe(false);
    expect(tree.exists('/src/app/layout/sidebar/sidebar.ts')).toBe(false);
    expect(tree.exists('/src/app/layout/footer/footer.ts')).toBe(false);
    expect(tree.exists(LAYOUT_MODEL_PATH)).toBe(false);
    expect(tree.exists(LAYOUT_CONFIG_PATH)).toBe(false);
  });

  it('creates a completely missing selected component', () => {
    const tree = createBaselineTree();

    for (const path of getComponentPaths('footer')) {
      tree.delete(path);
    }

    install(tree, {});

    expect(tree.exists('/src/app/layout/footer/footer.ts')).toBe(true);
    expect(tree.exists('/src/app/layout/footer/footer.html')).toBe(true);
    expect(tree.exists('/src/app/layout/footer/footer.scss')).toBe(true);
  });

  it('blocks customized files before creating, overwriting or deleting anything', () => {
    const tree = createBaselineTree();
    tree.overwrite('/src/app/layout/header/header.html', '<header>Custom</header>\n');
    const shellBefore = tree.readText('/src/app/layout/shell/shell.ts');
    const footerBefore = tree.readText('/src/app/layout/footer/footer.ts');

    expect(() =>
      install(tree, {
        layoutMode: 'select',
        layoutComponents: 'shell,header',
      }),
    ).toThrow('Layout Shell preflight failed');

    expect(tree.exists(LAYOUT_MODEL_PATH)).toBe(false);
    expect(tree.exists(LAYOUT_CONFIG_PATH)).toBe(false);
    expect(tree.readText('/src/app/layout/shell/shell.ts')).toBe(shellBefore);
    expect(tree.readText('/src/app/layout/header/header.html')).toBe('<header>Custom</header>\n');
    expect(tree.readText('/src/app/layout/footer/footer.ts')).toBe(footerBefore);
  });
});

function install(tree: Tree, options: Parameters<typeof installLayoutShellEvolution>[3]): void {
  installLayoutShellEvolution(tree, {} as SchematicContext, {} as EvolutionDefinition, options);
}

function createBaselineTree(): Tree {
  const tree = new HostTree();

  for (const file of [
    ...APP_BASELINE_FILES,
    APP_SPEC_BASELINE_FILE,
    ...LAYOUT_BASELINE_FILE_SETS.flatMap((fileSet) => fileSet.files),
  ]) {
    tree.create(file.path, file.content);
  }

  return tree;
}

function getComponentPaths(
  component: (typeof LAYOUT_BASELINE_FILE_SETS)[number]['component'],
): string[] {
  const fileSet = LAYOUT_BASELINE_FILE_SETS.find((candidate) => candidate.component === component);

  if (!fileSet) {
    throw new Error(`Missing layout baseline file set: ${component}.`);
  }

  return fileSet.files.map((file) => file.path);
}
