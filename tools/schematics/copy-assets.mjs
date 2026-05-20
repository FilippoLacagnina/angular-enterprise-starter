import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const files = [
  ['tools/schematics/collection.json', 'dist/schematics/collection.json'],
  ['tools/schematics/evolution/schema.json', 'dist/schematics/evolution/schema.json'],
];

for (const [source, target] of files) {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}

console.log('Schematics assets copied.');
