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
  printHeader();

  const evolutionName = args.name ?? (await askEvolutionName());
  const evolution = getEvolution(evolutionName);
  const preview = args.preview ?? (await askPreviewMode());

  printSummary(evolution, preview);

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

  run('npx', generateArgs, {
    title: preview ? 'Execute preview' : 'Execute apply',
    description: preview
      ? 'Inspect the planned changes without touching the workspace.'
      : 'Apply the selected evolution to the workspace.',
    meta: [
      ['Evolution', evolution.label],
      ['Mode', preview ? 'Preview' : 'Apply'],
    ],
  });
  printNextSteps(preview);
}

function printHeader() {
  console.log('');
  console.log(color.cyan('╭────────────────────────────────────────────╮'));
  console.log(
    `${color.cyan('│')} ${color.bold('Angular Enterprise Starter')}                 ${color.cyan('│')}`,
  );
  console.log(
    `${color.cyan('│')} ${color.dim('Evolution CLI')}                              ${color.cyan('│')}`,
  );
  console.log(color.cyan('╰────────────────────────────────────────────╯'));
  console.log('');
  console.log('Composable Angular starter capabilities.');
  console.log(`Preview first. ${color.green('Apply')} when ready.`);
  console.log('');
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
  printSection('Selection summary');
  console.log(`${color.dim('Evolution')} ${color.bold(evolution.label)}`);
  console.log(
    `${color.dim('Mode')}      ${preview ? color.cyan('Preview') : color.green('Apply')}`,
  );
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
