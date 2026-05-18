import { type EvolutionName } from '../evolution/schema';
import { type EvolutionDefinition } from './evolution-definition';
import { installSignalStoreEvolution } from './signal-store/signal-store.installer';

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
  },
  'signal-store': {
    name: 'signal-store',
    label: 'SignalStore',
    dependencies: ['@ngrx/signals'],
    creates: [
      'src/app/features/dashboard/state/dashboard.state.ts',
      'src/app/features/dashboard/state/dashboard.store.ts',
    ],
    updates: ['package.json', '.angular-enterprise-starter.json'],
    notes: ['Adds a feature-scoped SignalStore example and state management conventions.'],
    install: installSignalStoreEvolution,
  },
  'docker-ssr': {
    name: 'docker-ssr',
    label: 'Docker SSR',
    dependencies: [],
    creates: ['Dockerfile', '.dockerignore', 'docs/docker-ssr.md'],
    updates: ['.angular-enterprise-starter.json'],
    notes: ['Adds an SSR-oriented container baseline for production delivery.'],
  },
  bootstrap: {
    name: 'bootstrap',
    label: 'Bootstrap',
    dependencies: ['bootstrap'],
    creates: ['docs/bootstrap.md'],
    updates: [
      'package.json',
      'package-lock.json',
      'src/styles.scss',
      '.angular-enterprise-starter.json',
    ],
    notes: ['Adds Bootstrap as an optional design-system baseline.'],
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
  },
};

export function getEvolutionDefinition(evolutionName: EvolutionName): EvolutionDefinition {
  return EVOLUTION_REGISTRY[evolutionName];
}

export function getEvolutionDefinitions(): readonly EvolutionDefinition[] {
  return Object.values(EVOLUTION_REGISTRY);
}
