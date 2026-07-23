const GLOBAL_BOOLEAN_OPTIONS = new Map([
  ['--apply', { name: 'preview', value: false }],
  ['--help', { name: 'help', value: true }],
  ['--preview', { name: 'preview', value: true }],
  ['--version', { name: 'version', value: true }],
  ['--yes', { name: 'yes', value: true }],
  ['-h', { name: 'help', value: true }],
  ['-v', { name: 'version', value: true }],
  ['-y', { name: 'yes', value: true }],
]);

const GLOBAL_VALUE_OPTIONS = new Map([['--name', 'name']]);

export function parseCliArgs(rawArgs, manifest) {
  const parsedArgs = {};
  const manifestOptions = createManifestOptionMap(manifest);
  const providedFlags = new Set();
  const providedEvolutionOptions = [];
  let hasApply = false;
  let hasPreview = false;

  for (let index = 0; index < rawArgs.length; index += 1) {
    const { flag, inlineValue } = splitArgument(rawArgs[index]);
    const booleanOption = GLOBAL_BOOLEAN_OPTIONS.get(flag);

    if (booleanOption) {
      if (inlineValue !== undefined) {
        throw new Error(`Option ${flag} does not accept a value.`);
      }

      assertOptionNotRepeated(providedFlags, flag);
      parsedArgs[booleanOption.name] = booleanOption.value;
      hasApply ||= flag === '--apply';
      hasPreview ||= flag === '--preview';
      continue;
    }

    const globalOptionName = GLOBAL_VALUE_OPTIONS.get(flag);
    const manifestOption = manifestOptions.get(flag);

    if (!globalOptionName && !manifestOption) {
      throw new Error(`Unsupported argument: ${flag}`);
    }

    assertOptionNotRepeated(providedFlags, flag);

    const optionValue = inlineValue ?? readFollowingOptionValue(rawArgs, index, flag);

    if (inlineValue === undefined) {
      index += 1;
    }

    if (globalOptionName) {
      parsedArgs[globalOptionName] = optionValue;
      continue;
    }

    parsedArgs[manifestOption.name] = optionValue;
    providedEvolutionOptions.push(manifestOption);
  }

  if (hasApply && hasPreview) {
    throw new Error('Options --preview and --apply cannot be used together.');
  }

  if (parsedArgs.version && rawArgs.length > 1) {
    throw new Error('Option --version cannot be combined with other arguments.');
  }

  validateEvolutionOptionScope(parsedArgs.name, providedEvolutionOptions, manifest);

  return parsedArgs;
}

export function createCliHelp(manifest, version, selectedEvolutionName) {
  const selectedEvolution = selectedEvolutionName
    ? getEvolution(manifest, selectedEvolutionName)
    : undefined;
  const displayedEvolutions = selectedEvolution ? [selectedEvolution] : manifest.evolutions;
  const lines = [
    `Angular Enterprise Starter Evolution CLI v${version}`,
    '',
    'Usage:',
    '  angular-enterprise-starter evolution [options]',
    '  aes evolution [options]',
    '',
    'Global options:',
    '  --name <evolution>  Evolution to preview or apply.',
    '  --preview           Show planned changes without writing files.',
    '  --apply             Apply the selected evolution.',
    '  --yes, -y           Skip the apply confirmation.',
    '  --help, -h          Show this help.',
    '  --version, -v       Show the CLI version.',
    '',
    selectedEvolution ? 'Selected evolution:' : 'Available evolutions:',
  ];

  for (const evolution of displayedEvolutions) {
    lines.push(`  ${evolution.name.padEnd(16)} ${evolution.description}`);
  }

  const evolutionsWithOptions = displayedEvolutions.filter(
    (evolution) => evolution.options.length > 0,
  );

  if (evolutionsWithOptions.length > 0) {
    lines.push('', 'Evolution options:');

    for (const evolution of evolutionsWithOptions) {
      lines.push(`  ${evolution.label} (${evolution.name})`);

      for (const option of evolution.options) {
        lines.push(...createOptionHelpLines(option, manifest));
      }
    }
  }

  lines.push(
    '',
    'Examples:',
    '  angular-enterprise-starter evolution',
    '  angular-enterprise-starter evolution --name bootstrap --preview',
    '  angular-enterprise-starter evolution --name layout-shell --preview --layout-mode select --layout-components shell,header,sidebar',
    '  angular-enterprise-starter evolution --name ai-genkit --apply --yes',
  );

  return `${lines.join('\n')}\n`;
}

function createManifestOptionMap(manifest) {
  const optionMap = new Map();

  for (const evolution of manifest.evolutions) {
    for (const option of evolution.options) {
      if (optionMap.has(option.cliFlag)) {
        throw new Error(`Duplicate evolution CLI option: ${option.cliFlag}`);
      }

      optionMap.set(option.cliFlag, {
        cliFlag: option.cliFlag,
        evolutionName: evolution.name,
        name: option.name,
      });
    }
  }

  return optionMap;
}

function splitArgument(argument) {
  if (!argument.startsWith('-')) {
    throw new Error(`Unsupported positional argument: ${argument}`);
  }

  const equalsIndex = argument.indexOf('=');

  if (equalsIndex < 0) {
    return { flag: argument, inlineValue: undefined };
  }

  const flag = argument.slice(0, equalsIndex);
  const inlineValue = argument.slice(equalsIndex + 1);

  if (!inlineValue) {
    throw new Error(`Option ${flag} requires a value.`);
  }

  return { flag, inlineValue };
}

function readFollowingOptionValue(rawArgs, index, flag) {
  const value = rawArgs[index + 1];

  if (!value || value.startsWith('-')) {
    throw new Error(`Option ${flag} requires a value.`);
  }

  return value;
}

function assertOptionNotRepeated(providedFlags, flag) {
  if (providedFlags.has(flag)) {
    throw new Error(`Option ${flag} was provided more than once.`);
  }

  providedFlags.add(flag);
}

function validateEvolutionOptionScope(evolutionName, providedOptions, manifest) {
  if (evolutionName) {
    getEvolution(manifest, evolutionName);
  }

  if (providedOptions.length === 0) {
    return;
  }

  if (!evolutionName) {
    throw new Error('Evolution-specific options require --name <evolution>.');
  }

  const invalidOption = providedOptions.find((option) => option.evolutionName !== evolutionName);

  if (invalidOption) {
    throw new Error(
      `Option ${invalidOption.cliFlag} belongs to evolution "${invalidOption.evolutionName}", not "${evolutionName}".`,
    );
  }
}

function getEvolution(manifest, evolutionName) {
  const evolution = manifest.evolutions.find((candidate) => candidate.name === evolutionName);

  if (!evolution) {
    throw new Error(`Unsupported evolution: ${evolutionName}`);
  }

  return evolution;
}

function createOptionHelpLines(option, manifest) {
  const values = resolveOptionValues(option, manifest);
  const valueHint = values.length > 0 ? ` <${values.join('|')}>` : ' <value>';
  const metadata = [];

  if (option.default !== undefined) {
    metadata.push(`default: ${option.default}`);
  }

  if (option.suggestedValue !== undefined) {
    metadata.push(`suggested: ${option.suggestedValue}`);
  }

  if (option.when) {
    metadata.push(`when ${toKebabCase(option.when.option)}=${option.when.equals}`);
  }

  const suffix = metadata.length > 0 ? ` (${metadata.join('; ')})` : '';

  return [`    ${option.cliFlag}${valueHint}`, `      ${option.description}${suffix}`];
}

function resolveOptionValues(option, manifest) {
  if (Array.isArray(option.choices)) {
    return option.choices.map((choice) => choice.value);
  }

  if (option.choiceCatalog) {
    return (manifest.optionCatalogs?.[option.choiceCatalog] ?? []).map((choice) => choice.value);
  }

  return [];
}

function toKebabCase(value) {
  return value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
