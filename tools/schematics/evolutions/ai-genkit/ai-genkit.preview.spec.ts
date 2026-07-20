import { HostTree, type Tree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import { getAiGenkitPreview } from './ai-genkit.preview';

describe('AI Genkit evolution preview', () => {
  it('shows the required core and provider dependency ranges', () => {
    const preview = getAiGenkitPreview({ name: 'ai-genkit' }, createTree({ dependencies: {} }));

    expect(preview.dependencies).toEqual(['genkit ^1.40.0', '@genkit-ai/google-genai ^1.40.0']);
    expect(preview.blockingNotes).toEqual([]);
    expect(preview.notes).toContain('Adds genkit ^1.40.0 to dependencies.');
    expect(preview.notes).toContain('Adds @genkit-ai/google-genai ^1.40.0 to dependencies.');
  });

  it('reports an incompatible provider dependency without hiding the core requirement', () => {
    const preview = getAiGenkitPreview(
      { name: 'ai-genkit' },
      createTree({
        dependencies: {
          '@genkit-ai/google-genai': '^1.39.0',
        },
      }),
    );

    expect(preview.dependencies).toContain('genkit ^1.40.0');
    expect(preview.blockingNotes).toContain(
      '@genkit-ai/google-genai ^1.39.0 is not compatible with the required ^1.40.0 range.',
    );
  });

  it('preserves compatible existing core and provider declarations', () => {
    const preview = getAiGenkitPreview(
      { name: 'ai-genkit' },
      createTree({
        dependencies: {
          '@genkit-ai/google-genai': '^1.40.1',
          genkit: '^1.40.2',
        },
      }),
    );

    expect(preview.blockingNotes).toEqual([]);
    expect(preview.notes).toContain('Preserves the compatible existing genkit declaration.');
    expect(preview.notes).toContain(
      'Preserves the compatible existing @genkit-ai/google-genai declaration.',
    );
  });

  it('reports unsupported summary wiring before apply', () => {
    const tree = createTree({ dependencies: {} });
    tree.create('/src/app/app.routes.ts', 'export const routes = [];\n');

    const preview = getAiGenkitPreview({ name: 'ai-genkit', aiExample: 'summary' }, tree);

    expect(preview.blockingNotes).toContain(
      'src/server.ts no longer matches the supported starter backend structure.',
    );
    expect(preview.blockingNotes).toContain(
      'src/app/app.routes.ts no longer matches the supported starter route structure.',
    );
  });
});

function createTree(packageJson: Record<string, unknown>): Tree {
  const tree = new HostTree();
  tree.create('/package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
  tree.create('/src/server.ts', '');

  return tree;
}
