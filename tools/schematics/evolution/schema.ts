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
}
