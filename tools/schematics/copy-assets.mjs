import { copyFileSync, cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

const files = [
  ['tools/schematics/collection.json', 'dist/schematics/collection.json'],
  ['tools/schematics/evolution/schema.json', 'dist/schematics/evolution/schema.json'],
];

for (const [source, target] of files) {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}

const aiGenkitAssetRoot = 'dist/schematics/evolutions/ai-genkit/files';
const aiGenkitDirectories = ['src/server/ai', 'src/contracts/ai', 'src/app/features/ai-summary'];

rmSync(aiGenkitAssetRoot, { force: true, recursive: true });

for (const source of aiGenkitDirectories) {
  cpSync(source, join(aiGenkitAssetRoot, source), { recursive: true });
}

// The installer creates this managed catalog and registers only the selected adapters.
rmSync(
  join(aiGenkitAssetRoot, 'src/server/ai/providers/installed-ai-providers.ts'),
  { force: true },
);

console.log('Schematics assets copied.');
