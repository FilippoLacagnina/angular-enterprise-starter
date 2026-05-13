import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const removablePaths = [
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'ROADMAP.md',
  'CHANGELOG.md',
  'docs/current-status.md',
];

const args = new Set(process.argv.slice(2));
const shouldApply = args.has('--yes');
const shouldShowHelp = args.has('--help') || args.has('-h');

const printHelp = () => {
  console.log(`
Starter cleanup

Usage:
  npm run starter:cleanup
  npm run starter:cleanup -- --dry-run
  npm run starter:cleanup -- --yes

Default behavior is a dry run.
Use --yes to remove starter-only files after cloning the project.
`);
};

if (shouldShowHelp) {
  printHelp();
  process.exit(0);
}

console.log(shouldApply ? 'Removing starter-only files:' : 'Starter cleanup preview:');

for (const relativePath of removablePaths) {
  console.log(`- ${relativePath}`);

  if (shouldApply) {
    await rm(resolve(relativePath), { force: true, recursive: true });
  }
}

if (!shouldApply) {
  console.log('\nNo files were removed.');
  console.log('Run `npm run starter:cleanup -- --yes` to apply this cleanup.');
}

if (shouldApply) {
  console.log('\nStarter cleanup completed.');
}
