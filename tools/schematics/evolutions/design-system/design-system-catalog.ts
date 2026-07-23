export const DESIGN_SYSTEM_CATALOG_SCHEMA_VERSION = 1 as const;

export type DesignSystemCatalogValue = string | number | boolean | null;
export type DesignSystemCatalogInputKind = 'boolean' | 'enum' | 'number' | 'string';
export type DesignSystemCatalogOutputPayload = 'string' | 'void';

export interface DesignSystemCatalogInput {
  readonly name: string;
  readonly kind: DesignSystemCatalogInputKind;
  readonly defaultValue: DesignSystemCatalogValue;
  readonly values?: readonly DesignSystemCatalogValue[];
  readonly twoWay?: boolean;
}

export interface DesignSystemCatalogOutput {
  readonly name: string;
  readonly payload: DesignSystemCatalogOutputPayload;
}

export interface DesignSystemCatalogExample {
  readonly id: string;
  readonly label: string;
  readonly inputs: Readonly<Record<string, DesignSystemCatalogValue>>;
  readonly content?: string;
}

export interface DesignSystemCatalogComponent {
  readonly id: string;
  readonly label: string;
  readonly className: string;
  readonly selector: string;
  readonly projectedContent: boolean;
  readonly inputs: readonly DesignSystemCatalogInput[];
  readonly outputs: readonly DesignSystemCatalogOutput[];
  readonly examples: readonly DesignSystemCatalogExample[];
}

export interface DesignSystemCatalogProvider {
  readonly id: string;
  readonly label: string;
  readonly evolutionName: string;
  readonly importPath: string;
  readonly components: readonly DesignSystemCatalogComponent[];
}

export interface DesignSystemCatalog {
  readonly schemaVersion: typeof DESIGN_SYSTEM_CATALOG_SCHEMA_VERSION;
  readonly providers: readonly DesignSystemCatalogProvider[];
}

interface SemanticComponentDefinition extends Omit<
  DesignSystemCatalogComponent,
  'className' | 'selector'
> {
  readonly classSuffix: string;
}

const ALERT_AND_BADGE_VARIANTS = [
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'light',
  'dark',
  'neutral',
] as const;

const BUTTON_VARIANTS = [
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'light',
  'dark',
  'link',
  'ghost',
] as const;

const STARTER_UI_COMPONENTS: readonly SemanticComponentDefinition[] = [
  {
    id: 'alert',
    label: 'Alert',
    classSuffix: 'Alert',
    projectedContent: true,
    inputs: [
      { name: 'variant', kind: 'enum', defaultValue: 'info', values: ALERT_AND_BADGE_VARIANTS },
      { name: 'dismissible', kind: 'boolean', defaultValue: false },
      { name: 'dismissLabel', kind: 'string', defaultValue: 'Close' },
      { name: 'role', kind: 'enum', defaultValue: 'alert', values: ['alert', 'status'] },
      { name: 'open', kind: 'boolean', defaultValue: true, twoWay: true },
    ],
    outputs: [{ name: 'dismissed', payload: 'void' }],
    examples: [
      { id: 'informational', label: 'Informational', inputs: {}, content: 'Deployment ready.' },
      {
        id: 'dismissible-success',
        label: 'Dismissible success',
        inputs: { variant: 'success', dismissible: true, role: 'status' },
        content: 'Configuration saved.',
      },
    ],
  },
  {
    id: 'badge',
    label: 'Badge',
    classSuffix: 'Badge',
    projectedContent: true,
    inputs: [
      {
        name: 'variant',
        kind: 'enum',
        defaultValue: 'primary',
        values: ALERT_AND_BADGE_VARIANTS,
      },
      { name: 'pill', kind: 'boolean', defaultValue: false },
      { name: 'ariaLabel', kind: 'string', defaultValue: null },
    ],
    outputs: [],
    examples: [
      { id: 'primary', label: 'Primary', inputs: {}, content: 'Active' },
      {
        id: 'neutral-pill',
        label: 'Neutral pill',
        inputs: { variant: 'neutral', pill: true },
        content: 'Pending',
      },
    ],
  },
  {
    id: 'button',
    label: 'Button',
    classSuffix: 'Button',
    projectedContent: true,
    inputs: [
      { name: 'variant', kind: 'enum', defaultValue: 'primary', values: BUTTON_VARIANTS },
      { name: 'outline', kind: 'boolean', defaultValue: false },
      { name: 'size', kind: 'enum', defaultValue: 'md', values: ['sm', 'md', 'lg'] },
      {
        name: 'type',
        kind: 'enum',
        defaultValue: 'button',
        values: ['button', 'submit', 'reset'],
      },
      { name: 'disabled', kind: 'boolean', defaultValue: false },
      { name: 'loading', kind: 'boolean', defaultValue: false },
      { name: 'fullWidth', kind: 'boolean', defaultValue: false },
      { name: 'ariaLabel', kind: 'string', defaultValue: null },
    ],
    outputs: [],
    examples: [
      { id: 'primary', label: 'Primary', inputs: {}, content: 'Continue' },
      {
        id: 'loading',
        label: 'Loading',
        inputs: { loading: true },
        content: 'Saving',
      },
      {
        id: 'outline',
        label: 'Outline',
        inputs: { variant: 'secondary', outline: true },
        content: 'Cancel',
      },
    ],
  },
  {
    id: 'card',
    label: 'Card',
    classSuffix: 'Card',
    projectedContent: true,
    inputs: [
      { name: 'title', kind: 'string', defaultValue: null },
      { name: 'subtitle', kind: 'string', defaultValue: null },
      { name: 'headingLevel', kind: 'enum', defaultValue: 3, values: [2, 3, 4, 5, 6] },
      { name: 'imageSrc', kind: 'string', defaultValue: null },
      { name: 'imageAlt', kind: 'string', defaultValue: '' },
      {
        name: 'imagePosition',
        kind: 'enum',
        defaultValue: 'top',
        values: ['top', 'bottom'],
      },
      {
        name: 'imageLoading',
        kind: 'enum',
        defaultValue: 'lazy',
        values: ['eager', 'lazy'],
      },
      { name: 'imageWidth', kind: 'number', defaultValue: null },
      { name: 'imageHeight', kind: 'number', defaultValue: null },
      { name: 'ariaLabel', kind: 'string', defaultValue: null },
    ],
    outputs: [],
    examples: [
      {
        id: 'overview',
        label: 'Overview',
        inputs: { title: 'Account overview', subtitle: 'Updated recently', headingLevel: 3 },
        content: 'Starter-owned card content.',
      },
    ],
  },
  {
    id: 'input',
    label: 'Input',
    classSuffix: 'Input',
    projectedContent: false,
    inputs: [
      { name: 'id', kind: 'string', defaultValue: null },
      { name: 'name', kind: 'string', defaultValue: null },
      { name: 'label', kind: 'string', defaultValue: null },
      {
        name: 'type',
        kind: 'enum',
        defaultValue: 'text',
        values: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
      },
      { name: 'value', kind: 'string', defaultValue: '' },
      { name: 'placeholder', kind: 'string', defaultValue: '' },
      { name: 'ariaLabel', kind: 'string', defaultValue: null },
      { name: 'describedBy', kind: 'string', defaultValue: null },
      { name: 'size', kind: 'enum', defaultValue: 'md', values: ['sm', 'md', 'lg'] },
      { name: 'disabled', kind: 'boolean', defaultValue: false },
      { name: 'readOnly', kind: 'boolean', defaultValue: false },
    ],
    outputs: [{ name: 'valueChange', payload: 'string' }],
    examples: [
      {
        id: 'email',
        label: 'Email',
        inputs: { id: 'email', label: 'Email', type: 'email', placeholder: 'name@example.com' },
      },
    ],
  },
];

export const designSystemCatalog: DesignSystemCatalog = {
  schemaVersion: DESIGN_SYSTEM_CATALOG_SCHEMA_VERSION,
  providers: [
    createProvider('bootstrap', 'Bootstrap', 'Bootstrap'),
    createProvider('tailwind', 'Tailwind', 'Tailwind'),
  ],
};

export default designSystemCatalog;

function createProvider(
  id: 'bootstrap' | 'tailwind',
  label: 'Bootstrap' | 'Tailwind',
  classPrefix: 'Bootstrap' | 'Tailwind',
): DesignSystemCatalogProvider {
  return {
    id,
    label,
    evolutionName: id,
    importPath: `@shared/components/${id}`,
    components: STARTER_UI_COMPONENTS.map(({ classSuffix, ...component }) => ({
      ...component,
      className: `${classPrefix}${classSuffix}`,
      selector: `app-${id}-${component.id}`,
    })),
  };
}
