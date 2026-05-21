import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const STARTER_VERSION = readStarterVersion();
const CLI_DOCUMENTATION_URL =
  'https://github.com/FilippoLacagnina/angular-enterprise-starter/blob/main/docs/schematics.md';
const HEADER_CONTENT_WIDTH = Math.max(70, CLI_DOCUMENTATION_URL.length - 4);

const EVOLUTIONS = [
  {
    name: 'signal-store',
    label: 'SignalStore',
    description: 'Feature-scoped NgRx SignalStore baseline.',
  },
  {
    name: 'docker-ssr',
    label: 'Docker SSR',
    description: 'SSR-oriented Docker deployment baseline.',
  },
  {
    name: 'bootstrap',
    label: 'Bootstrap',
    description: 'Bootstrap design-system baseline.',
  },
];

const BOOTSTRAP_COMPONENTS = [
  ['alert', 'Alert', 'Contextual feedback message.'],
  ['badge', 'Badge', 'Small count or status label.'],
  ['button', 'Button', 'Action button wrapper.'],
  ['card', 'Card', 'Content container.'],
  ['input', 'Input', 'Basic form-control input.'],
];
const BOOTSTRAP_DEFAULT_COMPONENTS = 'button,input,card';

const color = {
  bold: (value) => `\x1b[1m${value}\x1b[0m`,
  cyan: (value) => `\x1b[36m${value}\x1b[0m`,
  dim: (value) => `\x1b[2m${value}\x1b[0m`,
  green: (value) => `\x1b[32m${value}\x1b[0m`,
  red: (value) => `\x1b[31m${value}\x1b[0m`,
  yellow: (value) => `\x1b[33m${value}\x1b[0m`,
};

const args = parseArgs(process.argv.slice(2));

main().catch((error) => {
  console.error('');
  console.error(color.red('Evolution failed.'));
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
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

  run('npm', ['run', 'schematics:build'], {
    title: 'Prepare schematics',
    description: 'Compile local generators and copy Angular CLI collection assets.',
  });

  const generateArgs = [
    'ng',
    'generate',
    './dist/schematics/collection.json:evolution',
    '--name',
    evolution.name,
  ];

  if (preview) {
    generateArgs.push('--preview');
  }

  for (const [optionName, optionValue] of Object.entries(evolutionOptions)) {
    generateArgs.push(`--${formatCliOptionName(optionName)}`, optionValue);
  }

  run('npx', generateArgs, {
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
  printNextSteps(preview);
}

async function resolveEvolutionOptions(evolution, shouldAskOptions) {
  if (evolution.name === 'signal-store') {
    return resolveSignalStoreOptions(shouldAskOptions);
  }

  if (evolution.name === 'bootstrap') {
    return resolveBootstrapOptions(shouldAskOptions);
  }

  return {};
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

  const storeScope = await askChoice('SignalStore scope', [
    ['feature', 'Feature', 'Generate state under src/app/features/<feature>/state.'],
    ['root', 'Root', 'Generate a root-provided store under src/app/core/state.'],
  ]);

  if (storeScope === 'root') {
    const storeName = await askAvailableRootStoreName('app');

    return createSignalStoreOptions({ storeScope, storeName });
  }

  while (true) {
    const featureName = await askAvailableSignalStoreFeatureName('dashboard');
    const featureComponent = await askChoice('Feature component', [
      ['existing', 'Already exists', 'Create state/store only.'],
      ['create', 'Create it', 'Create a minimal route and standalone component.'],
    ]);

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

async function resolveBootstrapOptions(shouldAskOptions) {
  if (!shouldAskOptions) {
    return createBootstrapOptions({
      bootstrapMode: args.bootstrapMode,
      bootstrapComponents: args.bootstrapComponents,
    });
  }

  const bootstrapMode = await askChoice('Bootstrap setup', [
    ['all', 'Install all starter UI components', 'Generate every Bootstrap wrapper component.'],
    ['select', 'Select UI components', 'Choose only the Bootstrap wrappers you need.'],
  ]);

  if (bootstrapMode === 'all') {
    return createBootstrapOptions({ bootstrapMode });
  }

  const bootstrapComponents = await askBootstrapComponents();

  return createBootstrapOptions({
    bootstrapMode,
    bootstrapComponents,
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

    for (const [index, evolution] of EVOLUTIONS.entries()) {
      console.log(`${color.cyan(`${index + 1}.`)} ${color.bold(evolution.label)}`);
      console.log(`   ${color.dim(evolution.description)}`);
    }

    console.log('');
    const answer = await rl.question(`${color.bold('Select evolution')} `);
    const selectedIndex = Number.parseInt(answer, 10) - 1;
    const selectedEvolution = EVOLUTIONS[selectedIndex];

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

async function askChoice(title, choices) {
  const rl = createInterface({ input, output });

  try {
    printSection(title);

    for (const [index, [, label, description]] of choices.entries()) {
      console.log(`${color.cyan(`${index + 1}.`)} ${color.bold(label)}`);
      console.log(`   ${color.dim(description)}`);
    }

    console.log('');
    const answer = await rl.question(`${color.bold('Select option')} ${color.dim('[1]')} `);
    const selectedIndex = answer === '' ? 0 : Number.parseInt(answer, 10) - 1;
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

async function askBootstrapComponents() {
  while (true) {
    printSection('Select Bootstrap components');
    console.log(color.dim('Choose the starter-owned wrappers to generate.'));
    console.log(color.dim('Use numbers, names, or a mix of both.'));
    console.log('');

    printBootstrapComponentChoices();
    console.log('');
    console.log(
      `${color.dim('Examples')} ${color.bold('3,5')} ${color.dim('or')} ${color.bold(
        'button,input',
      )} ${color.dim('or')} ${color.bold('3,input')}`,
    );
    console.log(
      `${color.dim('Recommended starter set')} ${color.bold(
        formatBootstrapComponentSelection(BOOTSTRAP_DEFAULT_COMPONENTS.split(',')),
      )}`,
    );
    console.log('');

    const answer = await askText('Components', BOOTSTRAP_DEFAULT_COMPONENTS);

    try {
      const selectedComponents = parseBootstrapComponentSelection(answer);

      console.log('');
      console.log(
        `${color.green('Selected')} ${color.bold(formatBootstrapComponentSelection(selectedComponents))}`,
      );

      return selectedComponents.join(',');
    } catch (error) {
      console.log('');
      console.log(color.yellow(error instanceof Error ? error.message : String(error)));
      console.log(color.dim(createBootstrapSelectionHint()));
    }
  }
}

function printBootstrapComponentChoices() {
  for (const [index, [name, label, description]] of BOOTSTRAP_COMPONENTS.entries()) {
    console.log(
      `${color.cyan(`${index + 1}.`)} ${color.bold(label)} ${color.dim(`(${name})`)}`,
    );
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

function printSection(title) {
  console.log('');
  console.log(color.dim('--------------------------------------------------------------'));
  console.log(color.bold(title));
  console.log(color.dim('--------------------------------------------------------------'));
}

function getEvolution(evolutionName) {
  const evolution = EVOLUTIONS.find((candidate) => candidate.name === evolutionName);

  if (!evolution) {
    throw new Error(`Unsupported evolution: ${evolutionName}`);
  }

  return evolution;
}

function createSignalStoreOptions(options) {
  const storeScope = options.storeScope ?? 'feature';

  if (storeScope === 'root') {
    return {
      storeScope,
      storeName: normalizeFeatureName(options.storeName ?? 'app'),
    };
  }

  return {
    storeScope,
    featureName: normalizeFeatureName(options.featureName ?? 'dashboard'),
    featureComponent: options.featureComponent ?? 'existing',
  };
}

function createBootstrapOptions(options) {
  const bootstrapMode = options.bootstrapMode ?? 'all';

  if (!['all', 'select'].includes(bootstrapMode)) {
    throw new Error(`Unsupported Bootstrap mode: ${bootstrapMode}.`);
  }

  if (bootstrapMode === 'all') {
    return { bootstrapMode };
  }

  return {
    bootstrapMode,
    bootstrapComponents: parseBootstrapComponentSelection(options.bootstrapComponents).join(','),
  };
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

function parseBootstrapComponentSelection(value) {
  if (!value?.trim()) {
    throw new Error('Select at least one Bootstrap component.');
  }

  const selectedComponents = value
    .split(',')
    .map((component) => component.trim().toLowerCase())
    .filter(Boolean)
    .map((component) => resolveBootstrapComponentName(component));

  return [...new Set(selectedComponents)];
}

function resolveBootstrapComponentName(value) {
  const componentIndex = Number.parseInt(value, 10);

  if (Number.isInteger(componentIndex) && String(componentIndex) === value) {
    const component = BOOTSTRAP_COMPONENTS[componentIndex - 1];

    if (component) {
      return component[0];
    }
  }

  if (BOOTSTRAP_COMPONENTS.some(([componentName]) => componentName === value)) {
    return value;
  }

  throw new Error(
    `Unsupported Bootstrap component: ${value}. Supported components: ${getBootstrapComponentNames().join(
      ', ',
    )}.`,
  );
}

function getBootstrapComponentNames() {
  return BOOTSTRAP_COMPONENTS.map(([componentName]) => componentName);
}

function createBootstrapSelectionHint() {
  return `Use numbers 1-${BOOTSTRAP_COMPONENTS.length}, component names (${getBootstrapComponentNames().join(
    ', ',
  )}), or a mix like 3,input.`;
}

function formatBootstrapComponentSelection(componentNames) {
  return componentNames
    .map((componentName) => {
      const component = BOOTSTRAP_COMPONENTS.find(([name]) => name === componentName);

      return component?.[1] ?? componentName;
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
  if (name === 'bootstrapComponents') {
    return formatBootstrapComponentSelection(String(value).split(','));
  }

  return value;
}

function formatOptionName(value) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (first) => first.toUpperCase());
}

function formatCliOptionName(value) {
  return value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function parseArgs(rawArgs) {
  const parsedArgs = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === '--version' || arg === '-v') {
      parsedArgs.version = true;
      continue;
    }

    if (arg === '--name') {
      parsedArgs.name = rawArgs[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--preview') {
      parsedArgs.preview = true;
      continue;
    }

    if (arg === '--apply') {
      parsedArgs.preview = false;
      continue;
    }

    if (arg === '--yes' || arg === '-y') {
      parsedArgs.yes = true;
      continue;
    }

    if (arg === '--store-scope') {
      parsedArgs.storeScope = rawArgs[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--feature-name') {
      parsedArgs.featureName = rawArgs[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--feature-component') {
      parsedArgs.featureComponent = rawArgs[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--store-name') {
      parsedArgs.storeName = rawArgs[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--bootstrap-mode') {
      parsedArgs.bootstrapMode = rawArgs[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--bootstrap-components') {
      parsedArgs.bootstrapComponents = rawArgs[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unsupported argument: ${arg}`);
  }

  return parsedArgs;
}

function readStarterVersion() {
  const packageJson = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  );

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
