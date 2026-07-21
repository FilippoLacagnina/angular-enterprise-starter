export type EvolutionName =
  | 'transloco'
  | 'runtime-config'
  | 'signal-store'
  | 'docker-ssr'
  | 'bootstrap'
  | 'tailwind'
  | 'ai-genkit';

export interface EvolutionOptions {
  readonly name: EvolutionName;
  readonly preview?: boolean;
  readonly translocoLanguages?: string;
  readonly translocoDefaultLanguage?: string;
  readonly storeScope?: 'feature' | 'root';
  readonly featureName?: string;
  readonly featureComponent?: 'existing' | 'create';
  readonly storeName?: string;
  readonly bootstrapMode?: 'all' | 'select';
  readonly bootstrapComponents?: string;
  readonly tailwindMode?: 'all' | 'select';
  readonly tailwindComponents?: string;
  readonly aiProvider?: 'google-ai';
  readonly aiExample?: 'none' | 'summary';
  readonly aiModel?: string;
}
