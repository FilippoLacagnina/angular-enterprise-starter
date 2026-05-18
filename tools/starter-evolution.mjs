import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const EVOLUTIONS = [
  {
    name: 'signal-store',
    label: 'SignalStore',
    description: 'Feature-scoped NgRx SignalStore baseline.',
  },
];

const args = parseArgs(process.argv.slice(2));

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  console.log('Angular Enterprise Starter Evolution CLI');
  console.log('');

  const evolutionName = args.name ?? (await askEvolutionName());
  const evolution = EVOLUTIONS.find((candidate) => candidate.name === evolutionName);

  if (!evolution) {
    throw new Error(`Unsupported evolution: ${evolutionName}`);
  }

  const preview = args.preview ?? (await askPreviewMode());

  console.log('');
  console.log(`Selected evolution: ${evolution.label}`);
  console.log(`Mode: ${preview ? 'preview' : 'apply'}`);
  console.log('');

  run('npm', ['run', 'schematics:build']);

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

  run('npx', generateArgs);
}

async function askEvolutionName() {
  const rl = createInterface({ input, output });

  try {
    console.log('Which evolution do you want to add?');

    for (const [index, evolution] of EVOLUTIONS.entries()) {
      console.log(`${index + 1}. ${evolution.label} - ${evolution.description}`);
    }

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
    console.log('Mode:');
    console.log('1. Preview');
    console.log('2. Apply');

    const answer = await rl.question('Select mode: ');

    if (answer === '1') {
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

    throw new Error(`Unsupported argument: ${arg}`);
  }

  return parsedArgs;
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${commandArgs.join(' ')}`);
  }
}
