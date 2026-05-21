import {
  type DesignSystemComponentDefinition,
  type DesignSystemComponentStatus,
  type DesignSystemFileDefinition,
  type DesignSystemInstallPlan,
} from '../design-system/design-system.model';

export type BootstrapComponentName = 'alert' | 'badge' | 'button' | 'card' | 'input';

export type BootstrapMode = 'all' | 'select';

export type BootstrapFileDefinition = DesignSystemFileDefinition;

export type BootstrapComponentDefinition = DesignSystemComponentDefinition<BootstrapComponentName>;

export type BootstrapInstallPlan = DesignSystemInstallPlan<
  BootstrapMode,
  BootstrapComponentDefinition
>;

export type BootstrapComponentStatus = DesignSystemComponentStatus<BootstrapComponentDefinition>;
