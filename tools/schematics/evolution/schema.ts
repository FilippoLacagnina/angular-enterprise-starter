export type EvolutionName =
  | 'transloco'
  | 'runtime-config'
  | 'layout-shell'
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
  readonly layoutMode?: 'all' | 'select' | 'content-only';
  readonly layoutComponents?: string;
  readonly layoutHeaderBehavior?: 'flow' | 'sticky';
  readonly layoutSidebarMode?: 'persistent' | 'collapsible';
  readonly layoutSidebarPosition?: 'start' | 'end';
  readonly layoutSidebarInitialState?: 'expanded' | 'collapsed';
  readonly layoutFooterBehavior?: 'flow' | 'sticky';
  readonly layoutContentWidth?: 'fluid' | 'contained';
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
