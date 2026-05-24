#!/usr/bin/env node

import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawArgs = process.argv.slice(2);
const command = rawArgs[0];

process.env.AES_SKIP_SCHEMATICS_BUILD = 'true';
process.env.AES_CLI_PACKAGE_JSON_PATH = resolve(packageRoot, 'package.json');
process.env.AES_SCHEMATICS_COLLECTION_PATH = resolve(packageRoot, 'schematics/collection.json');

if (!command || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command === '--version' || command === '-v') {
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
  printHelp();
  process.exit(1);
}

function printHelp() {
  console.log(`Angular Enterprise Starter CLI

Usage:
  angular-enterprise-starter evolution [options]
  aes evolution [options]

Examples:
  angular-enterprise-starter evolution
  angular-enterprise-starter evolution --name bootstrap --preview
  angular-enterprise-starter --version
`);
}
