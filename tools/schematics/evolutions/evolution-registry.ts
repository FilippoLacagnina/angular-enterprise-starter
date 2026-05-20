import { type EvolutionName } from '../evolution/schema';
import { installBootstrapEvolution } from './bootstrap/bootstrap.installer';
import { installDockerSsrEvolution } from './docker-ssr/docker-ssr.installer';
import { type EvolutionDefinition } from './evolution-definition';
import {
  getSignalStorePreview,
  installSignalStoreEvolution,
} from './signal-store/signal-store.installer';

const GITHUB_REPOSITORY_URL = 'https://github.com/FilippoLacagnina/angular-enterprise-starter';

const EVOLUTION_REGISTRY: Record<EvolutionName, EvolutionDefinition> = {
  transloco: {
    name: 'transloco',
    label: 'Transloco i18n',
    dependencies: ['@jsverse/transloco'],
    creates: ['src/assets/i18n/en.json', 'src/assets/i18n/it.json', 'docs/i18n-transloco.md'],
    updates: [
      'package.json',
      'package-lock.json',
      'angular.json',
      'src/app/app.config.ts',
      '.angular-enterprise-starter.json',
    ],
    notes: ['Adds a runtime i18n baseline without changing existing feature texts.'],
    referenceBranch: 'evo/i18n/transloco',
    referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/evo/i18n/transloco`,
  },
  'runtime-config': {
    name: 'runtime-config',
    label: 'Runtime config',
    dependencies: ['runtime YAML parser dependency'],
    creates: [
      'src/assets/config/values.yml',
      'src/app/core/config/runtime-config.*',
      'docs/runtime-config.md',
    ],
    updates: ['angular.json', 'src/app/app.config.ts', '.angular-enterprise-starter.json'],
    notes: ['Changes the configuration strategy, so it should be selected early.'],
    referenceBranch: 'evo/config/runtime-config',
    referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/evo/config/runtime-config`,
  },
  'signal-store': {
    name: 'signal-store',
    label: 'SignalStore',
    repeatable: true,
    dependencies: ['@ngrx/signals'],
    creates: [
      'src/app/features/dashboard/state/dashboard.state.ts',
      'src/app/features/dashboard/state/dashboard.store.ts',
    ],
    updates: ['package.json', '.angular-enterprise-starter.json'],
    notes: ['Adds a feature-scoped SignalStore example and state management conventions.'],
    referenceBranch: 'evo/state/signal-store',
    referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/evo/state/signal-store`,
    preview: getSignalStorePreview,
    install: installSignalStoreEvolution,
  },
  'docker-ssr': {
    name: 'docker-ssr',
    label: 'Docker SSR',
    dependencies: [],
    creates: ['Dockerfile', '.dockerignore'],
    updates: ['.angular-enterprise-starter.json'],
    notes: ['Adds an SSR-oriented container baseline for production delivery.'],
    referenceBranch: 'evo/deployment/docker-ssr',
    referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/evo/deployment/docker-ssr`,
    install: installDockerSsrEvolution,
  },
  bootstrap: {
    name: 'bootstrap',
    label: 'Bootstrap',
    dependencies: ['bootstrap'],
    creates: [],
    updates: ['package.json', 'src/styles.scss', '.angular-enterprise-starter.json'],
    notes: [
      'Adds Bootstrap as an optional design-system baseline.',
      'Preserves existing global styles and adds the Bootstrap import only if missing.',
    ],
    referenceBranch: 'evo/design-system/bootstrap',
    referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/evo/design-system/bootstrap`,
    install: installBootstrapEvolution,
  },
  tailwind: {
    name: 'tailwind',
    label: 'Tailwind',
    dependencies: ['Tailwind CSS dependencies'],
    creates: ['.postcssrc.json', 'docs/tailwind.md'],
    updates: [
      'package.json',
      'package-lock.json',
      'src/styles.scss',
      '.angular-enterprise-starter.json',
    ],
    notes: ['Adds Tailwind CSS as an optional utility-first styling baseline.'],
    referenceBranch: 'evo/design-system/tailwind',
    referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/evo/design-system/tailwind`,
  },
};

export function getEvolutionDefinition(evolutionName: EvolutionName): EvolutionDefinition {
  return EVOLUTION_REGISTRY[evolutionName];
}

export function getEvolutionDefinitions(): readonly EvolutionDefinition[] {
  return Object.values(EVOLUTION_REGISTRY);
}
