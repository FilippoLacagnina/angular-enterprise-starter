import { type TailwindComponentName } from './tailwind.model';
import { tailwindAlertDefinition } from './components/alert';
import { tailwindBadgeDefinition } from './components/badge';
import { tailwindButtonDefinition } from './components/button';
import { tailwindCardDefinition } from './components/card';
import { tailwindInputDefinition } from './components/input';

export const TAILWIND_COMPONENT_DEFINITIONS = [
  tailwindAlertDefinition,
  tailwindBadgeDefinition,
  tailwindButtonDefinition,
  tailwindCardDefinition,
  tailwindInputDefinition,
] as const;

export const TAILWIND_COMPONENT_NAMES = TAILWIND_COMPONENT_DEFINITIONS.map(
  (component) => component.name,
);

export function getTailwindComponentDefinition(componentName: TailwindComponentName) {
  return TAILWIND_COMPONENT_DEFINITIONS.find((component) => component.name === componentName);
}
