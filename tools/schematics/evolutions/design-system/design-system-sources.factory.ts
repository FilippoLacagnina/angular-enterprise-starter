import { createHash } from 'node:crypto';
import { posix } from 'node:path';

import { type DesignSystemComponentDefinition } from './design-system.model';
import {
  type DesignSystemComponentSources,
  type DesignSystemProviderSources,
  type DesignSystemSources,
  type DesignSystemSourceStyle,
} from './design-system-sources';

export interface DesignSystemSourceProviderDefinition {
  readonly id: string;
  readonly evolutionName: string;
  readonly style: DesignSystemSourceStyle;
  readonly components: readonly DesignSystemComponentDefinition[];
}

export function createDesignSystemSources(
  providerDefinitions: readonly DesignSystemSourceProviderDefinition[],
): DesignSystemSources {
  assertUnique(
    providerDefinitions.map((provider) => provider.id),
    'provider id',
  );

  return {
    schemaVersion: 1,
    hashAlgorithm: 'sha256',
    providers: providerDefinitions.map(createProviderSources),
  };
}

function createProviderSources(
  providerDefinition: DesignSystemSourceProviderDefinition,
): DesignSystemProviderSources {
  assertNonEmpty(providerDefinition.id, 'provider id');
  assertNonEmpty(providerDefinition.evolutionName, 'evolution name');

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(providerDefinition.id)) {
    throw new Error(`Unsafe design-system provider id "${providerDefinition.id}".`);
  }

  assertUnique(
    providerDefinition.components.map((component) => component.name),
    `component id for provider "${providerDefinition.id}"`,
  );

  const style = normalizeStyle(providerDefinition.style);
  const components = providerDefinition.components.map((component) =>
    createComponentSources(providerDefinition.id, component),
  );

  return {
    id: providerDefinition.id,
    evolutionName: providerDefinition.evolutionName,
    style,
    components,
    sourceHash: hash(
      JSON.stringify({
        style,
        components: components
          .map((component) => [component.id, component.sourceHash] as const)
          .sort(([left], [right]) => compareStrings(left, right)),
      }),
    ),
  };
}

function createComponentSources(
  providerId: string,
  component: DesignSystemComponentDefinition,
): DesignSystemComponentSources {
  assertNonEmpty(component.name, `component id for provider "${providerId}"`);
  assertNonEmpty(component.className, `class name for component "${component.name}"`);
  assertNonEmpty(component.exportPath, `export path for component "${component.name}"`);

  const files = component.files
    .map((file) => ({
      relativePath: createRelativePath(providerId, component.name, file.path),
      content: normalizeLineEndings(file.content),
    }))
    .sort((left, right) => compareStrings(left.relativePath, right.relativePath));

  if (files.length === 0) {
    throw new Error(`Design-system component "${component.name}" has no runtime files.`);
  }

  assertUnique(
    files.map((file) => file.relativePath),
    `runtime file path for component "${component.name}"`,
  );

  for (const file of files) {
    if (/\.(?:html|ts)$/.test(file.relativePath) && file.content.length === 0) {
      throw new Error(
        `Design-system runtime file "${file.relativePath}" for component "${component.name}" cannot be empty.`,
      );
    }
  }

  return {
    id: component.name,
    className: component.className,
    exportPath: component.exportPath,
    sourceHash: hash(
      JSON.stringify(files.map((file) => [file.relativePath, file.content] as const)),
    ),
    files,
  };
}

function createRelativePath(providerId: string, componentId: string, sourcePath: string): string {
  const providerRoot = `/src/app/shared/components/${providerId}`;

  if (!sourcePath.startsWith('/') || sourcePath.includes('\\') || sourcePath.includes('\0')) {
    throw new Error(
      `Unsafe design-system source path "${sourcePath}" for component "${componentId}".`,
    );
  }

  const normalizedSourcePath = posix.normalize(sourcePath);

  if (normalizedSourcePath !== sourcePath) {
    throw new Error(
      `Design-system source path "${sourcePath}" for component "${componentId}" is not normalized.`,
    );
  }

  const relativePath = posix.relative(providerRoot, normalizedSourcePath);
  const pathSegments = relativePath.split('/');

  if (
    !relativePath ||
    posix.isAbsolute(relativePath) ||
    relativePath !== posix.normalize(relativePath) ||
    pathSegments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error(
      `Design-system source path "${sourcePath}" is outside provider "${providerId}" or is unsafe.`,
    );
  }

  return relativePath;
}

function normalizeStyle(style: DesignSystemSourceStyle): DesignSystemSourceStyle {
  const dependencies = [...style.dependencies]
    .map((dependency) => ({ ...dependency }))
    .sort(
      (left, right) =>
        compareStrings(left.target, right.target) || compareStrings(left.name, right.name),
    );

  assertUnique(
    dependencies.map((dependency) => dependency.name),
    'design-system style dependency',
  );

  if (style.strategy === 'package-css') {
    return {
      strategy: style.strategy,
      dependencies,
      entryPoint: style.entryPoint,
    };
  }

  return {
    strategy: style.strategy,
    dependencies,
    entryPoint: style.entryPoint,
    postcssPlugin: style.postcssPlugin,
  };
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/g, '\n');
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function assertNonEmpty(value: string, label: string): void {
  if (!value.trim()) {
    throw new Error(`Design-system ${label} cannot be empty.`);
  }
}

function assertUnique(values: readonly string[], label: string): void {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);

  if (duplicate !== undefined) {
    throw new Error(`Duplicate ${label} "${duplicate}".`);
  }
}
