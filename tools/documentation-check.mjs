import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const DOCS_ROOT = resolve(ROOT, 'docs');
const EVOLUTION_GUIDES_ROOT = resolve(DOCS_ROOT, 'evolution-cli');
const MANIFEST_PATH = resolve(ROOT, 'tools/schematics/evolution/evolution-manifest.json');
const SCHEMATICS_GUIDE_PATH = resolve(DOCS_ROOT, 'schematics.md');
const STANDARD_GUIDE_MARKER = '<!-- evolution-guide-standard -->';
const STANDARD_GUIDE_HEADINGS = [
  'Purpose',
  'When to use it',
  'Prerequisites',
  'Generated changes',
  'Dependencies',
  'Options',
  'Preview and apply',
  'Configuration',
  'Safety and repeatability',
  'Compatibility',
  'Verification',
  'Removal and rollback',
  'Troubleshooting',
  'Architecture reference',
];
const IGNORED_DIRECTORIES = new Set(['.git', 'coverage', 'dist', 'node_modules']);

const failures = [];
const manifest = readJson(MANIFEST_PATH);
const markdownFiles = collectMarkdownFiles(ROOT);

validateEvolutionGuides(manifest);
validateLocalMarkdownLinks(markdownFiles);

if (failures.length > 0) {
  console.error('Documentation checks failed:');

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log(
  `Documentation checks passed for ${manifest.evolutions.length} evolution guides and ${markdownFiles.length} Markdown files.`,
);

function validateEvolutionGuides(evolutionManifest) {
  if (!Array.isArray(evolutionManifest.evolutions)) {
    failures.push('Evolution manifest must define an evolutions array.');
    return;
  }

  const expectedGuideNames = evolutionManifest.evolutions
    .map((evolution) => `${evolution.name}.md`)
    .sort();
  const actualGuideNames = readdirSync(EVOLUTION_GUIDES_ROOT)
    .filter((name) => extname(name) === '.md' && name !== 'README.md')
    .sort();

  if (expectedGuideNames.join('\n') !== actualGuideNames.join('\n')) {
    failures.push(
      `Evolution CLI guides do not match the manifest. Expected: ${expectedGuideNames.join(', ')}. Found: ${actualGuideNames.join(', ')}.`,
    );
  }

  const schematicsGuide = readFileSync(SCHEMATICS_GUIDE_PATH, 'utf8');

  for (const evolution of evolutionManifest.evolutions) {
    const guidePath = resolve(EVOLUTION_GUIDES_ROOT, `${evolution.name}.md`);

    if (!existsSync(guidePath)) {
      failures.push(`Missing Evolution CLI guide: ${toRelativePath(guidePath)}.`);
      continue;
    }

    const guide = readFileSync(guidePath, 'utf8');
    const expectedCommand = `--name ${evolution.name}`;
    const expectedGuideLink = `./evolution-cli/${evolution.name}.md`;

    if (!guide.includes(expectedCommand)) {
      failures.push(
        `${toRelativePath(guidePath)} must include a command using "${expectedCommand}".`,
      );
    }

    if (evolution.referenceBranch && !guide.includes(evolution.referenceBranch)) {
      failures.push(
        `${toRelativePath(guidePath)} must reference branch "${evolution.referenceBranch}".`,
      );
    }

    if (!schematicsGuide.includes(expectedGuideLink)) {
      failures.push(
        `docs/schematics.md must link to ${expectedGuideLink} for "${evolution.name}".`,
      );
    }

    if (!guide.includes(STANDARD_GUIDE_MARKER)) {
      failures.push(`${toRelativePath(guidePath)} must declare the standard guide marker.`);
      continue;
    }

    validateStandardGuideHeadings(guidePath, guide);
  }
}

function validateStandardGuideHeadings(guidePath, guide) {
  const headings = new Set(
    [...guide.matchAll(/^##\s+(.+)$/gm)].map((match) => normalizeHeadingText(match[1])),
  );

  for (const requiredHeading of STANDARD_GUIDE_HEADINGS) {
    if (!headings.has(normalizeHeadingText(requiredHeading))) {
      failures.push(
        `${toRelativePath(guidePath)} uses the standard guide marker but is missing "## ${requiredHeading}".`,
      );
    }
  }
}

function validateLocalMarkdownLinks(files) {
  for (const markdownPath of files) {
    const content = readFileSync(markdownPath, 'utf8');

    for (const match of content.matchAll(/!?\[[^\]]*]\(([^)]+)\)/g)) {
      const rawTarget = match[1].trim().replace(/^<|>$/g, '');

      if (!rawTarget || rawTarget.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(rawTarget)) {
        continue;
      }

      const [rawPath, rawAnchor] = rawTarget.split('#', 2);
      const decodedPath = decodeURIComponent(rawPath);
      const targetPath = resolve(dirname(markdownPath), decodedPath);

      if (!existsSync(targetPath)) {
        failures.push(
          `${toRelativePath(markdownPath)} links to missing local target "${rawTarget}".`,
        );
        continue;
      }

      if (rawAnchor && statSync(targetPath).isFile() && extname(targetPath) === '.md') {
        const anchors = collectMarkdownAnchors(readFileSync(targetPath, 'utf8'));

        if (!anchors.has(decodeURIComponent(rawAnchor).toLowerCase())) {
          failures.push(
            `${toRelativePath(markdownPath)} links to missing anchor "#${rawAnchor}" in ${toRelativePath(targetPath)}.`,
          );
        }
      }
    }
  }
}

function collectMarkdownFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(entryPath));
    } else if (entry.isFile() && extname(entry.name) === '.md') {
      files.push(entryPath);
    }
  }

  return files;
}

function collectMarkdownAnchors(content) {
  const anchors = new Set();
  const counts = new Map();

  for (const match of content.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const baseAnchor = createMarkdownAnchor(match[1]);
    const count = counts.get(baseAnchor) ?? 0;
    const anchor = count === 0 ? baseAnchor : `${baseAnchor}-${count}`;

    counts.set(baseAnchor, count + 1);
    anchors.add(anchor);
  }

  return anchors;
}

function createMarkdownAnchor(value) {
  return normalizeHeadingText(value)
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

function normalizeHeadingText(value) {
  return value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .trim()
    .toLowerCase();
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    failures.push(
      `Cannot read ${toRelativePath(path)}: ${error instanceof Error ? error.message : String(error)}.`,
    );
    return { evolutions: [] };
  }
}

function toRelativePath(path) {
  return relative(ROOT, path).split(sep).join('/');
}
