import { type EvolutionName } from '../evolution/schema';
import { getEvolutionManifestEntry } from '../evolution/evolution-manifest';
import { installAiGenkitEvolution } from './ai-genkit/ai-genkit.installer';
import { getAiGenkitPreview } from './ai-genkit/ai-genkit.preview';
import { installBootstrapEvolution } from './bootstrap/bootstrap.installer';
import { getBootstrapPreview } from './bootstrap/bootstrap.preview';
import { installDockerSsrEvolution } from './docker-ssr/docker-ssr.installer';
import { getDockerSsrPreview } from './docker-ssr/docker-ssr.preview';
import { type EvolutionDefinition } from './evolution-definition';
import { installLayoutShellEvolution } from './layout-shell/layout-shell.installer';
import { getLayoutShellPreview } from './layout-shell/layout-shell.preview';
import { installRuntimeConfigEvolution } from './runtime-config/runtime-config.installer';
import { getRuntimeConfigPreview } from './runtime-config/runtime-config.preview';
import {
  getSignalStorePreview,
  installSignalStoreEvolution,
} from './signal-store/signal-store.installer';
import { installTailwindEvolution } from './tailwind/tailwind.installer';
import { getTailwindPreview } from './tailwind/tailwind.preview';
import { installTranslocoEvolution } from './transloco/transloco.installer';
import { getTranslocoPreview } from './transloco/transloco.preview';

const GITHUB_REPOSITORY_URL = 'https://github.com/FilippoLacagnina/angular-enterprise-starter';

const EVOLUTION_REGISTRY: Record<EvolutionName, EvolutionDefinition> = {
  transloco: {
    name: 'transloco',
    ...getManifestDefinitionMetadata('transloco'),
    creates: [
      'src/app/core/i18n/i18n.config.ts',
      'src/app/core/i18n/i18n.provider.ts',
      'src/app/core/i18n/transloco-http-loader.ts',
      'src/assets/i18n/<language>.json',
    ],
    updates: [
      'package.json',
      'angular.json',
      'src/app/app.config.ts',
      '.angular-enterprise-starter.json',
    ],
    notes: ['Adds a configurable runtime i18n baseline without changing existing feature texts.'],
    preview: getTranslocoPreview,
    install: installTranslocoEvolution,
  },
  'runtime-config': {
    name: 'runtime-config',
    ...getManifestDefinitionMetadata('runtime-config'),
    creates: [
      'src/assets/config/values.yml',
      'src/app/core/runtime-config/runtime-config.model.ts',
      'src/app/core/runtime-config/runtime-config.parser.ts',
      'src/app/core/runtime-config/runtime-config.provider.ts',
      'src/app/core/runtime-config/runtime-config.service.ts',
      'src/app/core/runtime-config/runtime-config.token.ts',
    ],
    updates: [
      'package.json',
      'angular.json',
      'src/app/app.config.ts',
      'src/app/features/dashboard/services/dashboard.service.ts',
      'tsconfig.spec.json',
      '.angular-enterprise-starter.json',
    ],
    notes: [
      'Replaces Angular environment-file configuration with deployable runtime values.yml loading.',
      'Changes the configuration strategy, so it should be selected early.',
      'Updates the baseline DashboardService when it still uses the default APP_CONFIG pattern.',
    ],
    preview: getRuntimeConfigPreview,
    install: installRuntimeConfigEvolution,
  },
  'layout-shell': {
    name: 'layout-shell',
    ...getManifestDefinitionMetadata('layout-shell'),
    creates: [
      'src/app/layout/layout.model.ts',
      'src/app/layout/layout.config.ts',
      'src/app/layout/<selected-component>/*',
    ],
    updates: [
      'src/app/app.ts',
      'src/app/app.html',
      'src/app/app.spec.ts',
      'src/app/layout/<selected-component>/*',
      '.angular-enterprise-starter.json',
    ],
    notes: [
      'Adds a configurable application shell without requiring a design system.',
      'Can retain only selected pristine layout regions or generate a content-only root.',
      'Stops before replacing, deleting or combining customized layout files.',
    ],
    preview: getLayoutShellPreview,
    install: installLayoutShellEvolution,
  },
  'signal-store': {
    name: 'signal-store',
    ...getManifestDefinitionMetadata('signal-store'),
    creates: [
      'src/app/features/dashboard/state/dashboard.state.ts',
      'src/app/features/dashboard/state/dashboard.store.ts',
    ],
    updates: ['package.json', '.angular-enterprise-starter.json'],
    notes: ['Adds a feature-scoped SignalStore example and state management conventions.'],
    preview: getSignalStorePreview,
    install: installSignalStoreEvolution,
  },
  'docker-ssr': {
    name: 'docker-ssr',
    ...getManifestDefinitionMetadata('docker-ssr'),
    creates: ['Dockerfile', '.dockerignore'],
    updates: ['.angular-enterprise-starter.json'],
    notes: ['Adds an SSR-oriented container baseline for production delivery.'],
    preview: getDockerSsrPreview,
    install: installDockerSsrEvolution,
  },
  bootstrap: {
    name: 'bootstrap',
    ...getManifestDefinitionMetadata('bootstrap'),
    creates: ['src/app/shared/components/bootstrap/*'],
    updates: ['package.json', 'src/styles.scss', '.angular-enterprise-starter.json'],
    notes: [
      'Adds Bootstrap as an optional design-system baseline.',
      'Generates selected starter-owned Angular standalone wrappers.',
      'Preserves existing global styles and adds the Bootstrap import only if missing.',
    ],
    preview: getBootstrapPreview,
    install: installBootstrapEvolution,
  },
  tailwind: {
    name: 'tailwind',
    ...getManifestDefinitionMetadata('tailwind'),
    creates: ['.postcssrc.json', 'src/app/shared/components/tailwind/*'],
    updates: ['package.json', 'src/styles.scss', '.angular-enterprise-starter.json'],
    notes: [
      'Adds Tailwind CSS v4 with PostCSS integration.',
      'Generates selected starter-owned Angular standalone wrappers.',
      'Preserves existing global styles and adds the Tailwind import only if missing.',
    ],
    preview: getTailwindPreview,
    install: installTailwindEvolution,
  },
  'ai-genkit': {
    name: 'ai-genkit',
    ...getManifestDefinitionMetadata('ai-genkit'),
    creates: ['src/server/ai/*', 'src/app/features/ai-summary/*', 'src/contracts/ai/*'],
    updates: [
      'package.json',
      '.env.example',
      '.gitignore',
      'src/server.ts',
      'src/app/app.routes.ts',
      '.angular-enterprise-starter.json',
    ],
    notes: [
      'Adds a server-only Genkit foundation with a provider registry and Google AI adapter.',
      'Can install the foundation alone or include a removable summary example.',
      'Never writes provider credentials or exposes them through Angular configuration.',
    ],
    preview: getAiGenkitPreview,
    install: installAiGenkitEvolution,
  },
};

function getManifestDefinitionMetadata(
  evolutionName: EvolutionName,
): Pick<
  EvolutionDefinition,
  'dependencies' | 'label' | 'referenceBranch' | 'referenceUrl' | 'repeatable'
> {
  const manifestEntry = getEvolutionManifestEntry(evolutionName);
  const referenceBranch = manifestEntry.referenceBranch;

  return {
    dependencies: manifestEntry.dependencies.map((dependency) => dependency.name),
    label: manifestEntry.label,
    repeatable: manifestEntry.repeatable,
    ...(referenceBranch
      ? {
          referenceBranch,
          referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/${referenceBranch}`,
        }
      : {}),
  };
}

export function getEvolutionDefinition(evolutionName: EvolutionName): EvolutionDefinition {
  return EVOLUTION_REGISTRY[evolutionName];
}

export function getEvolutionDefinitions(): readonly EvolutionDefinition[] {
  return Object.values(EVOLUTION_REGISTRY);
}
