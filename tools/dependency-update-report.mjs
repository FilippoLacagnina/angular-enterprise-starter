import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DEFAULT_BRANCH_PATTERN = /^(main|evo\/.+)$/;
const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];
const ANGULAR_BOUND_PACKAGES = new Set(['rxjs', 'typescript', 'zone.js']);
const CLASSIFICATION_LABELS = {
  'safe-candidate': 'safe candidate',
  'review-required': 'needs review',
  'migration-required': 'needs migration',
  'compatibility-bound': 'angular-bound',
  'up-to-date': 'up to date',
};

const args = process.argv.slice(2);
const options = {
  all: args.includes('--all'),
  help: args.includes('--help') || args.includes('-h'),
  json: args.includes('--json'),
  branches: readRepeatedOption('--branch'),
};

if (options.help) {
  printHelp();
  process.exit(0);
}

const latestVersionCache = new Map();

try {
  const branches = options.branches.length > 0 ? options.branches : await getDefaultBranches();
  const report = await buildReport(branches);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

function readRepeatedOption(name) {
  return args.flatMap((arg, index) => {
    if (arg === name) {
      return args[index + 1] ? [args[index + 1]] : [];
    }

    if (arg.startsWith(`${name}=`)) {
      return [arg.slice(name.length + 1)];
    }

    return [];
  });
}

function printHelp() {
  console.log(`
Dependency update report

Usage:
  npm run deps:check
  npm run deps:check -- --all
  npm run deps:check -- --json
  npm run deps:check -- --branch main
  npm run deps:check -- --branch evo/i18n/transloco

Default behavior:
  - reads package.json from main and local/origin evo/* branches
  - checks dependencies, devDependencies, peerDependencies and optionalDependencies
  - prints only dependencies with newer npm latest versions
  - does not update files, create commits or open pull requests
`);
}

async function getDefaultBranches() {
  const refs = await git([
    'for-each-ref',
    '--format=%(refname:short)',
    'refs/heads',
    'refs/remotes/origin',
  ]);

  return [
    ...new Set(
      refs
        .split('\n')
        .map((ref) => ref.trim())
        .filter(Boolean)
        .filter((ref) => ref !== 'origin/HEAD')
        .map((ref) => ref.replace(/^origin\//, ''))
        .filter((branch) => DEFAULT_BRANCH_PATTERN.test(branch)),
    ),
  ].sort(sortBranches);
}

function sortBranches(firstBranch, secondBranch) {
  if (firstBranch === 'main') {
    return -1;
  }

  if (secondBranch === 'main') {
    return 1;
  }

  return firstBranch.localeCompare(secondBranch);
}

async function buildReport(branches) {
  const branchReports = [];

  for (const branch of branches) {
    branchReports.push(await buildBranchReport(branch));
  }

  const totals = branchReports.reduce(
    (summary, branchReport) => ({
      branches: summary.branches + 1,
      checked: summary.checked + branchReport.summary.checked,
      outdated: summary.outdated + branchReport.summary.outdated,
      upToDate: summary.upToDate + branchReport.summary.upToDate,
      skipped: summary.skipped + branchReport.summary.skipped,
      classifications: mergeClassificationCounts(
        summary.classifications,
        branchReport.summary.classifications,
      ),
    }),
    {
      branches: 0,
      checked: 0,
      outdated: 0,
      upToDate: 0,
      skipped: 0,
      classifications: createClassificationCounts(),
    },
  );

  return {
    generatedAt: new Date().toISOString(),
    branches: branchReports,
    summary: totals,
  };
}

async function buildBranchReport(branch) {
  const packageJson = await readPackageJson(branch);
  const dependencies = readDependencies(packageJson);
  const angularMajor = getAngularMajor(packageJson);
  const updates = [];
  const skipped = [];

  for (const dependency of dependencies) {
    const currentVersion = extractVersion(dependency.spec);

    if (!currentVersion) {
      skipped.push({
        ...dependency,
        reason: 'Unsupported version specifier',
      });
      continue;
    }

    const latestVersion = await getLatestVersion(dependency.name);

    if (!latestVersion) {
      skipped.push({
        ...dependency,
        reason: 'Unable to resolve npm latest version',
      });
      continue;
    }

    const comparison = compareVersions(currentVersion, latestVersion);
    const isOutdated = comparison < 0;
    const updateType = isOutdated ? getUpdateType(currentVersion, latestVersion) : 'none';
    const classification = classifyDependencyUpdate({
      dependencyName: dependency.name,
      currentVersion,
      latestVersion,
      updateType,
      angularMajor,
      isOutdated,
    });

    if (isOutdated || options.all) {
      updates.push({
        ...dependency,
        currentVersion,
        latestVersion,
        updateType,
        classification: classification.code,
        classificationReason: classification.reason,
        status: isOutdated ? 'outdated' : 'up-to-date',
      });
    }
  }

  return {
    branch,
    updates,
    skipped,
    summary: {
      checked: dependencies.length,
      outdated: updates.filter((update) => update.status === 'outdated').length,
      upToDate:
        dependencies.length -
        updates.filter((update) => update.status === 'outdated').length -
        skipped.length,
      skipped: skipped.length,
      classifications: countClassifications(updates),
    },
  };
}

function getAngularMajor(packageJson) {
  const angularCoreSpec =
    packageJson.dependencies?.['@angular/core'] ?? packageJson.devDependencies?.['@angular/core'];
  const angularCoreVersion = extractVersion(angularCoreSpec);

  return angularCoreVersion ? parseVersion(angularCoreVersion).major : null;
}

function classifyDependencyUpdate({
  dependencyName,
  currentVersion,
  latestVersion,
  updateType,
  angularMajor,
  isOutdated,
}) {
  if (!isOutdated) {
    return {
      code: 'up-to-date',
      reason: 'Already aligned with npm latest.',
    };
  }

  const currentParts = parseVersion(currentVersion);
  const latestParts = parseVersion(latestVersion);

  if (dependencyName.startsWith('@angular/')) {
    if (latestParts.major > currentParts.major) {
      return {
        code: 'migration-required',
        reason: 'Angular major updates should go through the official Angular migration flow.',
      };
    }

    return {
      code: 'safe-candidate',
      reason: 'Same Angular major update. Still run the project quality checks before merging.',
    };
  }

  if (ANGULAR_BOUND_PACKAGES.has(dependencyName)) {
    return {
      code: 'compatibility-bound',
      reason:
        'This package is bound to Angular compatibility ranges and should not follow npm latest blindly.',
    };
  }

  if (dependencyName === 'angular-eslint' || dependencyName.startsWith('@angular-eslint/')) {
    if (updateType === 'major' || (angularMajor && latestParts.major > angularMajor)) {
      return {
        code: 'migration-required',
        reason: 'Angular ESLint major updates should stay aligned with the Angular baseline.',
      };
    }

    return {
      code: 'safe-candidate',
      reason: 'Angular ESLint update stays within the current major line.',
    };
  }

  if (updateType === 'major') {
    return {
      code: 'migration-required',
      reason: 'Major dependency updates require explicit review and migration testing.',
    };
  }

  return {
    code: 'review-required',
    reason: 'Patch/minor update outside the Angular core set. Review changelog and run checks.',
  };
}

async function readPackageJson(branch) {
  const content = await git(['show', `${branch}:package.json`]);
  return JSON.parse(content);
}

function readDependencies(packageJson) {
  return DEPENDENCY_SECTIONS.flatMap((section) =>
    Object.entries(packageJson[section] ?? {}).map(([name, spec]) => ({
      name,
      section,
      spec,
    })),
  ).sort((firstDependency, secondDependency) => {
    if (firstDependency.section !== secondDependency.section) {
      return firstDependency.section.localeCompare(secondDependency.section);
    }

    return firstDependency.name.localeCompare(secondDependency.name);
  });
}

function extractVersion(spec) {
  if (typeof spec !== 'string') {
    return null;
  }

  const npmAliasMatch = spec.match(/^npm:[^@]+@(.+)$/);
  const normalizedSpec = npmAliasMatch ? npmAliasMatch[1] : spec;
  const versionMatch = normalizedSpec.match(/(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/);

  return versionMatch?.[1] ?? null;
}

async function getLatestVersion(packageName) {
  if (latestVersionCache.has(packageName)) {
    return latestVersionCache.get(packageName);
  }

  let response;

  try {
    response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
  } catch {
    latestVersionCache.set(packageName, null);
    return null;
  }

  if (!response.ok) {
    latestVersionCache.set(packageName, null);
    return null;
  }

  const metadata = await response.json();
  const latestVersion = metadata?.['dist-tags']?.latest ?? null;
  latestVersionCache.set(packageName, latestVersion);

  return latestVersion;
}

function compareVersions(currentVersion, latestVersion) {
  const currentParts = parseVersion(currentVersion);
  const latestParts = parseVersion(latestVersion);

  for (const part of ['major', 'minor', 'patch']) {
    if (currentParts[part] !== latestParts[part]) {
      return currentParts[part] > latestParts[part] ? 1 : -1;
    }
  }

  return 0;
}

function parseVersion(version) {
  const [major = 0, minor = 0, patch = 0] = version
    .split('-')[0]
    .split('.')
    .map((part) => Number.parseInt(part, 10));

  return { major, minor, patch };
}

function getUpdateType(currentVersion, latestVersion) {
  const currentParts = parseVersion(currentVersion);
  const latestParts = parseVersion(latestVersion);

  if (latestParts.major > currentParts.major) {
    return 'major';
  }

  if (latestParts.minor > currentParts.minor) {
    return 'minor';
  }

  if (latestParts.patch > currentParts.patch) {
    return 'patch';
  }

  return 'unknown';
}

function createClassificationCounts() {
  return {
    safeCandidate: 0,
    reviewRequired: 0,
    migrationRequired: 0,
    compatibilityBound: 0,
  };
}

function countClassifications(updates) {
  return updates
    .filter((update) => update.status === 'outdated')
    .reduce((counts, update) => {
      if (update.classification === 'safe-candidate') {
        counts.safeCandidate += 1;
      }

      if (update.classification === 'review-required') {
        counts.reviewRequired += 1;
      }

      if (update.classification === 'migration-required') {
        counts.migrationRequired += 1;
      }

      if (update.classification === 'compatibility-bound') {
        counts.compatibilityBound += 1;
      }

      return counts;
    }, createClassificationCounts());
}

function mergeClassificationCounts(firstCounts, secondCounts) {
  return {
    safeCandidate: firstCounts.safeCandidate + secondCounts.safeCandidate,
    reviewRequired: firstCounts.reviewRequired + secondCounts.reviewRequired,
    migrationRequired: firstCounts.migrationRequired + secondCounts.migrationRequired,
    compatibilityBound: firstCounts.compatibilityBound + secondCounts.compatibilityBound,
  };
}

async function git(gitArgs) {
  const { stdout } = await execFileAsync('git', gitArgs, {
    maxBuffer: 1024 * 1024 * 10,
  });

  return stdout.trim();
}

function printReport(report) {
  console.log('Angular Enterprise Starter dependency report');
  console.log(`Generated at: ${report.generatedAt}`);
  console.log('');

  for (const branchReport of report.branches) {
    printBranchReport(branchReport);
  }

  printBranchSummary(report);

  console.log('Global summary');
  console.log(`Branches checked: ${report.summary.branches}`);
  console.log(`Dependencies checked: ${report.summary.checked}`);
  console.log(`Outdated dependencies: ${report.summary.outdated}`);
  console.log(`Up-to-date dependencies: ${report.summary.upToDate}`);
  console.log(`Skipped dependencies: ${report.summary.skipped}`);
  console.log(`Safe candidates: ${report.summary.classifications.safeCandidate}`);
  console.log(`Needs review: ${report.summary.classifications.reviewRequired}`);
  console.log(`Needs migration: ${report.summary.classifications.migrationRequired}`);
  console.log(`Angular-bound: ${report.summary.classifications.compatibilityBound}`);
}

function printBranchSummary(report) {
  console.log('Summary by branch');
  console.log(
    `${'Branch'.padEnd(44)} ${'Checked'.padStart(7)} ${'Outdated'.padStart(8)} ${'Up to date'.padStart(10)} ${'Skipped'.padStart(7)} ${'Safe cand.'.padStart(10)} ${'Needs review'.padStart(12)} ${'Needs migration'.padStart(15)} ${'Angular-bound'.padStart(13)}`,
  );

  for (const branchReport of report.branches) {
    console.log(
      `${branchReport.branch.padEnd(44)} ${String(branchReport.summary.checked).padStart(7)} ${String(branchReport.summary.outdated).padStart(8)} ${String(branchReport.summary.upToDate).padStart(10)} ${String(branchReport.summary.skipped).padStart(7)} ${String(branchReport.summary.classifications.safeCandidate).padStart(10)} ${String(branchReport.summary.classifications.reviewRequired).padStart(12)} ${String(branchReport.summary.classifications.migrationRequired).padStart(15)} ${String(branchReport.summary.classifications.compatibilityBound).padStart(13)}`,
    );
  }

  console.log('');
}

function printBranchReport(branchReport) {
  console.log(`Branch: ${branchReport.branch}`);

  if (branchReport.updates.length === 0) {
    if (branchReport.summary.skipped === branchReport.summary.checked) {
      console.log('  No dependencies could be checked against npm latest.');
    } else {
      console.log('  No outdated dependencies found among resolved dependencies.');
    }
  }

  for (const update of branchReport.updates) {
    const status = update.status === 'outdated' ? update.updateType : update.status;
    const classification = CLASSIFICATION_LABELS[update.classification] ?? update.classification;
    console.log(
      `  ${update.name.padEnd(32)} ${update.currentVersion.padEnd(12)} -> ${update.latestVersion.padEnd(12)} ${status.padEnd(8)} ${classification}`,
    );
  }

  if (options.all && branchReport.skipped.length > 0) {
    console.log('  Skipped:');

    for (const skippedDependency of branchReport.skipped) {
      console.log(
        `  ${skippedDependency.name.padEnd(32)} ${skippedDependency.spec} (${skippedDependency.reason})`,
      );
    }
  }

  if (!options.all && branchReport.skipped.length > 0) {
    console.log(
      `  Skipped dependencies: ${branchReport.skipped.length} (run with --all to inspect them).`,
    );
  }

  console.log('');
}
