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

  it('generates neutral region labels, structural separators and responsive stacking', () => {
    const files = createLayoutShellGeneratedFiles(createLayoutShellInstallPlan({}));
    const config = readGeneratedFile(files, '/src/app/layout/layout.config.ts');
    const model = readGeneratedFile(files, '/src/app/layout/layout.model.ts');
    const shellStyles = readGeneratedFile(files, '/src/app/layout/shell/shell.scss');
    const sidebarTypeScript = readGeneratedFile(files, '/src/app/layout/sidebar/sidebar.ts');
    const sidebarTemplate = readGeneratedFile(files, '/src/app/layout/sidebar/sidebar.html');

    expect(config).toContain("title: 'Header'");
    expect(config).toContain("label: 'Sidebar'");
    expect(config).toContain("text: 'Footer'");
    expect(config).not.toContain('Dashboard');
    expect(model).not.toContain('LayoutNavigationItem');
    expect(sidebarTypeScript).not.toContain('RouterLink');
    expect(sidebarTemplate).toContain('{{ sidebar.label }}');
    expect(shellStyles).toContain('--layout-region-border-color');
    expect(shellStyles).toContain("data-sidebar-position='start'");
    expect(shellStyles).toContain("data-sidebar-position='end'");
    expect(shellStyles).toContain('--layout-viewport-min-block-size: 100dvh');
    expect(shellStyles).toContain('container-name: layout-shell');
    expect(shellStyles).toContain('container-type: inline-size');
    expect(shellStyles).toContain('@container layout-shell (width <= 64rem)');
    expect(shellStyles).not.toContain('@media (width <= 64rem)');
    expect(shellStyles).toContain('border-block-end');
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
