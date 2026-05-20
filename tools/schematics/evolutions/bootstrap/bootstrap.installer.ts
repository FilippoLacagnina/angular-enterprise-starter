import { SchematicsException, type Tree } from '@angular-devkit/schematics';

const BOOTSTRAP_VERSION = '^5.3.8';
const BOOTSTRAP_STYLE_IMPORT = "@import 'bootstrap/dist/css/bootstrap.min.css';";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export function installBootstrapEvolution(tree: Tree): void {
  addPackageDependency(tree, 'bootstrap', BOOTSTRAP_VERSION);
  addBootstrapStyleImport(tree);
}

function addPackageDependency(tree: Tree, packageName: string, version: string): void {
  const packageJsonPath = '/package.json';

  if (!tree.exists(packageJsonPath)) {
    throw new SchematicsException('Missing package.json. Cannot add Bootstrap dependency.');
  }

  const packageJson = JSON.parse(tree.readText(packageJsonPath)) as PackageJson;

  if (packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName]) {
    return;
  }

  packageJson.dependencies = sortObject({
    ...packageJson.dependencies,
    [packageName]: version,
  });

  tree.overwrite(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function addBootstrapStyleImport(tree: Tree): void {
  const stylesPath = '/src/styles.scss';

  if (!tree.exists(stylesPath)) {
    tree.create(stylesPath, `${BOOTSTRAP_STYLE_IMPORT}\n`);
    return;
  }

  const stylesContent = tree.readText(stylesPath);

  if (hasBootstrapImport(stylesContent)) {
    return;
  }

  const nextContent = stylesContent.trim()
    ? `${BOOTSTRAP_STYLE_IMPORT}\n\n${stylesContent}`
    : `${BOOTSTRAP_STYLE_IMPORT}\n`;

  tree.overwrite(stylesPath, nextContent);
}

function hasBootstrapImport(stylesContent: string): boolean {
  return /bootstrap\/(dist\/css\/bootstrap(\.min)?\.css|scss\/bootstrap)/.test(stylesContent);
}

function sortObject(value: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).sort(([first], [second]) => first.localeCompare(second)),
  );
}
