import { createHash } from 'node:crypto';

import evolutionManifest = require('../../evolution/evolution-manifest.json');
import {
  type LayoutShellCatalog,
  type LayoutShellCatalogChoice,
  type LayoutShellCatalogCondition,
  type LayoutShellCatalogOption,
  type LayoutShellCatalogOptionId,
  type LayoutShellCatalogValue,
} from './layout-shell-catalog';
import {
  DEFAULT_LAYOUT_CONTENT_WIDTH,
  DEFAULT_LAYOUT_FOOTER_BEHAVIOR,
  DEFAULT_LAYOUT_HEADER_BEHAVIOR,
  DEFAULT_LAYOUT_MODE,
  DEFAULT_LAYOUT_SIDEBAR_INITIAL_STATE,
  DEFAULT_LAYOUT_SIDEBAR_MODE,
  DEFAULT_LAYOUT_SIDEBAR_POSITION,
  LAYOUT_COMPACT_BREAKPOINT_REM,
  LAYOUT_COMPONENT_NAMES,
  type LayoutComponentName,
  type LayoutMode,
} from './layout-shell.model';
import { createLayoutShellInstallPlan } from './layout-shell.plan';
import {
  createContentOnlyAppFiles,
  createLayoutShellGeneratedFiles,
  type LayoutGeneratedFile,
} from './layout-shell.templates';

interface ManifestChoice {
  readonly value: string;
  readonly label: string;
  readonly description: string;
}

interface ManifestOption {
  readonly name: string;
  readonly cliFlag: string;
  readonly type: string;
  readonly description: string;
  readonly default?: string;
  readonly suggestedValue?: string;
  readonly choiceCatalog?: string;
  readonly choices?: readonly ManifestChoice[];
  readonly multiple?: boolean;
  readonly separator?: string;
}

interface ManifestEvolution {
  readonly name: string;
  readonly label: string;
  readonly options: readonly ManifestOption[];
}

interface RenderContractProfile {
  readonly id: string;
  readonly files: readonly LayoutGeneratedFile[];
}

const COMPONENT_CONDITION = (componentId: LayoutComponentName): LayoutShellCatalogCondition => ({
  kind: 'component-selected',
  componentId,
});

const OPTION_SEMANTICS: Readonly<
  Record<
    LayoutShellCatalogOptionId,
    {
      readonly visibleWhen?: LayoutShellCatalogCondition;
      readonly applicableWhen?: LayoutShellCatalogCondition;
      readonly dependsOn: readonly LayoutShellCatalogOptionId[];
    }
  >
> = {
  layoutMode: { dependsOn: [] },
  layoutComponents: {
    visibleWhen: { kind: 'option-equals', optionId: 'layoutMode', value: 'select' },
    applicableWhen: { kind: 'option-equals', optionId: 'layoutMode', value: 'select' },
    dependsOn: ['layoutMode'],
  },
  layoutHeaderBehavior: {
    visibleWhen: COMPONENT_CONDITION('header'),
    applicableWhen: COMPONENT_CONDITION('header'),
    dependsOn: ['layoutMode', 'layoutComponents'],
  },
  layoutSidebarMode: {
    visibleWhen: COMPONENT_CONDITION('sidebar'),
    applicableWhen: COMPONENT_CONDITION('sidebar'),
    dependsOn: ['layoutMode', 'layoutComponents'],
  },
  layoutSidebarPosition: {
    visibleWhen: COMPONENT_CONDITION('sidebar'),
    applicableWhen: COMPONENT_CONDITION('sidebar'),
    dependsOn: ['layoutMode', 'layoutComponents'],
  },
  layoutSidebarInitialState: {
    visibleWhen: {
      kind: 'all',
      conditions: [
        COMPONENT_CONDITION('sidebar'),
        {
          kind: 'option-equals',
          optionId: 'layoutSidebarMode',
          value: 'collapsible',
        },
      ],
    },
    applicableWhen: {
      kind: 'all',
      conditions: [
        COMPONENT_CONDITION('sidebar'),
        {
          kind: 'option-equals',
          optionId: 'layoutSidebarMode',
          value: 'collapsible',
        },
      ],
    },
    dependsOn: ['layoutMode', 'layoutComponents', 'layoutSidebarMode'],
  },
  layoutFooterBehavior: {
    visibleWhen: COMPONENT_CONDITION('footer'),
    applicableWhen: COMPONENT_CONDITION('footer'),
    dependsOn: ['layoutMode', 'layoutComponents'],
  },
  layoutContentWidth: {
    visibleWhen: COMPONENT_CONDITION('shell'),
    applicableWhen: COMPONENT_CONDITION('shell'),
    dependsOn: ['layoutMode', 'layoutComponents'],
  },
};

export function createLayoutShellCatalog(): LayoutShellCatalog {
  const manifest = evolutionManifest as unknown as {
    readonly optionCatalogs: Readonly<Record<string, readonly ManifestChoice[]>>;
    readonly evolutions: readonly ManifestEvolution[];
  };
  const evolution = manifest.evolutions.find((candidate) => candidate.name === 'layout-shell');

  if (!evolution || evolution.label !== 'Layout Shell') {
    throw new Error('The evolution manifest does not define the expected Layout Shell evolution.');
  }

  const options = evolution.options.map((option, order) =>
    createCatalogOption(option, order, manifest.optionCatalogs),
  );
  const modeOption = getOption(evolution.options, 'layoutMode');
  const componentChoices = manifest.optionCatalogs['layoutComponents'];

  if (!componentChoices) {
    throw new Error('The evolution manifest does not define layout component choices.');
  }

  return {
    schemaVersion: 1,
    renderContractHash: createLayoutShellRenderContractHash(),
    evolution: {
      id: 'layout-shell',
      name: 'Layout Shell',
    },
    defaults: {
      mode: DEFAULT_LAYOUT_MODE,
      components: LAYOUT_COMPONENT_NAMES,
      headerBehavior: DEFAULT_LAYOUT_HEADER_BEHAVIOR,
      sidebarMode: DEFAULT_LAYOUT_SIDEBAR_MODE,
      sidebarPosition: DEFAULT_LAYOUT_SIDEBAR_POSITION,
      sidebarInitialState: DEFAULT_LAYOUT_SIDEBAR_INITIAL_STATE,
      footerBehavior: DEFAULT_LAYOUT_FOOTER_BEHAVIOR,
      contentWidth: DEFAULT_LAYOUT_CONTENT_WIDTH,
    },
    modes: createChoices<LayoutMode>(modeOption.choices ?? []),
    components: createChoices<LayoutComponentName>(componentChoices),
    requiredComponents: {
      select: ['shell'],
    },
    options,
    contentOnly: {
      mode: 'content-only',
      components: [],
      allowedOptionIds: ['layoutMode'],
      rejectsAdditionalOptions: true,
      renderingStrategy: 'direct-content',
    },
    responsive: {
      breakpoint: `${LAYOUT_COMPACT_BREAKPOINT_REM}rem`,
      compactNavigation: 'drawer',
      requiresComponents: ['header', 'sidebar'],
      initialOpen: false,
      positions: ['start', 'end'],
      closeTriggers: ['button', 'backdrop', 'escape', 'navigation-end'],
      sidebarWithoutHeader: 'stacked',
      desktopSidebarScroll: 'independent',
    },
  };
}

export function createLayoutShellRenderContractHash(
  profiles: readonly RenderContractProfile[] = createRenderContractProfiles(),
): string {
  const normalizedProfiles = [...profiles]
    .map((profile) => ({
      id: profile.id,
      files: [...profile.files]
        .map((file) => ({
          path: file.path,
          content: file.content.replace(/\r\n?/g, '\n'),
        }))
        .sort((left, right) => compareStrings(left.path, right.path)),
    }))
    .sort((left, right) => compareStrings(left.id, right.id));

  return createHash('sha256').update(JSON.stringify(normalizedProfiles), 'utf8').digest('hex');
}

function createRenderContractProfiles(): readonly RenderContractProfile[] {
  return [
    {
      id: 'all-default',
      files: createLayoutShellGeneratedFiles(createLayoutShellInstallPlan({})),
    },
    {
      id: 'all-configured',
      files: createLayoutShellGeneratedFiles(
        createLayoutShellInstallPlan({
          layoutHeaderBehavior: 'sticky',
          layoutSidebarMode: 'collapsible',
          layoutSidebarPosition: 'end',
          layoutSidebarInitialState: 'collapsed',
          layoutFooterBehavior: 'sticky',
          layoutContentWidth: 'contained',
        }),
      ),
    },
    {
      id: 'select-shell',
      files: createLayoutShellGeneratedFiles(
        createLayoutShellInstallPlan({
          layoutMode: 'select',
          layoutComponents: 'shell',
        }),
      ),
    },
    {
      id: 'content-only',
      files: createContentOnlyAppFiles(true),
    },
  ];
}

function createCatalogOption(
  option: ManifestOption,
  order: number,
  optionCatalogs: Readonly<Record<string, readonly ManifestChoice[]>>,
): LayoutShellCatalogOption {
  if (!(option.name in OPTION_SEMANTICS)) {
    throw new Error(`Unsupported Layout Shell manifest option "${option.name}".`);
  }

  const id = option.name as LayoutShellCatalogOptionId;
  const semantics = OPTION_SEMANTICS[id];
  const choices = option.choiceCatalog
    ? optionCatalogs[option.choiceCatalog]
    : (option.choices ?? []);

  if (!choices) {
    throw new Error(`Missing choice catalog "${option.choiceCatalog}" for "${option.name}".`);
  }

  const defaultValue = option.multiple
    ? (option.suggestedValue?.split(',') as LayoutComponentName[] | undefined)
    : option.default;

  if (defaultValue === undefined) {
    throw new Error(`Missing Layout Shell default value for "${option.name}".`);
  }

  return {
    id,
    cliFlag: option.cliFlag,
    description: option.description,
    type: option.multiple ? 'string-list' : 'string',
    defaultValue: defaultValue as LayoutShellCatalogOption['defaultValue'],
    values: createChoices(choices),
    order,
    ...(option.multiple ? { multiple: true, separator: ',' } : {}),
    ...(semantics.visibleWhen ? { visibleWhen: semantics.visibleWhen } : {}),
    ...(semantics.applicableWhen ? { applicableWhen: semantics.applicableWhen } : {}),
    dependsOn: semantics.dependsOn,
  };
}

function createChoices<TValue extends LayoutShellCatalogValue>(
  choices: readonly ManifestChoice[],
): (LayoutShellCatalogChoice & { readonly value: TValue })[] {
  return choices.map((choice, order) => ({
    value: choice.value as TValue,
    label: choice.label,
    description: choice.description,
    order,
  }));
}

function getOption(options: readonly ManifestOption[], name: string): ManifestOption {
  const option = options.find((candidate) => candidate.name === name);

  if (!option) {
    throw new Error(`Missing Layout Shell manifest option "${name}".`);
  }

  return option;
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
