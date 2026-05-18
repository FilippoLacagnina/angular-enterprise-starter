import { type SchematicContext, type Tree } from '@angular-devkit/schematics';

import { type EvolutionName } from '../evolution/schema';

export type EvolutionInstaller = (
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
) => void;

export interface EvolutionDefinition {
  readonly name: EvolutionName;
  readonly label: string;
  readonly dependencies: readonly string[];
  readonly creates: readonly string[];
  readonly updates: readonly string[];
  readonly notes: readonly string[];
  readonly referenceBranch: string;
  readonly referenceUrl: string;
  readonly install?: EvolutionInstaller;
}
