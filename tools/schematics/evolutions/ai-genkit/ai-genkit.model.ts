export type AiGenkitProviderName = 'google-ai';
export type AiGenkitExampleName = 'none' | 'summary';

export interface AiGenkitDependency {
  readonly minimumMinor: number;
  readonly name: string;
  readonly supportedMajor: number;
  readonly version: string;
}

export interface AiGenkitProviderInstallerDefinition {
  readonly catalogEntry: string;
  readonly catalogImport: string;
  readonly dependencies: readonly AiGenkitDependency[];
  readonly environmentVariables: readonly string[];
  readonly files: readonly string[];
  readonly id: AiGenkitProviderName;
  createEnvironmentBlock(model: string): string;
}

export interface AiGenkitInstallPlan {
  readonly example: AiGenkitExampleName;
  readonly files: readonly string[];
  readonly model: string;
  readonly provider: AiGenkitProviderName;
}

export const DEFAULT_AI_GENKIT_MODEL = 'gemini-3.5-flash';
export const AI_GENKIT_PROVIDER_CATALOG_PATH = '/src/server/ai/providers/installed-ai-providers.ts';

export const AI_GENKIT_CORE_DEPENDENCIES: readonly AiGenkitDependency[] = [
  {
    minimumMinor: 39,
    name: 'genkit',
    supportedMajor: 1,
    version: '^1.39.0',
  },
];

export const AI_GENKIT_CORE_ENVIRONMENT_VARIABLES = [
  'AI_GENKIT_ENABLED',
  'AI_GENKIT_DEFAULT_PROVIDER',
  'AI_GENKIT_TIMEOUT_MS',
] as const;

export const AI_GENKIT_CORE_FILES = [
  '/src/server/ai/ai.runtime.ts',
  '/src/server/ai/config/ai-server.config.spec.ts',
  '/src/server/ai/config/ai-server.config.ts',
  '/src/server/ai/logging/genkit-logging.spec.ts',
  '/src/server/ai/logging/genkit-logging.ts',
  '/src/server/ai/providers/ai-provider.definition.ts',
  '/src/server/ai/providers/ai-provider.error.ts',
  '/src/server/ai/providers/ai-provider.registry.spec.ts',
  '/src/server/ai/providers/ai-provider.registry.ts',
  '/src/server/ai/providers/ai-provider.ts',
] as const;

const GOOGLE_AI_PROVIDER_FILES = [
  '/src/server/ai/providers/google-gemini.provider.definition.ts',
  '/src/server/ai/providers/google-gemini.provider.spec.ts',
  '/src/server/ai/providers/google-gemini.provider.ts',
] as const;

export const AI_GENKIT_PROVIDER_INSTALLERS: Readonly<
  Record<AiGenkitProviderName, AiGenkitProviderInstallerDefinition>
> = {
  'google-ai': {
    id: 'google-ai',
    catalogImport:
      "import { googleGeminiProviderDefinition } from './google-gemini.provider.definition';",
    catalogEntry: 'googleGeminiProviderDefinition,',
    dependencies: [
      {
        minimumMinor: 39,
        name: '@genkit-ai/google-genai',
        supportedMajor: 1,
        version: '^1.39.0',
      },
    ],
    environmentVariables: [
      'AI_GENKIT_GOOGLE_AI_ENABLED',
      'AI_GENKIT_GOOGLE_AI_MODEL',
      'GEMINI_API_KEY',
    ],
    files: GOOGLE_AI_PROVIDER_FILES,
    createEnvironmentBlock: (model) => `AI_GENKIT_GOOGLE_AI_ENABLED=true
AI_GENKIT_GOOGLE_AI_MODEL=${model}
GEMINI_API_KEY=replace-with-server-side-api-key
`,
  },
};

export const AI_GENKIT_SUMMARY_ENVIRONMENT_VARIABLES = [
  'AI_GENKIT_ALLOW_UNAUTHENTICATED_EXAMPLE',
] as const;

export const AI_GENKIT_SUMMARY_EXAMPLE_FILES = [
  '/src/contracts/ai/ai-api.contract.ts',
  '/src/contracts/ai/summary.contract.ts',
  '/src/server/ai/http/ai-error.mapper.spec.ts',
  '/src/server/ai/http/ai-error.mapper.ts',
  '/src/server/ai/http/ai-request-lifecycle.ts',
  '/src/server/ai/http/ai-stream.writer.spec.ts',
  '/src/server/ai/http/ai-stream.writer.ts',
  '/src/server/ai/logging/ai-request.logger.spec.ts',
  '/src/server/ai/logging/ai-request.logger.ts',
  '/src/server/ai/examples/summary/summary-stream.flow.spec.ts',
  '/src/server/ai/examples/summary/summary-stream.flow.ts',
  '/src/server/ai/examples/summary/summary.flow.spec.ts',
  '/src/server/ai/examples/summary/summary.flow.ts',
  '/src/server/ai/examples/summary/summary.prompt.ts',
  '/src/server/ai/examples/summary/summary.routes.spec.ts',
  '/src/server/ai/examples/summary/summary.routes.ts',
  '/src/server/ai/examples/summary/summary.runtime.ts',
  '/src/server/ai/examples/summary/summary.schema.ts',
  '/src/app/features/ai-summary/ai-summary.routes.ts',
  '/src/app/features/ai-summary/data-access/ai-client.config.ts',
  '/src/app/features/ai-summary/data-access/ai-client.error.ts',
  '/src/app/features/ai-summary/data-access/ai-summary-stream.client.spec.ts',
  '/src/app/features/ai-summary/data-access/ai-summary-stream.client.ts',
  '/src/app/features/ai-summary/data-access/ai-summary-stream.parser.spec.ts',
  '/src/app/features/ai-summary/data-access/ai-summary-stream.parser.ts',
  '/src/app/features/ai-summary/data-access/ai-summary.client.spec.ts',
  '/src/app/features/ai-summary/data-access/ai-summary.client.ts',
  '/src/app/features/ai-summary/data-access/ai-summary.facade.spec.ts',
  '/src/app/features/ai-summary/data-access/ai-summary.facade.ts',
  '/src/app/features/ai-summary/views/ai-summary/ai-summary.component.html',
  '/src/app/features/ai-summary/views/ai-summary/ai-summary.component.scss',
  '/src/app/features/ai-summary/views/ai-summary/ai-summary.component.spec.ts',
  '/src/app/features/ai-summary/views/ai-summary/ai-summary.component.ts',
] as const;
