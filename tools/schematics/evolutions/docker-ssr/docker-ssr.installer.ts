import { SchematicsException, type Tree } from '@angular-devkit/schematics';

import { EvolutionUserActionRequiredError } from '../evolution-definition';

const ANGULAR_JSON_PATH = '/angular.json';
const PACKAGE_JSON_PATH = '/package.json';
const PACKAGE_LOCK_PATH = '/package-lock.json';
const SERVER_PATH = '/src/server.ts';
const STARTER_PROJECT_NAME = 'angular-enterprise-starter';

export interface DockerSsrInspection {
  readonly blockingNotes: readonly string[];
  readonly existingFiles: readonly string[];
}

export const DOCKER_SSR_FILES = [
  {
    path: '/Dockerfile',
    content: `FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app

COPY --from=build /app/dist/angular-enterprise-starter ./dist/angular-enterprise-starter

EXPOSE 4000

CMD ["node", "dist/angular-enterprise-starter/server/server.mjs"]
`,
  },
  {
    path: '/.dockerignore',
    content: `node_modules
dist
.angular
.git
.github
.vscode
.idea

npm-debug.log*
Dockerfile
.dockerignore

coverage
*.local
`,
  },
] as const;

export function installDockerSsrEvolution(tree: Tree): void {
  const inspection = inspectDockerSsrEvolution(tree);

  if (inspection.blockingNotes.length > 0) {
    throw new EvolutionUserActionRequiredError(
      `Docker SSR preflight failed:\n- ${inspection.blockingNotes.join('\n- ')}`,
    );
  }

  for (const file of DOCKER_SSR_FILES) {
    createFile(tree, file.path, file.content);
  }
}

export function inspectDockerSsrEvolution(tree: Tree): DockerSsrInspection {
  const existingFiles = DOCKER_SSR_FILES.filter((file) => tree.exists(file.path)).map(
    (file) => file.path,
  );
  const blockingNotes = existingFiles.map(
    (path) => `${toDisplayPath(path)} already exists and will not be overwritten.`,
  );

  if (!tree.exists(PACKAGE_LOCK_PATH)) {
    blockingNotes.push(
      'package-lock.json is required because the generated Dockerfile runs npm ci.',
    );
  }

  inspectPackageBuildScript(tree, blockingNotes);
  inspectAngularSsrConfiguration(tree, blockingNotes);

  if (!tree.exists(SERVER_PATH)) {
    blockingNotes.push(
      'src/server.ts is required because the generated image runs the Angular Node SSR server.',
    );
  }

  return { blockingNotes, existingFiles };
}

function createFile(tree: Tree, path: string, content: string): void {
  if (tree.exists(path)) {
    throw new SchematicsException(`Cannot create ${path}. File already exists.`);
  }

  tree.create(path, content);
}

function inspectPackageBuildScript(tree: Tree, blockingNotes: string[]): void {
  const packageJson = readJsonObject(tree, PACKAGE_JSON_PATH, 'package.json', blockingNotes);

  if (!packageJson) {
    return;
  }

  const scripts = packageJson['scripts'];
  const buildScript = isRecord(scripts) ? scripts['build'] : undefined;

  if (typeof buildScript !== 'string' || !buildScript.trim()) {
    blockingNotes.push(
      'package.json must define a non-empty build script because the generated Dockerfile runs npm run build.',
    );
  }
}

function inspectAngularSsrConfiguration(tree: Tree, blockingNotes: string[]): void {
  const angularJson = readJsonObject(tree, ANGULAR_JSON_PATH, 'angular.json', blockingNotes);

  if (!angularJson) {
    return;
  }

  const projects = angularJson['projects'];
  const project = isRecord(projects) ? projects[STARTER_PROJECT_NAME] : undefined;
  const architect = isRecord(project) ? project['architect'] : undefined;
  const build = isRecord(architect) ? architect['build'] : undefined;
  const options = isRecord(build) ? build['options'] : undefined;
  const ssr = isRecord(options) ? options['ssr'] : undefined;
  const hasSupportedSsrConfiguration =
    isRecord(options) &&
    options['server'] === 'src/main.server.ts' &&
    options['outputMode'] === 'server' &&
    isRecord(ssr) &&
    ssr['entry'] === 'src/server.ts';

  if (!hasSupportedSsrConfiguration) {
    blockingNotes.push(
      `angular.json must define the ${STARTER_PROJECT_NAME} server build with outputMode "server" and SSR entry "src/server.ts".`,
    );
  }
}

function readJsonObject(
  tree: Tree,
  path: string,
  label: string,
  blockingNotes: string[],
): Record<string, unknown> | undefined {
  if (!tree.exists(path)) {
    blockingNotes.push(`${label} is required by the Docker SSR evolution.`);
    return undefined;
  }

  try {
    const value = JSON.parse(tree.readText(path)) as unknown;

    if (!isRecord(value)) {
      blockingNotes.push(`${label} must contain a JSON object.`);
      return undefined;
    }

    return value;
  } catch {
    blockingNotes.push(`${label} contains invalid JSON.`);
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toDisplayPath(path: string): string {
  return path.replace(/^\//, '');
}
