import { HostTree, type Tree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import { getDockerSsrPreview } from './docker-ssr.preview';

describe('Docker SSR evolution preview', () => {
  it('shows both generated files when the SSR baseline is compatible', () => {
    const preview = getDockerSsrPreview({ name: 'docker-ssr' }, createCompatibleTree());

    expect(preview.dependencies).toEqual([]);
    expect(preview.creates).toEqual(['Dockerfile', '.dockerignore']);
    expect(preview.existing).toEqual([]);
    expect(preview.blockingNotes).toEqual([]);
  });

  it('reports all existing output files without mutating the tree', () => {
    const tree = createCompatibleTree();
    tree.create('/Dockerfile', 'custom\n');
    tree.create('/.dockerignore', 'custom\n');
    const dockerfile = tree.readText('/Dockerfile');
    const dockerignore = tree.readText('/.dockerignore');

    const preview = getDockerSsrPreview({ name: 'docker-ssr' }, tree);

    expect(preview.creates).toEqual([]);
    expect(preview.existing).toEqual(['Dockerfile', '.dockerignore']);
    expect(preview.blockingNotes).toEqual([
      'Dockerfile already exists and will not be overwritten.',
      '.dockerignore already exists and will not be overwritten.',
    ]);
    expect(tree.readText('/Dockerfile')).toBe(dockerfile);
    expect(tree.readText('/.dockerignore')).toBe(dockerignore);
  });

  it('reports every missing or incompatible build prerequisite', () => {
    const tree = new HostTree();
    tree.create('/package.json', JSON.stringify({ scripts: {} }));
    tree.create('/angular.json', JSON.stringify({ projects: {} }));

    const preview = getDockerSsrPreview({ name: 'docker-ssr' }, tree);

    expect(preview.blockingNotes).toEqual([
      'package-lock.json is required because the generated Dockerfile runs npm ci.',
      'package.json must define a non-empty build script because the generated Dockerfile runs npm run build.',
      'angular.json must define the angular-enterprise-starter server build with outputMode "server" and SSR entry "src/server.ts".',
      'src/server.ts is required because the generated image runs the Angular Node SSR server.',
    ]);
  });
});

function createCompatibleTree(): Tree {
  const tree = new HostTree();
  tree.create('/package.json', `${JSON.stringify({ scripts: { build: 'ng build' } }, null, 2)}\n`);
  tree.create('/package-lock.json', '{}\n');
  tree.create(
    '/angular.json',
    `${JSON.stringify(
      {
        projects: {
          'angular-enterprise-starter': {
            architect: {
              build: {
                options: {
                  server: 'src/main.server.ts',
                  outputMode: 'server',
                  ssr: {
                    entry: 'src/server.ts',
                  },
                },
              },
            },
          },
        },
      },
      null,
      2,
    )}\n`,
  );
  tree.create('/src/server.ts', '');

  return tree;
}
