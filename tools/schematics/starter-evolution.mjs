import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { logging, schema } from '@angular-devkit/core';
import { formats } from '@angular-devkit/schematics';
import { NodeWorkflow } from '@angular-devkit/schematics/tools/index.js';

import { createCliHelp, parseCliArgs } from './starter-evolution-cli.mjs';

const STARTER_VERSION = readStarterVersion();
const CLI_DOCUMENTATION_URL =
  'https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/schematics.md';
const HEADER_CONTENT_WIDTH = Math.max(70, CLI_DOCUMENTATION_URL.length - 4);
const SHOULD_BUILD_LOCAL_SCHEMATICS = process.env['AES_SKIP_SCHEMATICS_BUILD'] !== 'true';
const SCHEMATICS_COLLECTION_PATH =
  process.env['AES_SCHEMATICS_COLLECTION_PATH'] ?? './dist/schematics/collection.json';
const EVOLUTION_MANIFEST_PATH =
  process.env['AES_EVOLUTION_MANIFEST_PATH'] ??
  resolve(dirname(fileURLToPath(import.meta.url)), 'evolution/evolution-manifest.json');

let evolutionManifest;
let evolutions;
let translocoLanguages;
let designSystemComponents;
let designSystemDefaultComponents;
let layoutComponents;
let defaultAiGenkitModel;
let args;

const color = {
  bold: (value) => `\x1b[1m${value}\x1b[0m`,
  cyan: (value) => `\x1b[36m${value}\x1b[0m`,
  dim: (value) => `\x1b[2m${value}\x1b[0m`,
  green: (value) => `\x1b[32m${value}\x1b[0m`,
  red: (value) => `\x1b[31m${value}\x1b[0m`,
  yellow: (value) => `\x1b[33m${value}\x1b[0m`,
};

main().catch((error) => {
  console.error('');
  console.error(color.red('Evolution failed.'));
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  initializeEvolutionManifest();
  args = parseCliArgs(process.argv.slice(2), evolutionManifest);

  if (args.help) {
    console.log(createCliHelp(evolutionManifest, STARTER_VERSION, args.name));
    return;
  }

  if (args.version) {
    console.log(`Angular Enterprise Starter Evolution CLI v${STARTER_VERSION}`);
    return;
  }

  printHeader();

  const shouldAskEvolutionOptions = !args.name;
  const evolutionName = args.name ?? (await askEvolutionName());
  const evolution = getEvolution(evolutionName);
  const evolutionOptions = await resolveEvolutionOptions(evolution, shouldAskEvolutionOptions);
  const preview = args.preview ?? (await askPreviewMode());

  printSummary(evolution, preview, evolutionOptions);

  if (!preview && !args.yes) {
    const shouldContinue = await askConfirmation(
      `${color.yellow('This will modify your workspace.')} Continue? ${color.dim('(y/N)')} `,
    );

    if (!shouldContinue) {
      console.log('');
      console.log(
        color.dim('No changes were made. Run preview again if you want to inspect the impact.'),
      );
      return;
    }
  }

  if (SHOULD_BUILD_LOCAL_SCHEMATICS) {
    run('npm', ['run', 'schematics:build'], {
      title: 'Prepare schematics',
      description: 'Compile local generators and copy Angular CLI collection assets.',
    });
  } else {
    printPackagedSchematicsStep();
  }

  await runSchematic(evolution, preview, evolutionOptions);
  printNextSteps(preview);
}

async function resolveEvolutionOptions(evolution, shouldAskOptions) {
  if (evolution.name === 'transloco') {
    return resolveTranslocoOptions(shouldAskOptions);
  }

  if (evolution.name === 'ai-genkit') {
    return resolveAiGenkitOptions(shouldAskOptions);
  }

  if (evolution.name === 'signal-store') {
    return resolveSignalStoreOptions(shouldAskOptions);
  }

  if (evolution.name === 'layout-shell') {
    return resolveLayoutShellOptions(shouldAskOptions);
  }

  if (evolution.name === 'bootstrap') {
    return resolveDesignSystemOptions({
      shouldAskOptions,
      systemName: 'Bootstrap',
      modeOptionName: 'bootstrapMode',
      componentsOptionName: 'bootstrapComponents',
      modeValue: args.bootstrapMode,
      componentsValue: args.bootstrapComponents,
    });
  }

  if (evolution.name === 'tailwind') {
    return resolveDesignSystemOptions({
      shouldAskOptions,
      systemName: 'Tailwind',
      modeOptionName: 'tailwindMode',
      componentsOptionName: 'tailwindComponents',
      modeValue: args.tailwindMode,
      componentsValue: args.tailwindComponents,
    });
  }

  return {};
}

async function resolveTranslocoOptions(shouldAskOptions) {
  if (!shouldAskOptions) {
    return createTranslocoOptions({
      translocoLanguages: args.translocoLanguages,
      translocoDefaultLanguage: args.translocoDefaultLanguage,
    });
  }

  const selectedLanguages = await askTranslocoLanguages();
  const selectedLanguageChoices = translocoLanguages.filter(([code]) =>
    selectedLanguages.includes(code),
  );
  const defaultLanguage = await askChoice(
    'Default language',
    selectedLanguageChoices,
    selectedLanguages.includes('en') ? 'en' : null,
  );

  return createTranslocoOptions({
    translocoLanguages: selectedLanguages.join(','),
    translocoDefaultLanguage: defaultLanguage,
  });
}

async function resolveAiGenkitOptions(shouldAskOptions) {
  if (!shouldAskOptions) {
    return createAiGenkitOptions({
      aiProvider: args.aiProvider,
      aiExample: args.aiExample,
      aiModel: args.aiModel,
    });
  }

  const aiExample = await askChoice(
    'AI Genkit setup',
    getManifestChoices('ai-genkit', 'aiExample'),
  );
  const aiModel = await askText('Google AI model', defaultAiGenkitModel);

  return createAiGenkitOptions({ aiExample, aiModel });
}

async function resolveSignalStoreOptions(shouldAskOptions) {
  if (!shouldAskOptions) {
    return createSignalStoreOptions({
      storeScope: args.storeScope,
      featureName: args.featureName,
      featureComponent: args.featureComponent,
      storeName: args.storeName,
    });
  }

  const storeScope = await askChoice(
    'SignalStore scope',
    getManifestChoices('signal-store', 'storeScope'),
  );

  if (storeScope === 'root') {
    const storeName = await askAvailableRootStoreName(
      getManifestOptionDefault('signal-store', 'storeName'),
    );

    return createSignalStoreOptions({ storeScope, storeName });
  }

  while (true) {
    const featureName = await askAvailableSignalStoreFeatureName(
      getManifestOptionDefault('signal-store', 'featureName'),
    );
    const featureComponent = await askChoice(
      'Feature component',
      getManifestChoices('signal-store', 'featureComponent'),
    );

    if (featureComponent !== 'create') {
      return createSignalStoreOptions({
        storeScope,
        featureName,
        featureComponent,
      });
    }

    const existingComponentTargets = getExistingSignalStoreFeatureComponentTargets(featureName);

    if (existingComponentTargets.length === 0) {
      return createSignalStoreOptions({
        storeScope,
        featureName,
        featureComponent,
      });
    }

    printExistingFeatureComponentWarning(featureName, existingComponentTargets);

    const nextAction = await askChoice('How do you want to continue?', [
      ['existing', 'Use existing component', 'Create only the SignalStore files.'],
      ['rename', 'Choose another feature', 'Enter a different feature name.'],
    ]);

    if (nextAction === 'existing') {
      return createSignalStoreOptions({
        storeScope,
        featureName,
        featureComponent: 'existing',
      });
    }
  }
}

async function resolveLayoutShellOptions(shouldAskOptions) {
  if (!shouldAskOptions) {
    return createLayoutShellOptions({
      layoutMode: args.layoutMode,
      layoutComponents: args.layoutComponents,
      layoutHeaderBehavior: args.layoutHeaderBehavior,
      layoutSidebarMode: args.layoutSidebarMode,
      layoutSidebarPosition: args.layoutSidebarPosition,
      layoutSidebarInitialState: args.layoutSidebarInitialState,
      layoutFooterBehavior: args.layoutFooterBehavior,
      layoutContentWidth: args.layoutContentWidth,
    });
  }

  const layoutMode = await askChoice(
    'Layout setup',
    getManifestChoices('layout-shell', 'layoutMode'),
  );

  if (layoutMode === 'content-only') {
    return createLayoutShellOptions({ layoutMode });
  }

  const selectedComponents =
    layoutMode === 'all' ? layoutComponents.map(([name]) => name) : await askLayoutComponents();
  const selectedComponentSet = new Set(selectedComponents);
  const selectedOptions = {
    layoutMode,
    ...(layoutMode === 'select' ? { layoutComponents: selectedComponents.join(',') } : {}),
  };

  if (selectedComponentSet.has('header')) {
    selectedOptions.layoutHeaderBehavior = await askChoice(
      'Header behavior',
      getManifestChoices('layout-shell', 'layoutHeaderBehavior'),
      getManifestOptionDefault('layout-shell', 'layoutHeaderBehavior'),
    );
  }

  if (selectedComponentSet.has('sidebar')) {
    selectedOptions.layoutSidebarMode = await askChoice(
      'Sidebar mode',
      getManifestChoices('layout-shell', 'layoutSidebarMode'),
    );
    selectedOptions.layoutSidebarPosition = await askChoice(
      'Sidebar position',
      getManifestChoices('layout-shell', 'layoutSidebarPosition'),
    );

    if (selectedOptions.layoutSidebarMode === 'collapsible') {
      selectedOptions.layoutSidebarInitialState = await askChoice(
        'Sidebar initial state',
        getManifestChoices('layout-shell', 'layoutSidebarInitialState'),
      );
    }
  }

  if (selectedComponentSet.has('footer')) {
    selectedOptions.layoutFooterBehavior = await askChoice(
      'Footer behavior',
      getManifestChoices('layout-shell', 'layoutFooterBehavior'),
    );
  }

  selectedOptions.layoutContentWidth = await askChoice(
    'Content width',
    getManifestChoices('layout-shell', 'layoutContentWidth'),
  );

  return createLayoutShellOptions(selectedOptions);
}

async function resolveDesignSystemOptions({
  shouldAskOptions,
  systemName,
  modeOptionName,
  componentsOptionName,
  modeValue,
  componentsValue,
}) {
  if (!shouldAskOptions) {
    return createDesignSystemOptions({
      systemName,
      modeOptionName,
      componentsOptionName,
      modeValue,
      componentsValue,
    });
  }

  const evolutionName = systemName.toLowerCase();
  const mode = await askChoice(
    `${systemName} setup`,
    getManifestChoices(evolutionName, modeOptionName),
  );

  if (mode === 'all') {
    return createDesignSystemOptions({
      systemName,
      modeOptionName,
      componentsOptionName,
      modeValue: mode,
    });
  }

  const components = await askDesignSystemComponents(systemName);

  return createDesignSystemOptions({
    systemName,
    modeOptionName,
    componentsOptionName,
    modeValue: mode,
    componentsValue: components,
  });
}

function printHeader() {
  console.log('');
  console.log(createHeaderBorder('╭', '╮'));
  printHeaderLine('');
  printHeaderLine('ANGULAR ENTERPRISE STARTER', color.bold);
  printHeaderLine('Evolution CLI', color.bold);
  printHeaderLine(`v${STARTER_VERSION}`, color.dim);
  printHeaderLine('');
  console.log(createHeaderBorder('╰', '╯'));
  console.log('');
  console.log('Modular Angular starter capabilities.');
  console.log(`Preview first. ${color.green('Apply')} when ready.`);
  console.log(`${color.dim('Evolution CLI guide:')}`);
  console.log(`${CLI_DOCUMENTATION_URL}`);
  console.log('');
}

function printHeaderLine(value, formatter = (text) => text) {
  console.log(
    `${color.cyan('│')} ${formatter(center(value, HEADER_CONTENT_WIDTH))} ${color.cyan('│')}`,
  );
}

function createHeaderBorder(left, right) {
  return color.cyan(`${left}${'─'.repeat(HEADER_CONTENT_WIDTH + 2)}${right}`);
}

function center(value, width) {
  const leftPadding = Math.max(0, Math.floor((width - value.length) / 2));
  const rightPadding = Math.max(0, width - value.length - leftPadding);

  return `${' '.repeat(leftPadding)}${value}${' '.repeat(rightPadding)}`;
}

async function askEvolutionName() {
  const rl = createInterface({ input, output });

  try {
    printSection('Choose an evolution');

    for (const [index, evolution] of evolutions.entries()) {
      console.log(`${color.cyan(`${index + 1}.`)} ${color.bold(evolution.label)}`);
      console.log(`   ${color.dim(evolution.description)}`);
    }

    console.log('');
    const answer = await rl.question(`${color.bold('Select evolution')} `);
    const selectedIndex = Number.parseInt(answer, 10) - 1;
    const selectedEvolution = evolutions[selectedIndex];

    if (!selectedEvolution) {
      throw new Error('Invalid evolution selection.');
    }

    return selectedEvolution.name;
  } finally {
    rl.close();
  }
}

async function askPreviewMode() {
  const rl = createInterface({ input, output });

  try {
    printSection('Choose mode');
    console.log(
      `${color.cyan('1.')} ${color.bold('Preview')} ${color.dim('(recommended, no file changes)')}`,
    );
    console.log(
      `${color.cyan('2.')} ${color.bold('Apply')} ${color.dim('(writes changes after confirmation)')}`,
    );
    console.log('');

    const answer = await rl.question(`${color.bold('Select mode')} ${color.dim('[1]')} `);

    if (answer === '' || answer === '1') {
      return true;
    }

    if (answer === '2') {
      return false;
    }

    throw new Error('Invalid mode selection.');
  } finally {
    rl.close();
  }
}

async function askChoice(title, choices, defaultValue = choices[0]?.[0]) {
  const rl = createInterface({ input, output });

  try {
    printSection(title);

    for (const [index, [, label, description]] of choices.entries()) {
      console.log(`${color.cyan(`${index + 1}.`)} ${color.bold(label)}`);
      console.log(`   ${color.dim(description)}`);
    }

    console.log('');
    const defaultIndex =
      defaultValue === null ? undefined : choices.findIndex(([value]) => value === defaultValue);
    const defaultHint = defaultIndex === undefined ? '' : ` ${color.dim(`[${defaultIndex + 1}]`)}`;
    const answer = await rl.question(`${color.bold('Select option')}${defaultHint} `);
    const selectedIndex = answer === '' ? defaultIndex : Number.parseInt(answer, 10) - 1;
    const selectedChoice = choices[selectedIndex];

    if (!selectedChoice) {
      throw new Error('Invalid option selection.');
    }

    return selectedChoice[0];
  } finally {
    rl.close();
  }
}

async function askText(label, defaultValue) {
  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(`${color.bold(label)} ${color.dim(`[${defaultValue}]`)} `);
    return answer.trim() || defaultValue;
  } finally {
    rl.close();
  }
}

async function askTranslocoLanguages() {
  while (true) {
    printSection('Select languages');
    console.log(color.dim('Choose the translation assets to configure and generate.'));
    console.log(color.dim('Use numbers, language codes, or a mix of both.'));
    console.log('');

    printCatalogChoices(translocoLanguages);
    console.log('');

    const defaultLanguages = getManifestOptionDefault('transloco', 'translocoLanguages');
    const answer = await askText('Languages', defaultLanguages);

    try {
      const selectedLanguages = parseCatalogSelection(answer, translocoLanguages, 'language');

      console.log('');
      console.log(
        `${color.green('Selected')} ${color.bold(formatCatalogSelection(selectedLanguages, translocoLanguages))}`,
      );

      return selectedLanguages;
    } catch (error) {
      console.log('');
      console.log(color.yellow(error instanceof Error ? error.message : String(error)));
    }
  }
}

async function askDesignSystemComponents(systemName) {
  while (true) {
    printSection(`Select ${systemName} components`);
    console.log(color.dim('Choose the starter-owned wrappers to generate.'));
    console.log(color.dim('Use numbers, names, or a mix of both.'));
    console.log('');

    printDesignSystemComponentChoices();
    console.log('');
    console.log(
      `${color.dim('Examples')} ${color.bold('3,5')} ${color.dim('or')} ${color.bold(
        'button,input',
      )} ${color.dim('or')} ${color.bold('3,input')}`,
    );
    console.log(
      `${color.dim('Recommended starter set')} ${color.bold(
        formatDesignSystemComponentSelection(designSystemDefaultComponents.split(',')),
      )}`,
    );
    console.log('');

    const answer = await askText('Components', designSystemDefaultComponents);

    try {
      const selectedComponents = parseDesignSystemComponentSelection(answer, systemName);

      console.log('');
      console.log(
        `${color.green('Selected')} ${color.bold(formatDesignSystemComponentSelection(selectedComponents))}`,
      );

      return selectedComponents.join(',');
    } catch (error) {
      console.log('');
      console.log(color.yellow(error instanceof Error ? error.message : String(error)));
      console.log(color.dim(createDesignSystemSelectionHint()));
    }
  }
}

async function askLayoutComponents() {
  while (true) {
    printSection('Select layout components');
    console.log(color.dim('Choose Shell and only the layout regions the application needs.'));
    console.log(color.dim('Use numbers, names, or a mix of both.'));
    console.log('');

    printCatalogChoices(layoutComponents);
    console.log('');

    const defaultComponents = getManifestOptionSuggestedValue('layout-shell', 'layoutComponents');
    const answer = await askText('Components', defaultComponents);

    try {
      const selectedComponents = parseCatalogSelection(
        answer,
        layoutComponents,
        'layout component',
      );

      if (!selectedComponents.includes('shell')) {
        throw new Error(
          'Shell is required when Header, Sidebar or Footer is selected. Choose content-only to install no layout components.',
        );
      }

      console.log('');
      console.log(
        `${color.green('Selected')} ${color.bold(
          formatCatalogSelection(selectedComponents, layoutComponents),
        )}`,
      );

      return selectedComponents;
    } catch (error) {
      console.log('');
      console.log(color.yellow(error instanceof Error ? error.message : String(error)));
    }
  }
}

function printDesignSystemComponentChoices() {
  printCatalogChoices(designSystemComponents);
}

function printCatalogChoices(catalog) {
  for (const [index, [name, label, description]] of catalog.entries()) {
    console.log(`${color.cyan(`${index + 1}.`)} ${color.bold(label)} ${color.dim(`(${name})`)}`);
    console.log(`   ${color.dim(description)}`);
  }
}

async function askAvailableSignalStoreFeatureName(defaultValue) {
  while (true) {
    const featureName = normalizeFeatureName(await askText('Feature name', defaultValue));
    const existingTargets = getExistingSignalStoreFeatureTargets(featureName);

    if (existingTargets.length === 0) {
      return featureName;
    }

    console.log('');
    console.log(color.yellow(`Feature "${featureName}" already has SignalStore files.`));
    console.log(color.dim('Existing targets:'));

    for (const target of existingTargets) {
      console.log(`${color.dim('-')} ${target}`);
    }

    console.log(color.dim('Choose another feature name to continue.'));
  }
}

async function askAvailableRootStoreName(defaultValue) {
  while (true) {
    const storeName = normalizeFeatureName(await askText('Root store name', defaultValue));
    const existingTargets = getExistingRootStoreTargets(storeName);

    if (existingTargets.length === 0) {
      return storeName;
    }

    console.log('');
    console.log(color.yellow(`Root store "${storeName}" already exists.`));
    console.log(color.dim('Existing targets:'));

    for (const target of existingTargets) {
      console.log(`${color.dim('-')} ${target}`);
    }

    console.log(color.dim('Choose another root store name to continue.'));
  }
}

async function askConfirmation(question) {
  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(question);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  } finally {
    rl.close();
  }
}

function getExistingRootStoreTargets(storeName) {
  return [
    `src/app/core/state/${storeName}.state.ts`,
    `src/app/core/state/${storeName}.store.ts`,
  ].filter((targetPath) => existsSync(targetPath));
}

function getExistingSignalStoreFeatureTargets(featureName) {
  return [
    `src/app/features/${featureName}/state/${featureName}.state.ts`,
    `src/app/features/${featureName}/state/${featureName}.store.ts`,
  ].filter((targetPath) => existsSync(targetPath));
}

function getExistingSignalStoreFeatureComponentTargets(featureName) {
  return [
    `src/app/features/${featureName}/${featureName}.routes.ts`,
    `src/app/features/${featureName}/views/${featureName}/${featureName}.component.ts`,
    `src/app/features/${featureName}/views/${featureName}/${featureName}.component.html`,
    `src/app/features/${featureName}/views/${featureName}/${featureName}.component.scss`,
  ].filter((targetPath) => existsSync(targetPath));
}

function printExistingFeatureComponentWarning(featureName, existingTargets) {
  console.log('');
  console.log(color.yellow(`Feature component files already exist for "${featureName}".`));
  console.log(color.dim('Existing targets:'));

  for (const target of existingTargets) {
    console.log(`${color.dim('-')} ${target}`);
  }
}

function printSummary(evolution, preview, evolutionOptions) {
  printSection('Selection summary');
  console.log(`${color.dim('Evolution')} ${color.bold(evolution.label)}`);
  console.log(
    `${color.dim('Mode')}      ${preview ? color.cyan('Preview') : color.green('Apply')}`,
  );

  for (const [label, value] of createOptionSummary(evolutionOptions)) {
    console.log(`${color.dim(label)} ${color.bold(value)}`);
  }

  console.log('');
}

function printNextSteps(preview) {
  console.log('');

  if (preview) {
    console.log(color.cyan('Preview completed. No files were changed.'));
    console.log(`Run ${color.bold('--apply')} when you are ready.`);
    return;
  }

  console.log(color.green('Evolution applied.'));
  console.log('');
  console.log(color.bold('Recommended next steps'));
  console.log(`${color.cyan('-')} npm install`);
  console.log(`${color.cyan('-')} npm run format:check`);
  console.log(`${color.cyan('-')} npm run lint`);
  console.log(`${color.cyan('-')} npm run build`);
}

function printPackagedSchematicsStep() {
  printSection('Prepare schematics');
  console.log(color.dim('Use the schematics collection bundled with this CLI package.'));
  console.log('');
  console.log(`${color.dim('Collection')} ${color.bold(SCHEMATICS_COLLECTION_PATH)}`);
}

function printSection(title) {
  console.log('');
  console.log(color.dim('--------------------------------------------------------------'));
  console.log(color.bold(title));
  console.log(color.dim('--------------------------------------------------------------'));
}

function getEvolution(evolutionName) {
  const evolution = evolutions.find((candidate) => candidate.name === evolutionName);

  if (!evolution) {
    throw new Error(`Unsupported evolution: ${evolutionName}`);
  }

  return evolution;
}

function createSignalStoreOptions(options) {
  const storeScope = options.storeScope ?? getManifestOptionDefault('signal-store', 'storeScope');

  if (!getManifestChoiceValues('signal-store', 'storeScope').includes(storeScope)) {
    throw new Error(`Unsupported SignalStore scope: ${storeScope}.`);
  }

  if (storeScope === 'root') {
    return {
      storeScope,
      storeName: normalizeFeatureName(
        options.storeName ?? getManifestOptionDefault('signal-store', 'storeName'),
      ),
    };
  }

  const featureComponent =
    options.featureComponent ?? getManifestOptionDefault('signal-store', 'featureComponent');

  if (!getManifestChoiceValues('signal-store', 'featureComponent').includes(featureComponent)) {
    throw new Error(`Unsupported feature component mode: ${featureComponent}.`);
  }

  return {
    storeScope,
    featureName: normalizeFeatureName(
      options.featureName ?? getManifestOptionDefault('signal-store', 'featureName'),
    ),
    featureComponent,
  };
}

function createTranslocoOptions(options) {
  const selectedLanguages = parseCatalogSelection(
    options.translocoLanguages ?? getManifestOptionDefault('transloco', 'translocoLanguages'),
    translocoLanguages,
    'language',
  );
  const defaultLanguage =
    options.translocoDefaultLanguage?.trim().toLowerCase() ||
    getManifestOptionDefault('transloco', 'translocoDefaultLanguage');

  if (!translocoLanguages.some(([code]) => code === defaultLanguage)) {
    throw new Error(`Unsupported Transloco default language: ${defaultLanguage}.`);
  }

  if (!selectedLanguages.includes(defaultLanguage)) {
    throw new Error(
      `Transloco default language "${defaultLanguage}" must be included in --transloco-languages.`,
    );
  }

  return {
    translocoLanguages: selectedLanguages.join(','),
    translocoDefaultLanguage: defaultLanguage,
  };
}

function createLayoutShellOptions(options) {
  const layoutMode = options.layoutMode ?? getManifestOptionDefault('layout-shell', 'layoutMode');

  assertManifestChoice('layout-shell', 'layoutMode', layoutMode, 'layout mode');

  if (layoutMode === 'content-only') {
    const unsupportedFlags = [
      ['--layout-components', options.layoutComponents],
      ['--layout-header-behavior', options.layoutHeaderBehavior],
      ['--layout-sidebar-mode', options.layoutSidebarMode],
      ['--layout-sidebar-position', options.layoutSidebarPosition],
      ['--layout-sidebar-initial-state', options.layoutSidebarInitialState],
      ['--layout-footer-behavior', options.layoutFooterBehavior],
      ['--layout-content-width', options.layoutContentWidth],
    ]
      .filter(([, value]) => value !== undefined)
      .map(([flag]) => flag);

    if (unsupportedFlags.length > 0) {
      throw new Error(
        `Layout behavior options are not available with --layout-mode content-only: ${unsupportedFlags.join(', ')}.`,
      );
    }

    return { layoutMode };
  }

  let selectedComponents;

  if (layoutMode === 'all') {
    if (options.layoutComponents !== undefined) {
      throw new Error('--layout-components can be used only with --layout-mode select.');
    }

    selectedComponents = layoutComponents.map(([name]) => name);
  } else {
    selectedComponents = parseCatalogSelection(
      options.layoutComponents,
      layoutComponents,
      'layout component',
    );

    if (!selectedComponents.includes('shell')) {
      throw new Error(
        'Shell is required when Header, Sidebar or Footer is selected. Use --layout-mode content-only to install no layout components.',
      );
    }
  }

  const selectedComponentSet = new Set(selectedComponents);
  const layoutOptions = {
    layoutMode,
    ...(layoutMode === 'select' ? { layoutComponents: selectedComponents.join(',') } : {}),
  };

  assertLayoutComponentOption(
    selectedComponentSet,
    'header',
    options.layoutHeaderBehavior,
    '--layout-header-behavior',
  );
  assertLayoutComponentOption(
    selectedComponentSet,
    'sidebar',
    options.layoutSidebarMode,
    '--layout-sidebar-mode',
  );
  assertLayoutComponentOption(
    selectedComponentSet,
    'sidebar',
    options.layoutSidebarPosition,
    '--layout-sidebar-position',
  );
  assertLayoutComponentOption(
    selectedComponentSet,
    'sidebar',
    options.layoutSidebarInitialState,
    '--layout-sidebar-initial-state',
  );
  assertLayoutComponentOption(
    selectedComponentSet,
    'footer',
    options.layoutFooterBehavior,
    '--layout-footer-behavior',
  );

  if (selectedComponentSet.has('header')) {
    layoutOptions.layoutHeaderBehavior = resolveManifestChoiceOption(
      'layout-shell',
      'layoutHeaderBehavior',
      options.layoutHeaderBehavior,
      'Header behavior',
    );
  }

  if (selectedComponentSet.has('sidebar')) {
    layoutOptions.layoutSidebarMode = resolveManifestChoiceOption(
      'layout-shell',
      'layoutSidebarMode',
      options.layoutSidebarMode,
      'Sidebar mode',
    );
    layoutOptions.layoutSidebarPosition = resolveManifestChoiceOption(
      'layout-shell',
      'layoutSidebarPosition',
      options.layoutSidebarPosition,
      'Sidebar position',
    );

    if (
      layoutOptions.layoutSidebarMode !== 'collapsible' &&
      options.layoutSidebarInitialState !== undefined
    ) {
      throw new Error(
        '--layout-sidebar-initial-state can be used only with --layout-sidebar-mode collapsible.',
      );
    }

    if (layoutOptions.layoutSidebarMode === 'collapsible') {
      layoutOptions.layoutSidebarInitialState = resolveManifestChoiceOption(
        'layout-shell',
        'layoutSidebarInitialState',
        options.layoutSidebarInitialState,
        'Sidebar initial state',
      );
    }
  }

  if (selectedComponentSet.has('footer')) {
    layoutOptions.layoutFooterBehavior = resolveManifestChoiceOption(
      'layout-shell',
      'layoutFooterBehavior',
      options.layoutFooterBehavior,
      'Footer behavior',
    );
  }

  layoutOptions.layoutContentWidth = resolveManifestChoiceOption(
    'layout-shell',
    'layoutContentWidth',
    options.layoutContentWidth,
    'content width',
  );

  return layoutOptions;
}

function createDesignSystemOptions({
  systemName,
  modeOptionName,
  componentsOptionName,
  modeValue,
  componentsValue,
}) {
  const evolutionName = systemName.toLowerCase();
  const mode = modeValue ?? getManifestOptionDefault(evolutionName, modeOptionName);
  const supportedModes = getManifestChoiceValues(evolutionName, modeOptionName);

  if (!supportedModes.includes(mode)) {
    throw new Error(`Unsupported ${systemName} mode: ${mode}.`);
  }

  if (mode === 'all') {
    return { [modeOptionName]: mode };
  }

  return {
    [modeOptionName]: mode,
    [componentsOptionName]: parseDesignSystemComponentSelection(componentsValue, systemName).join(
      ',',
    ),
  };
}

function assertLayoutComponentOption(selectedComponents, component, value, flag) {
  if (!selectedComponents.has(component) && value !== undefined) {
    throw new Error(
      `${flag} requires the ${formatOptionName(component)} component to be selected.`,
    );
  }
}

function resolveManifestChoiceOption(evolutionName, optionName, value, label) {
  const resolvedValue = value ?? getManifestOptionDefault(evolutionName, optionName);

  assertManifestChoice(evolutionName, optionName, resolvedValue, label);

  return resolvedValue;
}

function assertManifestChoice(evolutionName, optionName, value, label) {
  const supportedValues = getManifestChoiceValues(evolutionName, optionName);

  if (!supportedValues.includes(value)) {
    throw new Error(
      `Unsupported ${label}: ${value}. Supported values: ${supportedValues.join(', ')}.`,
    );
  }
}

function createAiGenkitOptions(options) {
  const aiProvider = options.aiProvider ?? getManifestOptionDefault('ai-genkit', 'aiProvider');
  const aiExample = options.aiExample ?? getManifestOptionDefault('ai-genkit', 'aiExample');
  const aiModel = options.aiModel?.trim() || defaultAiGenkitModel;

  if (!getManifestChoiceValues('ai-genkit', 'aiProvider').includes(aiProvider)) {
    throw new Error(`Unsupported AI provider: ${aiProvider}.`);
  }

  if (!getManifestChoiceValues('ai-genkit', 'aiExample').includes(aiExample)) {
    throw new Error(`Unsupported AI example: ${aiExample}.`);
  }

  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(aiModel)) {
    throw new Error('Invalid AI model identifier.');
  }

  return { aiProvider, aiExample, aiModel };
}

function normalizeFeatureName(value) {
  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  if (!normalized) {
    throw new Error('Feature name cannot be empty.');
  }

  return normalized;
}

function parseDesignSystemComponentSelection(value, systemName) {
  return parseCatalogSelection(value, designSystemComponents, `${systemName} component`);
}

function parseCatalogSelection(value, catalog, itemName) {
  if (!value?.trim()) {
    throw new Error(`Select at least one ${itemName}.`);
  }

  const selectedValues = value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .map((entry) => resolveCatalogValue(entry, catalog, itemName));

  return [...new Set(selectedValues)];
}

function resolveCatalogValue(value, catalog, itemName) {
  const componentIndex = Number.parseInt(value, 10);

  if (Number.isInteger(componentIndex) && String(componentIndex) === value) {
    const component = catalog[componentIndex - 1];

    if (component) {
      return component[0];
    }
  }

  if (catalog.some(([componentName]) => componentName === value)) {
    return value;
  }

  throw new Error(
    `Unsupported ${itemName}: ${value}. Supported values: ${catalog.map(([name]) => name).join(', ')}.`,
  );
}

function getDesignSystemComponentNames() {
  return designSystemComponents.map(([componentName]) => componentName);
}

function createDesignSystemSelectionHint() {
  return `Use numbers 1-${designSystemComponents.length}, component names (${getDesignSystemComponentNames().join(
    ', ',
  )}), or a mix like 3,input.`;
}

function formatDesignSystemComponentSelection(componentNames) {
  return formatCatalogSelection(componentNames, designSystemComponents);
}

function formatCatalogSelection(values, catalog) {
  return values
    .map((value) => {
      const option = catalog.find(([name]) => name === value);

      return option ? `${option[1]} (${value})` : value;
    })
    .join(', ');
}

function createOptionSummary(evolutionOptions) {
  return Object.entries(evolutionOptions).map(([name, value]) => [
    formatOptionName(name),
    formatOptionSummaryValue(name, value),
  ]);
}

function formatOptionSummaryValue(name, value) {
  if (name === 'bootstrapComponents' || name === 'tailwindComponents') {
    return formatDesignSystemComponentSelection(String(value).split(','));
  }

  if (name === 'translocoLanguages') {
    return formatCatalogSelection(String(value).split(','), translocoLanguages);
  }

  if (name === 'translocoDefaultLanguage') {
    return formatCatalogSelection([String(value)], translocoLanguages);
  }

  if (name === 'layoutComponents') {
    return formatCatalogSelection(String(value).split(','), layoutComponents);
  }

  return value;
}

function formatOptionName(value) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (first) => first.toUpperCase());
}

async function runSchematic(evolution, preview, evolutionOptions) {
  printStep({
    title: preview ? 'Execute preview' : 'Execute apply',
    description: preview
      ? 'Inspect the planned changes without touching the workspace.'
      : 'Apply the selected evolution to the workspace.',
    meta: [
      ['Evolution', evolution.label],
      ['Mode', preview ? 'Preview' : 'Apply'],
      ...createOptionSummary(evolutionOptions),
    ],
  });

  const workflow = createSchematicWorkflow(preview);

  workflow.reporter.subscribe((event) => {
    printSchematicEvent(event);
  });

  await executeWorkflow(workflow, {
    allowPrivate: true,
    collection: SCHEMATICS_COLLECTION_PATH,
    debug: false,
    logger: createSchematicLogger(),
    options: {
      name: evolution.name,
      preview,
      ...evolutionOptions,
    },
    schematic: 'evolution',
  });
}

function printStep(step) {
  printSection(step.title);

  if (step.description) {
    console.log(color.dim(step.description));
    console.log('');
  }

  for (const [label, value] of step.meta ?? []) {
    console.log(`${color.dim(label)} ${color.bold(value)}`);
  }

  if (step.meta?.length) {
    console.log('');
  }
}

function createSchematicWorkflow(preview) {
  const registry = new schema.CoreSchemaRegistry(formats.standardFormats);
  registry.addPostTransform(schema.transforms.addUndefinedDefaults);

  return new NodeWorkflow(process.cwd(), {
    dryRun: preview,
    force: false,
    registry,
    resolvePaths: [process.cwd(), dirname(SCHEMATICS_COLLECTION_PATH)],
    schemaValidation: true,
  });
}

function executeWorkflow(workflow, executionOptions) {
  return new Promise((resolve, reject) => {
    workflow.execute(executionOptions).subscribe({
      complete: resolve,
      error: reject,
    });
  });
}

function createSchematicLogger() {
  const logger = new logging.Logger('aes-evolution-cli');
  logger.subscribe((entry) => {
    const message = entry.message;

    if (!message) {
      return;
    }

    if (entry.level === 'error') {
      console.error(color.red(message));
      return;
    }

    if (entry.level === 'warn') {
      console.warn(color.yellow(message));
      return;
    }

    console.log(message);
  });

  return logger;
}

function printSchematicEvent(event) {
  if (event.kind === 'error') {
    console.error(color.red(`${event.path}: ${event.description}`));
    return;
  }

  if (event.kind === 'create') {
    console.log(`${color.cyan('CREATE')} ${event.path}`);
    return;
  }

  if (event.kind === 'update') {
    console.log(`${color.cyan('UPDATE')} ${event.path}`);
    return;
  }

  if (event.kind === 'delete') {
    console.log(`${color.cyan('DELETE')} ${event.path}`);
  }
}

function initializeEvolutionManifest() {
  evolutionManifest = readEvolutionManifest();
  validateEvolutionManifest(evolutionManifest);
  evolutions = evolutionManifest.evolutions;

  translocoLanguages = getManifestOptionCatalog('translocoLanguages').map((language) => [
    language.value,
    language.label,
    language.description,
  ]);

  designSystemComponents = getManifestOptionCatalog('starterUiComponents').map((component) => [
    component.value,
    component.label,
    component.description,
  ]);

  layoutComponents = getManifestOptionCatalog('layoutComponents').map((component) => [
    component.value,
    component.label,
    component.description,
  ]);

  const bootstrapDefaultComponents = getManifestOptionSuggestedValue(
    'bootstrap',
    'bootstrapComponents',
  );
  const tailwindDefaultComponents = getManifestOptionSuggestedValue(
    'tailwind',
    'tailwindComponents',
  );

  if (bootstrapDefaultComponents !== tailwindDefaultComponents) {
    throw new Error(
      'Invalid evolution manifest: Bootstrap and Tailwind starter component defaults must match.',
    );
  }

  designSystemDefaultComponents = bootstrapDefaultComponents;
  defaultAiGenkitModel = getManifestOptionDefault('ai-genkit', 'aiModel');
}

function readEvolutionManifest() {
  if (!existsSync(EVOLUTION_MANIFEST_PATH)) {
    throw new Error(`Evolution manifest not found: ${EVOLUTION_MANIFEST_PATH}`);
  }

  try {
    return JSON.parse(readFileSync(EVOLUTION_MANIFEST_PATH, 'utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new Error(`Invalid evolution manifest at ${EVOLUTION_MANIFEST_PATH}: ${reason}`);
  }
}

function validateEvolutionManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Invalid evolution manifest: expected a JSON object.');
  }

  if (manifest.schemaVersion !== 1) {
    throw new Error(
      `Unsupported evolution manifest schema version: ${String(manifest.schemaVersion)}.`,
    );
  }

  if (!Array.isArray(manifest.evolutions) || manifest.evolutions.length === 0) {
    throw new Error('Invalid evolution manifest: evolutions must be a non-empty array.');
  }

  const evolutionNames = new Set();

  for (const evolution of manifest.evolutions) {
    validateManifestString(evolution?.name, 'evolution name');
    validateManifestString(evolution?.label, `${evolution.name} label`);
    validateManifestString(evolution?.description, `${evolution.name} description`);

    if (evolutionNames.has(evolution.name)) {
      throw new Error(`Invalid evolution manifest: duplicate evolution "${evolution.name}".`);
    }

    evolutionNames.add(evolution.name);

    if (!Array.isArray(evolution.options) || !Array.isArray(evolution.dependencies)) {
      throw new Error(
        `Invalid evolution manifest: "${evolution.name}" requires options and dependencies arrays.`,
      );
    }

    for (const option of evolution.options) {
      validateManifestString(option?.name, `${evolution.name} option name`);
      validateManifestString(option?.cliFlag, `${evolution.name}.${option?.name} CLI flag`);
      validateManifestString(option?.type, `${evolution.name}.${option?.name} type`);
      validateManifestString(option?.description, `${evolution.name}.${option?.name} description`);
    }
  }
}

function validateManifestString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid evolution manifest: ${fieldName} must be a non-empty string.`);
  }
}

function getManifestEvolution(evolutionName) {
  const evolution = evolutionManifest.evolutions.find(
    (candidate) => candidate.name === evolutionName,
  );

  if (!evolution) {
    throw new Error(`Evolution manifest does not define "${evolutionName}".`);
  }

  return evolution;
}

function getManifestOption(evolutionName, optionName) {
  const option = getManifestEvolution(evolutionName).options.find(
    (candidate) => candidate.name === optionName,
  );

  if (!option) {
    throw new Error(
      `Evolution manifest does not define option "${optionName}" for "${evolutionName}".`,
    );
  }

  return option;
}

function getManifestChoices(evolutionName, optionName) {
  const choices = getManifestOption(evolutionName, optionName).choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error(`Evolution manifest option "${evolutionName}.${optionName}" requires choices.`);
  }

  return choices.map((choice) => {
    validateManifestString(choice?.value, `${evolutionName}.${optionName} choice value`);
    validateManifestString(choice?.label, `${evolutionName}.${optionName} choice label`);
    validateManifestString(
      choice?.description,
      `${evolutionName}.${optionName} choice description`,
    );

    return [choice.value, choice.label, choice.description];
  });
}

function getManifestChoiceValues(evolutionName, optionName) {
  return getManifestChoices(evolutionName, optionName).map(([value]) => value);
}

function getManifestOptionDefault(evolutionName, optionName) {
  const defaultValue = getManifestOption(evolutionName, optionName).default;

  if (typeof defaultValue !== 'string' || !defaultValue.trim()) {
    throw new Error(
      `Evolution manifest option "${evolutionName}.${optionName}" requires a string default.`,
    );
  }

  return defaultValue;
}

function getManifestOptionSuggestedValue(evolutionName, optionName) {
  const suggestedValue = getManifestOption(evolutionName, optionName).suggestedValue;

  if (typeof suggestedValue !== 'string' || !suggestedValue.trim()) {
    throw new Error(
      `Evolution manifest option "${evolutionName}.${optionName}" requires a suggested value.`,
    );
  }

  return suggestedValue;
}

function getManifestOptionCatalog(catalogName) {
  const catalog = evolutionManifest.optionCatalogs?.[catalogName];

  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error(`Evolution manifest option catalog "${catalogName}" is missing or empty.`);
  }

  for (const option of catalog) {
    validateManifestString(option?.value, `${catalogName} value`);
    validateManifestString(option?.label, `${catalogName} label`);
    validateManifestString(option?.description, `${catalogName} description`);
  }

  return catalog;
}

function readStarterVersion() {
  const packageJsonPath =
    process.env['AES_CLI_PACKAGE_JSON_PATH'] ??
    resolve(dirname(fileURLToPath(import.meta.url)), '../../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

  return packageJson.version ?? 'unknown';
}

function run(command, commandArgs, step) {
  printSection(step.title);

  if (step.description) {
    console.log(color.dim(step.description));
    console.log('');
  }

  for (const [label, value] of step.meta ?? []) {
    console.log(`${color.dim(label)} ${color.bold(value)}`);
  }

  if (step.meta?.length) {
    console.log('');
  }

  console.log(color.bold('Command'));
  console.log(color.dim(`${command} ${commandArgs.join(' ')}`));
  console.log('');

  const result = spawnSync(command, commandArgs, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${commandArgs.join(' ')}`);
  }
}
