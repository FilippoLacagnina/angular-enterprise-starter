import { type EvolutionName } from '../evolution/schema';
import { installAiGenkitEvolution } from './ai-genkit/ai-genkit.installer';
import { getAiGenkitPreview } from './ai-genkit/ai-genkit.preview';
import { installBootstrapEvolution } from './bootstrap/bootstrap.installer';
import { getBootstrapPreview } from './bootstrap/bootstrap.preview';
import { installDockerSsrEvolution } from './docker-ssr/docker-ssr.installer';
import { type EvolutionDefinition } from './evolution-definition';
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
    label: 'Transloco i18n',
    dependencies: ['@jsverse/transloco'],
    creates: [
      'src/app/core/i18n/i18n.provider.ts',
      'src/app/core/i18n/transloco-http-loader.ts',
      'src/assets/i18n/en.json',
      'src/assets/i18n/it.json',
    ],
    updates: [
      'package.json',
      'angular.json',
      'src/app/app.config.ts',
      '.angular-enterprise-starter.json',
    ],
    notes: ['Adds a runtime i18n baseline without changing existing feature texts.'],
    referenceBranch: 'evo/i18n/transloco',
    referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/evo/i18n/transloco`,
    preview: getTranslocoPreview,
    install: installTranslocoEvolution,
  },
  'runtime-config': {
    name: 'runtime-config',
    label: 'Runtime config',
    dependencies: ['yaml'],
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
    referenceBranch: 'evo/config/runtime-config',
    referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/evo/config/runtime-config`,
    preview: getRuntimeConfigPreview,
    install: installRuntimeConfigEvolution,
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
    repeatable: true,
    dependencies: ['bootstrap'],
    creates: ['src/app/shared/components/bootstrap/*'],
    updates: ['package.json', 'src/styles.scss', '.angular-enterprise-starter.json'],
    notes: [
      'Adds Bootstrap as an optional design-system baseline.',
      'Generates selected starter-owned Angular standalone wrappers.',
      'Preserves existing global styles and adds the Bootstrap import only if missing.',
    ],
    referenceBranch: 'evo/design-system/bootstrap',
    referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/evo/design-system/bootstrap`,
    preview: getBootstrapPreview,
    install: installBootstrapEvolution,
  },
  tailwind: {
    name: 'tailwind',
    label: 'Tailwind',
    repeatable: true,
    dependencies: ['tailwindcss', '@tailwindcss/postcss', 'postcss'],
    creates: ['.postcssrc.json', 'src/app/shared/components/tailwind/*'],
    updates: ['package.json', 'src/styles.scss', '.angular-enterprise-starter.json'],
    notes: [
      'Adds Tailwind CSS v4 with PostCSS integration.',
      'Generates selected starter-owned Angular standalone wrappers.',
      'Preserves existing global styles and adds the Tailwind import only if missing.',
    ],
    referenceBranch: 'evo/design-system/tailwind',
    referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/evo/design-system/tailwind`,
    preview: getTailwindPreview,
    install: installTailwindEvolution,
  },
  'ai-genkit': {
    name: 'ai-genkit',
    label: 'AI Genkit',
    repeatable: true,
    dependencies: ['genkit', '@genkit-ai/google-genai'],
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
    referenceBranch: 'evo/ai/genkit',
    referenceUrl: `${GITHUB_REPOSITORY_URL}/tree/evo/ai/genkit`,
    preview: getAiGenkitPreview,
    install: installAiGenkitEvolution,
  },
};

export function getEvolutionDefinition(evolutionName: EvolutionName): EvolutionDefinition {
  return EVOLUTION_REGISTRY[evolutionName];
}

export function getEvolutionDefinitions(): readonly EvolutionDefinition[] {
  return Object.values(EVOLUTION_REGISTRY);
}
