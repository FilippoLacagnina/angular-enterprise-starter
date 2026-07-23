import { SchematicsException, type SchematicContext, type Tree } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../evolution/schema';
import { type EvolutionName } from '../evolution/schema';

export class EvolutionUserActionRequiredError extends SchematicsException {}

export type EvolutionInstaller = (
  tree: Tree,
  context: SchematicContext,
  definition: EvolutionDefinition,
  options: EvolutionOptions,
) => void;

export interface EvolutionPreview {
  readonly dependencies: readonly string[];
  readonly creates: readonly string[];
  readonly updates: readonly string[];
  readonly deletes?: readonly string[];
  readonly existing?: readonly string[];
  readonly blockingNotes?: readonly string[];
  readonly notes: readonly string[];
}

export interface EvolutionDefinition {
  readonly name: EvolutionName;
  readonly label: string;
  readonly repeatable?: boolean;
  readonly dependencies: readonly string[];
  readonly creates: readonly string[];
  readonly updates: readonly string[];
  readonly notes: readonly string[];
  readonly referenceBranch?: string;
  readonly referenceUrl?: string;
  readonly preview?: (options: EvolutionOptions, tree: Tree) => EvolutionPreview;
  readonly install?: EvolutionInstaller;
}
