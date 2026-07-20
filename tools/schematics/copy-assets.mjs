import { copyFileSync, cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

const files = [
  ['tools/schematics/collection.json', 'dist/schematics/collection.json'],
  [
    'tools/schematics/evolution/evolution-manifest.json',
    'dist/schematics/evolution/evolution-manifest.json',
  ],
  ['tools/schematics/evolution/schema.json', 'dist/schematics/evolution/schema.json'],
];

for (const [source, target] of files) {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}

const aiGenkitSourceRoot = 'tools/schematics/evolutions/ai-genkit/files';
const aiGenkitTargetRoot = 'dist/schematics/evolutions/ai-genkit/files';

rmSync(aiGenkitTargetRoot, { force: true, recursive: true });
cpSync(aiGenkitSourceRoot, aiGenkitTargetRoot, { recursive: true });

console.log('Schematics assets copied.');
