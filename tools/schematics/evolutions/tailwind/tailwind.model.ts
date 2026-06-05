import {
  type DesignSystemComponentDefinition,
  type DesignSystemComponentStatus,
  type DesignSystemFileDefinition,
  type DesignSystemInstallPlan,
} from '../design-system/design-system.model';

export type TailwindComponentName = 'alert' | 'badge' | 'button' | 'card' | 'input';

export type TailwindMode = 'all' | 'select';

export type TailwindFileDefinition = DesignSystemFileDefinition;

export type TailwindComponentDefinition = DesignSystemComponentDefinition<TailwindComponentName>;

export type TailwindInstallPlan = DesignSystemInstallPlan<
  TailwindMode,
  TailwindComponentDefinition
>;

export type TailwindComponentStatus = DesignSystemComponentStatus<TailwindComponentDefinition>;
