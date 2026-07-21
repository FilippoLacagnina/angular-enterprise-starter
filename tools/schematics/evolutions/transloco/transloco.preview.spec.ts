import { HostTree, type Tree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import { getTranslocoPreview } from './transloco.preview';

describe('Transloco evolution preview', () => {
  it('shows the required dependency range when Transloco is missing', () => {
    const preview = getTranslocoPreview({ name: 'transloco' }, createTree({ dependencies: {} }));

    expect(preview.dependencies).toEqual(['@jsverse/transloco ^8.3.0']);
    expect(preview.blockingNotes).toEqual([]);
    expect(preview.creates).toContain('src/app/core/i18n/i18n.config.ts');
    expect(preview.creates).toContain('src/assets/i18n/en.json');
    expect(preview.creates).toContain('src/assets/i18n/it.json');
    expect(preview.notes).toContain('Default and fallback language: en.');
    expect(preview.notes).toContain('Adds @jsverse/transloco ^8.3.0 to dependencies.');
  });

  it('shows the selected language assets and explicit default', () => {
    const preview = getTranslocoPreview(
      {
        name: 'transloco',
        translocoLanguages: 'en,es,fr',
        translocoDefaultLanguage: 'fr',
      },
      createTree({ dependencies: {} }),
    );

    expect(preview.creates).toContain('src/assets/i18n/en.json');
    expect(preview.creates).toContain('src/assets/i18n/es.json');
    expect(preview.creates).toContain('src/assets/i18n/fr.json');
    expect(preview.creates).not.toContain('src/assets/i18n/it.json');
    expect(preview.notes).toContain('Default and fallback language: fr.');
  });

  it('reports an incompatible existing dependency as a blocking note', () => {
    const preview = getTranslocoPreview(
      { name: 'transloco' },
      createTree({
        dependencies: {
          '@jsverse/transloco': '^8.0.0',
        },
      }),
    );

    expect(preview.blockingNotes).toContain(
      '@jsverse/transloco ^8.0.0 is not compatible with the required ^8.3.0 range.',
    );
  });

  it('reports an unsupported app config before apply', () => {
    const tree = createTree({ dependencies: {} });
    tree.overwrite('/src/app/app.config.ts', 'export const appConfig = {};\n');

    const preview = getTranslocoPreview({ name: 'transloco' }, tree);

    expect(preview.blockingNotes).toContain(
      'src/app/app.config.ts does not contain a supported provider anchor for Transloco.',
    );
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
