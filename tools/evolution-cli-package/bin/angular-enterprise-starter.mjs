#!/usr/bin/env node

import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawArgs = process.argv.slice(2);
const command = rawArgs[0];

process.env.AES_SKIP_SCHEMATICS_BUILD = 'true';
process.env.AES_CLI_PACKAGE_JSON_PATH = resolve(packageRoot, 'package.json');
process.env.AES_EVOLUTION_MANIFEST_PATH = resolve(
  packageRoot,
  'schematics/evolution/evolution-manifest.json',
);
process.env.AES_SCHEMATICS_COLLECTION_PATH = resolve(packageRoot, 'schematics/collection.json');

if (!command || command === '--help' || command === '-h') {
  process.argv = [process.argv[0], process.argv[1], '--help'];
  await import(pathToFileURL(resolve(packageRoot, 'bin/starter-evolution.mjs')).href);
} else if (command === '--version' || command === '-v') {
  process.argv = [process.argv[0], process.argv[1], '--version'];
  await import(pathToFileURL(resolve(packageRoot, 'bin/starter-evolution.mjs')).href);
} else if (command === 'evolution') {
  process.argv = [process.argv[0], process.argv[1], ...rawArgs.slice(1)];
  await import(pathToFileURL(resolve(packageRoot, 'bin/starter-evolution.mjs')).href);
} else if (command.startsWith('--')) {
  process.argv = [process.argv[0], process.argv[1], ...rawArgs];
  await import(pathToFileURL(resolve(packageRoot, 'bin/starter-evolution.mjs')).href);
} else {
  console.error(`Unsupported command: ${command}`);
  console.error('');
  process.exitCode = 1;
  process.argv = [process.argv[0], process.argv[1], '--help'];
  await import(pathToFileURL(resolve(packageRoot, 'bin/starter-evolution.mjs')).href);
}
