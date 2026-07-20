import { HostTree, type Tree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import { getSignalStorePreview } from './signal-store.installer';

describe('SignalStore evolution preview', () => {
  it('shows the required dependency range when SignalStore is missing', () => {
    const preview = getSignalStorePreview(
      { name: 'signal-store', storeScope: 'root' },
      createTree({ dependencies: {} }),
    );

    expect(preview.dependencies).toEqual(['@ngrx/signals ^21.1.0']);
    expect(preview.blockingNotes).toEqual([]);
    expect(preview.notes).toContain('Adds @ngrx/signals ^21.1.0 to dependencies.');
  });

  it('reports an incompatible existing dependency as a blocking note', () => {
    const preview = getSignalStorePreview(
      { name: 'signal-store', storeScope: 'root' },
      createTree({
        dependencies: {
          '@ngrx/signals': '^20.0.0',
        },
      }),
    );

    expect(preview.blockingNotes).toContain(
      '@ngrx/signals ^20.0.0 is not compatible with the required ^21.1.0 range.',
    );
  });

  it('reports a route structure that cannot be updated safely', () => {
    const tree = createTree({ dependencies: {} });
    tree.create('/src/app/features/orders/orders.routes.ts', 'export const ordersRoutes = [];\n');

    const preview = getSignalStorePreview(
      {
        name: 'signal-store',
        storeScope: 'feature',
        featureName: 'orders',
        featureComponent: 'existing',
      },
      tree,
    );

    expect(preview.blockingNotes).toContain(
      'Apply would stop: Cannot safely add SignalStore import to the route file.',
    );
  });
});

function createTree(packageJson: Record<string, unknown>): Tree {
  const tree = new HostTree();
  tree.create('/package.json', `${JSON.stringify(packageJson, null, 2)}\n`);

  return tree;
}
