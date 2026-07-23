export type DesignSystemComponentInstallStatus = 'complete' | 'missing' | 'partial';

export interface DesignSystemFileDefinition {
  readonly path: string;
  readonly content: string;
}

export interface DesignSystemComponentDefinition<TName extends string = string> {
  readonly name: TName;
  readonly label: string;
  readonly className: string;
  readonly exportPath: string;
  readonly files: readonly DesignSystemFileDefinition[];
  readonly supplementalFiles?: readonly DesignSystemFileDefinition[];
}

export interface DesignSystemInstallPlan<
  TMode extends string = string,
  TComponent extends DesignSystemComponentDefinition = DesignSystemComponentDefinition,
> {
  readonly mode: TMode;
  readonly components: readonly TComponent[];
}

export interface DesignSystemComponentStatus<
  TComponent extends DesignSystemComponentDefinition = DesignSystemComponentDefinition,
> {
  readonly component: TComponent;
  readonly status: DesignSystemComponentInstallStatus;
  readonly existingFiles: readonly DesignSystemFileDefinition[];
  readonly missingFiles: readonly DesignSystemFileDefinition[];
  readonly existingRequiredFiles: readonly DesignSystemFileDefinition[];
  readonly missingRequiredFiles: readonly DesignSystemFileDefinition[];
  readonly existingSupplementalFiles: readonly DesignSystemFileDefinition[];
  readonly missingSupplementalFiles: readonly DesignSystemFileDefinition[];
}
