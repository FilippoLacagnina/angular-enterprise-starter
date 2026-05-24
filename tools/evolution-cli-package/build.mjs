import { cpSync, copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../..');
const packageSourceRoot = resolve(repoRoot, 'tools/evolution-cli-package');
const packageOutputRoot = resolve(repoRoot, 'dist/evolution-cli-package');
const schematicsOutputRoot = resolve(repoRoot, 'dist/schematics');
const rootPackageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));
const packageJson = JSON.parse(readFileSync(resolve(packageSourceRoot, 'package.json'), 'utf8'));

rmSync(packageOutputRoot, { recursive: true, force: true });
mkdirSync(resolve(packageOutputRoot, 'bin'), { recursive: true });

packageJson.version = rootPackageJson.version;

writeFileSync(resolve(packageOutputRoot, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
copyFileSync(resolve(packageSourceRoot, 'README.md'), resolve(packageOutputRoot, 'README.md'));
copyFileSync(
  resolve(packageSourceRoot, 'bin/angular-enterprise-starter.mjs'),
  resolve(packageOutputRoot, 'bin/angular-enterprise-starter.mjs'),
);
copyFileSync(
  resolve(repoRoot, 'tools/schematics/starter-evolution.mjs'),
  resolve(packageOutputRoot, 'bin/starter-evolution.mjs'),
);
cpSync(schematicsOutputRoot, resolve(packageOutputRoot, 'schematics'), { recursive: true });

console.log(`Evolution CLI package assembled at ${packageOutputRoot}`);
