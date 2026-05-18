import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

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

const color = {
  cyan: (value) => `\x1b[36m${value}\x1b[0m`,
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
  printHeader();

  const evolutionName = args.name ?? (await askEvolutionName());
  const evolution = getEvolution(evolutionName);
  const preview = args.preview ?? (await askPreviewMode());

  printSummary(evolution, preview);

  if (!preview && !args.yes) {
    const shouldContinue = await askConfirmation(
      `${color.yellow('This will modify your workspace.')} Continue? (y/N): `,
    );

    if (!shouldContinue) {
      console.log('');
      console.log(
        'No changes were made. Run again in preview mode if you want to inspect the impact.',
      );
      return;
    }
  }

  run('npm', ['run', 'schematics:build'], 'Building local schematics');

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

  run('npx', generateArgs, preview ? 'Running evolution preview' : 'Applying evolution');
  printNextSteps(preview);
}

function printHeader() {
  console.log('');
  console.log('Angular Enterprise Starter');
  console.log('Evolution CLI');
  console.log('');
  console.log('Compose optional starter capabilities without bloating the main baseline.');
  console.log('Preview first, apply only when the impact is clear.');
  console.log('');
}

async function askEvolutionName() {
  const rl = createInterface({ input, output });

  try {
    console.log('Available evolutions');
    console.log('');

    for (const [index, evolution] of EVOLUTIONS.entries()) {
      console.log(`${index + 1}. ${evolution.label}`);
      console.log(`   ${evolution.description}`);
    }

    console.log('');
    const answer = await rl.question('Select evolution: ');
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
    console.log('');
    console.log('Choose mode');
    console.log('');
    console.log('1. Preview (recommended)');
    console.log('2. Apply');
    console.log('');

    const answer = await rl.question('Select mode [1]: ');

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

async function askConfirmation(question) {
  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(question);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  } finally {
    rl.close();
  }
}

function printSummary(evolution, preview) {
  console.log('');
  console.log('Selection summary');
  console.log('');
  console.log(`Evolution: ${evolution.label}`);
  console.log(`Mode: ${preview ? 'Preview' : 'Apply'}`);
  console.log('');
}

function printNextSteps(preview) {
  console.log('');

  if (preview) {
    console.log(color.cyan('Preview completed. No files were changed.'));
    console.log('Run the same command with --apply when you are ready.');
    return;
  }

  console.log(color.green('Evolution applied.'));
  console.log('');
  console.log('Recommended next steps:');
  console.log('- npm install');
  console.log('- npm run format:check');
  console.log('- npm run lint');
  console.log('- npm run build');
}

function getEvolution(evolutionName) {
  const evolution = EVOLUTIONS.find((candidate) => candidate.name === evolutionName);

  if (!evolution) {
    throw new Error(`Unsupported evolution: ${evolutionName}`);
  }

  return evolution;
}

function parseArgs(rawArgs) {
  const parsedArgs = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

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

    throw new Error(`Unsupported argument: ${arg}`);
  }

  return parsedArgs;
}

function run(command, commandArgs, label) {
  console.log(`> ${label}`);
  console.log('');

  const result = spawnSync(command, commandArgs, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${commandArgs.join(' ')}`);
  }

  console.log('');
}
