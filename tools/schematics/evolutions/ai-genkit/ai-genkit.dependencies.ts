import { getEvolutionDependencyRequirement } from '../../evolution/evolution-manifest';
import { type PackageDependencyRequirement } from '../../shared/package-dependency';
import {
  AI_GENKIT_CORE_DEPENDENCY_NAMES,
  type AiGenkitProviderInstallerDefinition,
} from './ai-genkit.model';

export function getAiGenkitDependencyRequirements(
  providerInstaller: AiGenkitProviderInstallerDefinition,
): readonly PackageDependencyRequirement[] {
  const dependencyNames = [
    ...AI_GENKIT_CORE_DEPENDENCY_NAMES,
    ...providerInstaller.dependencyNames,
  ];

  return [...new Set(dependencyNames)].map((dependencyName) =>
    getEvolutionDependencyRequirement('ai-genkit', dependencyName),
  );
}
