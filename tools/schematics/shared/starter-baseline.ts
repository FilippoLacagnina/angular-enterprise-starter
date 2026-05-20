import { SchematicsException, type Tree } from '@angular-devkit/schematics';

const STARTER_METADATA_PATH = '/.angular-enterprise-starter.json';
const REQUIRED_DIRECTORIES = [
  '/src/app/core',
  '/src/app/shared',
  '/src/app/layout',
  '/src/app/features',
];

export interface StarterMetadata {
  readonly schemaVersion: number;
  readonly baselineVersion: string;
  readonly enabledEvolutions: readonly string[];
}

export function validateStarterBaseline(tree: Tree): void {
  const metadata = readStarterMetadata(tree);

  if (metadata.schemaVersion !== 1) {
    throw new SchematicsException(
      `Unsupported Angular Enterprise Starter schema version: ${metadata.schemaVersion}`,
    );
  }

  for (const directory of REQUIRED_DIRECTORIES) {
    if (!tree.exists(`${directory}/.gitkeep`) && !hasFilesInDirectory(tree, directory)) {
      throw new SchematicsException(
        `This project does not look like an Angular Enterprise Starter workspace. Missing ${directory}.`,
      );
    }
  }
}

export function readStarterMetadata(tree: Tree): StarterMetadata {
  if (!tree.exists(STARTER_METADATA_PATH)) {
    throw new SchematicsException(
      'This project does not look like an Angular Enterprise Starter workspace. Missing .angular-enterprise-starter.json.',
    );
  }

  const metadataContent = tree.readText(STARTER_METADATA_PATH);

  try {
    return JSON.parse(metadataContent) as StarterMetadata;
  } catch {
    throw new SchematicsException('Invalid .angular-enterprise-starter.json file.');
  }
}

export function writeStarterMetadata(tree: Tree, metadata: StarterMetadata): void {
  tree.overwrite(STARTER_METADATA_PATH, `${JSON.stringify(metadata, null, 2)}\n`);
}

function hasFilesInDirectory(tree: Tree, directory: string): boolean {
  return tree.getDir(directory).subfiles.length > 0 || tree.getDir(directory).subdirs.length > 0;
}
