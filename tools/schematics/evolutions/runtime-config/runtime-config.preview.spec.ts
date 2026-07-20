import { HostTree, type Tree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import { getRuntimeConfigPreview } from './runtime-config.preview';

describe('Runtime Config evolution preview', () => {
  it('shows the required YAML dependency range', () => {
    const preview = getRuntimeConfigPreview(
      { name: 'runtime-config' },
      createTree({ dependencies: {} }),
    );

    expect(preview.dependencies).toEqual(['yaml ^2.9.0']);
    expect(preview.blockingNotes).toEqual([]);
    expect(preview.notes).toContain('Adds yaml ^2.9.0 to dependencies.');
  });

  it('reports an incompatible existing YAML dependency', () => {
    const preview = getRuntimeConfigPreview(
      { name: 'runtime-config' },
      createTree({
        dependencies: {
          yaml: '^1.10.0',
        },
      }),
    );

    expect(preview.blockingNotes).toContain(
      'yaml ^1.10.0 is not compatible with the required ^2.9.0 range.',
    );
  });

  it('reports an unsupported app config provider structure', () => {
    const tree = createTree({ dependencies: {} });
    tree.overwrite('/src/app/app.config.ts', 'export const appConfig = {};\n');

    const preview = getRuntimeConfigPreview({ name: 'runtime-config' }, tree);

    expect(preview.blockingNotes).toContain('Missing known provider anchor in app.config.ts.');
  });
});

function createTree(packageJson: Record<string, unknown>): Tree {
  const tree = new HostTree();
  tree.create('/package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
  tree.create(
    '/angular.json',
    JSON.stringify({
      projects: {
        app: {
          architect: {
            build: {
              options: {
                assets: [],
              },
            },
          },
        },
      },
    }),
  );
  tree.create(
    '/src/app/app.config.ts',
    `export const appConfig = {
  providers: [
    provideRouter(routes),
  ],
};
`,
  );

  return tree;
}
