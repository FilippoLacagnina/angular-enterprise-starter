import { SchematicsException } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import {
  AI_GENKIT_CORE_FILES,
  AI_GENKIT_PROVIDER_CATALOG_PATH,
  AI_GENKIT_PROVIDER_INSTALLERS,
  AI_GENKIT_SUMMARY_EXAMPLE_FILES,
  DEFAULT_AI_GENKIT_MODEL,
  type AiGenkitExampleName,
  type AiGenkitInstallPlan,
  type AiGenkitProviderName,
} from './ai-genkit.model';

const MODEL_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;

export function createAiGenkitInstallPlan(options: EvolutionOptions): AiGenkitInstallPlan {
  const provider = options.aiProvider ?? 'google-ai';
  const example = options.aiExample ?? 'none';
  const model = options.aiModel?.trim() || DEFAULT_AI_GENKIT_MODEL;

  assertProvider(provider);
  assertExample(example);
  const providerInstaller = AI_GENKIT_PROVIDER_INSTALLERS[provider];

  if (!MODEL_PATTERN.test(model)) {
    throw new SchematicsException(
      'AI model identifiers may contain only letters, numbers, dots, underscores and hyphens.',
    );
  }

  return {
    example,
    files:
      example === 'summary'
        ? [
            ...AI_GENKIT_CORE_FILES,
            AI_GENKIT_PROVIDER_CATALOG_PATH,
            ...providerInstaller.files,
            ...AI_GENKIT_SUMMARY_EXAMPLE_FILES,
          ]
        : [...AI_GENKIT_CORE_FILES, AI_GENKIT_PROVIDER_CATALOG_PATH, ...providerInstaller.files],
    model,
    provider,
  };
}

function assertProvider(value: string): asserts value is AiGenkitProviderName {
  if (value !== 'google-ai') {
    throw new SchematicsException(`Unsupported AI provider: ${value}.`);
  }
}

function assertExample(value: string): asserts value is AiGenkitExampleName {
  if (value !== 'none' && value !== 'summary') {
    throw new SchematicsException(`Unsupported AI example: ${value}.`);
  }
}
