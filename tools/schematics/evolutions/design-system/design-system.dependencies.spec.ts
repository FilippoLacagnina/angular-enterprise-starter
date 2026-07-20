import { HostTree, type Tree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import { getBootstrapPreview } from '../bootstrap/bootstrap.preview';
import { getTailwindPreview } from '../tailwind/tailwind.preview';

describe('design-system dependency previews', () => {
  it('reports an incompatible Bootstrap dependency', () => {
    const preview = getBootstrapPreview(
      {
        name: 'bootstrap',
        bootstrapMode: 'select',
        bootstrapComponents: 'button',
      },
      createTree({
        dependencies: {
          bootstrap: '^4.6.0',
        },
      }),
    );

    expect(preview.dependencies).toEqual(['bootstrap ^5.3.8']);
    expect(preview.blockingNotes).toContain(
      'bootstrap ^4.6.0 is not compatible with the required ^5.3.8 range.',
    );
  });

  it('reports each Tailwind dependency and blocks an invalid section', () => {
    const preview = getTailwindPreview(
      {
        name: 'tailwind',
        tailwindMode: 'select',
        tailwindComponents: 'button',
      },
      createTree({
        dependencies: {
          tailwindcss: '^4.3.0',
        },
        devDependencies: {},
      }),
    );

    expect(preview.dependencies).toEqual([
      'tailwindcss ^4.3.0',
      '@tailwindcss/postcss ^4.3.0',
      'postcss ^8.5.14',
    ]);
    expect(preview.blockingNotes).toContain(
      'tailwindcss is declared in dependencies, but this evolution requires it in devDependencies. Move the dependency explicitly before continuing.',
    );
  });

  it('reports an invalid existing PostCSS configuration', () => {
    const tree = createTree({ devDependencies: {} });
    tree.create('/.postcssrc.json', '{');

    const preview = getTailwindPreview(
      {
        name: 'tailwind',
        tailwindMode: 'select',
        tailwindComponents: 'button',
      },
      tree,
    );

    expect(preview.blockingNotes).toContain('.postcssrc.json contains invalid JSON.');
  });
});

function createTree(packageJson: Record<string, unknown>): Tree {
  const tree = new HostTree();
  tree.create('/package.json', `${JSON.stringify(packageJson, null, 2)}\n`);

  return tree;
}
