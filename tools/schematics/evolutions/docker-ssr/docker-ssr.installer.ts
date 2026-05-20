import { SchematicsException, type Tree } from '@angular-devkit/schematics';

export function installDockerSsrEvolution(tree: Tree): void {
  createFile(
    tree,
    '/Dockerfile',
    `FROM node:22-alpine AS dependencies

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
  );

  createFile(
    tree,
    '/.dockerignore',
    `node_modules
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
  );
}

function createFile(tree: Tree, path: string, content: string): void {
  if (tree.exists(path)) {
    throw new SchematicsException(`Cannot create ${path}. File already exists.`);
  }

  tree.create(path, content);
}
