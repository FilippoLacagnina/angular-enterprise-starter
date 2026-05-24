import { type BootstrapComponentName } from './bootstrap.model';
import { bootstrapAlertDefinition } from './components/alert';
import { bootstrapBadgeDefinition } from './components/badge';
import { bootstrapButtonDefinition } from './components/button';
import { bootstrapCardDefinition } from './components/card';
import { bootstrapInputDefinition } from './components/input';

export const BOOTSTRAP_COMPONENT_DEFINITIONS = [
  bootstrapAlertDefinition,
  bootstrapBadgeDefinition,
  bootstrapButtonDefinition,
  bootstrapCardDefinition,
  bootstrapInputDefinition,
] as const;

export const BOOTSTRAP_COMPONENT_NAMES = BOOTSTRAP_COMPONENT_DEFINITIONS.map(
  (component) => component.name,
);

export function getBootstrapComponentDefinition(componentName: BootstrapComponentName) {
  return BOOTSTRAP_COMPONENT_DEFINITIONS.find((component) => component.name === componentName);
}
