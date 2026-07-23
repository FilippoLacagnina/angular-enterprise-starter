import { HostTree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import { type DesignSystemComponentDefinition } from './design-system.model';
import { createDesignSystemPreview } from './design-system.preview';

const component: DesignSystemComponentDefinition<'button'> = {
  name: 'button',
  label: 'Button',
  className: 'ExampleButton',
  exportPath: './button/button',
  files: [
    { path: '/button/button.ts', content: 'export class ExampleButton {}\n' },
    { path: '/button/button.html', content: '<button>Example</button>\n' },
  ],
  supplementalFiles: [
    { path: '/button/button.spec.ts', content: "describe('ExampleButton', () => {});\n" },
  ],
};

const plan = { mode: 'select', components: [component] } as const;

function createPreview(tree: HostTree) {
  return createDesignSystemPreview({
    tree,
    plan,
    indexPath: '/button/index.ts',
    dependencies: [],
    updates: [],
    notes: [],
  });
}

describe('design-system preview', () => {
  it('skips missing supplemental files for an existing user-owned component', () => {
    const tree = new HostTree();
    tree.create('/button/button.ts', 'custom button source\n');
    tree.create('/button/button.html', '<button>Custom</button>\n');
    tree.create('/button/index.ts', "export { ExampleButton } from './button/button';\n");

    const preview = createPreview(tree);

    expect(preview.creates).toEqual([]);
    expect(preview.existing).toEqual(['Button already installed; apply will skip it.']);
    expect(preview.blockingNotes).toEqual([]);
    expect(preview.notes).toEqual(['Already installed components will be skipped: button.']);
  });

  it('keeps a supplemental-only component blocked as a partial installation', () => {
    const tree = new HostTree();
    tree.create('/button/button.spec.ts', 'custom test\n');

    const preview = createPreview(tree);

    expect(preview.creates).toEqual(['button/index.ts']);
    expect(preview.blockingNotes).toEqual([
      'Button is partially installed. Existing: button/button.spec.ts. Missing: button/button.ts, button/button.html.',
    ]);
  });
});
