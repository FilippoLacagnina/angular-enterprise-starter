import { cpSync, copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../..');
const packageSourceRoot = resolve(repoRoot, 'tools/evolution-cli-package');
const packageOutputRoot = resolve(repoRoot, 'dist/evolution-cli-package');
const schematicsOutputRoot = resolve(repoRoot, 'dist/schematics');
const catalogOutputRoot = resolve(packageOutputRoot, 'catalog');
const rootPackageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));
const packageJson = JSON.parse(readFileSync(resolve(packageSourceRoot, 'package.json'), 'utf8'));
const require = createRequire(import.meta.url);

rmSync(packageOutputRoot, { recursive: true, force: true });
mkdirSync(resolve(packageOutputRoot, 'bin'), { recursive: true });

packageJson.version = rootPackageJson.version;

writeFileSync(
  resolve(packageOutputRoot, 'package.json'),
  `${JSON.stringify(packageJson, null, 2)}\n`,
);
copyFileSync(resolve(packageSourceRoot, 'README.md'), resolve(packageOutputRoot, 'README.md'));
copyFileSync(
  resolve(packageSourceRoot, 'bin/angular-enterprise-starter.mjs'),
  resolve(packageOutputRoot, 'bin/angular-enterprise-starter.mjs'),
);
copyFileSync(
  resolve(repoRoot, 'tools/schematics/starter-evolution.mjs'),
  resolve(packageOutputRoot, 'bin/starter-evolution.mjs'),
);
copyFileSync(
  resolve(repoRoot, 'tools/schematics/starter-evolution-cli.mjs'),
  resolve(packageOutputRoot, 'bin/starter-evolution-cli.mjs'),
);
cpSync(schematicsOutputRoot, resolve(packageOutputRoot, 'schematics'), { recursive: true });

mkdirSync(catalogOutputRoot, { recursive: true });

emitDesignSystemDataModule({
  fileName: 'design-system-catalog',
  dataExportName: 'designSystemCatalog',
  constantExportNames: ['DESIGN_SYSTEM_CATALOG_SCHEMA_VERSION'],
});
emitDesignSystemDataModule({
  fileName: 'design-system-sources',
  dataExportName: 'designSystemSources',
  constantExportNames: [
    'DESIGN_SYSTEM_SOURCES_SCHEMA_VERSION',
    'DESIGN_SYSTEM_SOURCES_HASH_ALGORITHM',
  ],
});

console.log(`Evolution CLI package assembled at ${packageOutputRoot}`);

function emitDesignSystemDataModule({ fileName, dataExportName, constantExportNames }) {
  const sourceRoot = resolve(schematicsOutputRoot, 'evolutions/design-system');
  const sourceModule = require(resolve(sourceRoot, `${fileName}.js`));
  const data = sourceModule[dataExportName];

  if (data === undefined) {
    throw new Error(`Missing ${dataExportName} export in compiled ${fileName} module.`);
  }

  const constantExports = constantExportNames.map((exportName) => {
    const value = sourceModule[exportName];

    if (value === undefined) {
      throw new Error(`Missing ${exportName} export in compiled ${fileName} module.`);
    }

    return `export const ${exportName} = ${JSON.stringify(value)};`;
  });
  const moduleContent = [
    ...constantExports,
    `export const ${dataExportName} = ${JSON.stringify(data, null, 2)};`,
    '',
    `export default ${dataExportName};`,
    '',
  ].join('\n');

  writeFileSync(
    resolve(catalogOutputRoot, `${fileName}.json`),
    `${JSON.stringify(data, null, 2)}\n`,
  );
  writeFileSync(resolve(catalogOutputRoot, `${fileName}.mjs`), moduleContent);
  copyFileSync(
    resolve(sourceRoot, `${fileName}.d.ts`),
    resolve(catalogOutputRoot, `${fileName}.d.ts`),
  );
}
