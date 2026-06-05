export type EvolutionName =
  | 'transloco'
  | 'runtime-config'
  | 'signal-store'
  | 'docker-ssr'
  | 'bootstrap'
  | 'tailwind';

export interface EvolutionOptions {
  readonly name: EvolutionName;
  readonly preview?: boolean;
  readonly storeScope?: 'feature' | 'root';
  readonly featureName?: string;
  readonly featureComponent?: 'existing' | 'create';
  readonly storeName?: string;
  readonly bootstrapMode?: 'all' | 'select';
  readonly bootstrapComponents?: string;
  readonly tailwindMode?: 'all' | 'select';
  readonly tailwindComponents?: string;
}
