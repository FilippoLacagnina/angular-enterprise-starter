import { readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const standardRemovablePaths = [
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'ROADMAP.md',
  'CHANGELOG.md',
  'docs/current-status.md',
  '.github/pull_request_template.md',
];

const consumerModeRemovablePaths = [
  'tools/schematics',
  'tools/evolution-cli-package',
  'docs/evolution-cli',
];

const consumerModePackageScripts = [
  'starter:evolution',
  'schematics:build',
  'schematics:test',
  'evolution-cli:package',
  'evolution-cli:pack',
];

const NPM_EVOLUTION_COMMAND =
  'npx @filippolacagnina/angular-enterprise-starter@alpha evolution';
const PACKAGE_JSON_PATH = 'package.json';

const args = new Set(process.argv.slice(2));
const shouldApply = args.has('--yes');
const shouldUseConsumerMode = args.has('--consumer-mode');
const shouldShowHelp = args.has('--help') || args.has('-h');

const printHelp = () => {
  console.log(`
Starter cleanup

Usage:
  npm run starter:cleanup
  npm run starter:cleanup -- --consumer-mode
  npm run starter:cleanup:apply
  npm run starter:cleanup:consumer

Default behavior is a dry run.
Use starter:cleanup:apply to remove starter-only files after cloning the project.
Use consumer mode to remove local installer tooling from product repositories.
`);
};

if (shouldShowHelp) {
  printHelp();
  process.exit(0);
}

const removablePaths = [
  ...standardRemovablePaths,
  ...(shouldUseConsumerMode ? consumerModeRemovablePaths : []),
];

console.log(createTitle());

for (const relativePath of removablePaths) {
  console.log(`- ${relativePath}`);

  if (shouldApply) {
    await rm(resolve(relativePath), { force: true, recursive: true });
  }
}

if (shouldUseConsumerMode) {
  console.log('\nPackage scripts to remove:');

  for (const scriptName of consumerModePackageScripts) {
    console.log(`- ${scriptName}`);
  }

  if (shouldApply) {
    await removePackageScripts(consumerModePackageScripts);
  }
}

if (!shouldApply) {
  console.log('\nNo files were removed.');
  console.log(createApplyHint());
}

if (shouldApply) {
  console.log('\nStarter cleanup completed.');

  if (shouldUseConsumerMode) {
    console.log('\nConsumer mode cleanup completed.');
    console.log('Local installer tooling has been removed from this workspace.');
    console.log('You can still install or update evolutions with:');
    console.log(`\n${NPM_EVOLUTION_COMMAND}`);
  }
}

function createTitle() {
  if (shouldApply && shouldUseConsumerMode) {
    return 'Removing starter-only files and local installer tooling:';
  }

  if (shouldApply) {
    return 'Removing starter-only files:';
  }

  if (shouldUseConsumerMode) {
    return 'Starter cleanup consumer-mode preview:';
  }

  return 'Starter cleanup preview:';
}

function createApplyHint() {
  if (shouldUseConsumerMode) {
    return 'Run `npm run starter:cleanup:consumer` to apply this cleanup.';
  }

  return 'Run `npm run starter:cleanup:apply` to apply this cleanup.';
}

async function removePackageScripts(scriptNames) {
  const packageJson = JSON.parse(await readFile(PACKAGE_JSON_PATH, 'utf8'));

  for (const scriptName of scriptNames) {
    delete packageJson.scripts?.[scriptName];
  }

  await writeFile(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);
}
