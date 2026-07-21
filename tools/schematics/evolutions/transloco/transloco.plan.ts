import { SchematicsException } from '@angular-devkit/schematics';

import { type EvolutionOptions } from '../../evolution/schema';
import {
  DEFAULT_TRANSLOCO_LANGUAGE,
  DEFAULT_TRANSLOCO_LANGUAGES,
  getTranslocoLanguageDefinition,
  type TranslocoInstallPlan,
  TRANSLOCO_LANGUAGE_CODES,
} from './transloco.model';

export const I18N_CONFIG_PATH = '/src/app/core/i18n/i18n.config.ts';
export const I18N_PROVIDER_PATH = '/src/app/core/i18n/i18n.provider.ts';
export const TRANSLOCO_LOADER_PATH = '/src/app/core/i18n/transloco-http-loader.ts';

export function createTranslocoInstallPlan(options: EvolutionOptions): TranslocoInstallPlan {
  const selectedLanguageCodes = parseTranslocoLanguageCodes(options.translocoLanguages);
  const defaultLanguage =
    options.translocoDefaultLanguage?.trim().toLowerCase() || DEFAULT_TRANSLOCO_LANGUAGE;

  if (!TRANSLOCO_LANGUAGE_CODES.includes(defaultLanguage)) {
    throw new SchematicsException(
      `Unsupported Transloco default language: ${defaultLanguage}. Supported languages: ${TRANSLOCO_LANGUAGE_CODES.join(', ')}.`,
    );
  }

  if (!selectedLanguageCodes.includes(defaultLanguage)) {
    throw new SchematicsException(
      `Transloco default language "${defaultLanguage}" must be included in --transloco-languages.`,
    );
  }

  return {
    languages: selectedLanguageCodes.map((code) => {
      const definition = getTranslocoLanguageDefinition(code);

      if (!definition) {
        throw new SchematicsException(`Missing Transloco language definition: ${code}.`);
      }

      return definition;
    }),
    defaultLanguage,
  };
}

export function getTranslocoGeneratedFiles(plan: TranslocoInstallPlan): readonly string[] {
  return [
    I18N_CONFIG_PATH,
    I18N_PROVIDER_PATH,
    TRANSLOCO_LOADER_PATH,
    ...plan.languages.map((language) => getTranslocoTranslationPath(language.code)),
  ];
}

export function getTranslocoTranslationPath(languageCode: string): string {
  return `/src/assets/i18n/${languageCode}.json`;
}

function parseTranslocoLanguageCodes(value: string | undefined): string[] {
  const languageCodes = (value?.trim() || DEFAULT_TRANSLOCO_LANGUAGES.join(','))
    .split(',')
    .map((language) => language.trim().toLowerCase())
    .filter(Boolean);

  if (languageCodes.length === 0) {
    throw new SchematicsException('Select at least one Transloco language.');
  }

  const unsupportedLanguages = languageCodes.filter(
    (languageCode) => !TRANSLOCO_LANGUAGE_CODES.includes(languageCode),
  );

  if (unsupportedLanguages.length > 0) {
    throw new SchematicsException(
      `Unsupported Transloco language selection: ${[...new Set(unsupportedLanguages)].join(', ')}. Supported languages: ${TRANSLOCO_LANGUAGE_CODES.join(', ')}.`,
    );
  }

  return [...new Set(languageCodes)];
}
