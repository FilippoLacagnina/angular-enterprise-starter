import { HostTree, type Tree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import {
  APP_BASELINE_FILES,
  APP_SPEC_BASELINE_FILE,
  LAYOUT_BASELINE_FILE_SETS,
} from './layout-shell.baseline';
import { getLayoutShellPreview } from './layout-shell.preview';

describe('Layout Shell evolution preview', () => {
  it('previews the complete layout without dependencies', () => {
    const preview = getLayoutShellPreview({}, createBaselineTree());

    expect(preview.dependencies).toEqual([]);
    expect(preview.creates).toEqual([
      'src/app/layout/layout.model.ts',
      'src/app/layout/layout.config.ts',
    ]);
    expect(preview.updates).toEqual([...getLayoutPaths(), '.angular-enterprise-starter.json']);
    expect(preview.deletes).toEqual([]);
    expect(preview.existing).toEqual([]);
    expect(preview.blockingNotes).toEqual([]);
  });

  it('previews a Shell-only layout and deletion of unselected regions', () => {
    const preview = getLayoutShellPreview(
      {
        layoutMode: 'select',
        layoutComponents: 'shell',
      },
      createBaselineTree(),
    );

    expect(preview.updates).toEqual([
      ...getComponentPaths('shell'),
      '.angular-enterprise-starter.json',
    ]);
    expect(preview.deletes).toEqual([
      ...getComponentPaths('header'),
      ...getComponentPaths('sidebar'),
      ...getComponentPaths('footer'),
    ]);
    expect(preview.blockingNotes).toEqual([]);
  });

  it('previews content-only conversion and all layout deletions', () => {
    const preview = getLayoutShellPreview({ layoutMode: 'content-only' }, createBaselineTree());

    expect(preview.creates).toEqual([]);
    expect(preview.updates).toEqual([
      'src/app/app.ts',
      'src/app/app.html',
      'src/app/app.spec.ts',
      '.angular-enterprise-starter.json',
    ]);
    expect(preview.deletes).toEqual(getLayoutPaths());
    expect(preview.blockingNotes).toEqual([]);
  });

  it('reports customized and additional files without mutating them', () => {
    const tree = createBaselineTree();
    tree.overwrite('/src/app/layout/header/header.html', '<header>Custom</header>\n');
    tree.create('/src/app/layout/header/header.spec.ts', 'custom spec\n');

    const preview = getLayoutShellPreview({}, tree);

    expect(preview.blockingNotes).toEqual([
      'Header contains customized baseline files: src/app/layout/header/header.html.',
      'Header contains additional files that require manual review: src/app/layout/header/header.spec.ts.',
    ]);
    expect(tree.readText('/src/app/layout/header/header.html')).toBe('<header>Custom</header>\n');
    expect(tree.readText('/src/app/layout/header/header.spec.ts')).toBe('custom spec\n');
  });

  it('creates a completely missing selected region but blocks partial state', () => {
    const missingTree = createBaselineTree();

    for (const path of getComponentPaths('header')) {
      missingTree.delete(path);
    }

    const missingPreview = getLayoutShellPreview({}, missingTree);

    expect(missingPreview.creates).toContain('src/app/layout/header/header.ts');
    expect(missingPreview.creates).toContain('src/app/layout/header/header.html');
    expect(missingPreview.creates).toContain('src/app/layout/header/header.scss');
    expect(missingPreview.blockingNotes).toEqual([]);

    const partialTree = createBaselineTree();
    partialTree.delete('/src/app/layout/sidebar/sidebar.scss');

    const partialPreview = getLayoutShellPreview({}, partialTree);

    expect(partialPreview.blockingNotes).toEqual([
      'Sidebar is only partially present. Existing: src/app/layout/sidebar/sidebar.ts, src/app/layout/sidebar/sidebar.html. Missing: src/app/layout/sidebar/sidebar.scss.',
    ]);
  });

  it('blocks content-only conversion when the App root is customized', () => {
    const tree = createBaselineTree();
    tree.overwrite('/src/app/app.html', '<main>Custom root</main>\n');

    const preview = getLayoutShellPreview({ layoutMode: 'content-only' }, tree);

    expect(preview.blockingNotes).toContain(
      'src/app/app.html differs from the supported starter baseline and cannot be updated safely.',
    );
  });
});

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

function getLayoutPaths(): string[] {
  return LAYOUT_BASELINE_FILE_SETS.flatMap((fileSet) =>
    fileSet.files.map((file) => toDisplayPath(file.path)),
  );
}

function getComponentPaths(
  component: (typeof LAYOUT_BASELINE_FILE_SETS)[number]['component'],
): string[] {
  const fileSet = LAYOUT_BASELINE_FILE_SETS.find((candidate) => candidate.component === component);

  if (!fileSet) {
    throw new Error(`Missing layout baseline file set: ${component}.`);
  }

  return fileSet.files.map((file) => toDisplayPath(file.path));
}

function toDisplayPath(path: string): string {
  return path.replace(/^\//, '');
}
