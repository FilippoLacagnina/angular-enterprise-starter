export interface TranslocoTranslationSeed {
  readonly example: string;
  readonly description: string;
  readonly title: string;
}

export interface TranslocoLanguageDefinition {
  readonly code: string;
  readonly label: string;
  readonly translation: TranslocoTranslationSeed;
}

export interface TranslocoInstallPlan {
  readonly languages: readonly TranslocoLanguageDefinition[];
  readonly defaultLanguage: string;
}

export const DEFAULT_TRANSLOCO_LANGUAGES = ['en', 'it'] as const;
export const DEFAULT_TRANSLOCO_LANGUAGE = 'en';

export const TRANSLOCO_LANGUAGE_DEFINITIONS = [
  {
    code: 'en',
    label: 'English',
    translation: { example: 'Example', description: 'Description', title: 'Title' },
  },
  {
    code: 'it',
    label: 'Italian',
    translation: { example: 'Esempio', description: 'Descrizione', title: 'Titolo' },
  },
  {
    code: 'es',
    label: 'Spanish',
    translation: { example: 'Ejemplo', description: 'Descripción', title: 'Título' },
  },
  {
    code: 'fr',
    label: 'French',
    translation: { example: 'Exemple', description: 'Description', title: 'Titre' },
  },
  {
    code: 'de',
    label: 'German',
    translation: { example: 'Beispiel', description: 'Beschreibung', title: 'Titel' },
  },
  {
    code: 'pt',
    label: 'Portuguese',
    translation: { example: 'Exemplo', description: 'Descrição', title: 'Título' },
  },
  {
    code: 'nl',
    label: 'Dutch',
    translation: { example: 'Voorbeeld', description: 'Beschrijving', title: 'Titel' },
  },
  {
    code: 'zh',
    label: 'Chinese',
    translation: { example: '示例', description: '描述', title: '标题' },
  },
  {
    code: 'ja',
    label: 'Japanese',
    translation: { example: '例', description: '説明', title: 'タイトル' },
  },
  {
    code: 'ko',
    label: 'Korean',
    translation: { example: '예시', description: '설명', title: '제목' },
  },
  {
    code: 'ar',
    label: 'Arabic',
    translation: { example: 'مثال', description: 'الوصف', title: 'العنوان' },
  },
  {
    code: 'hi',
    label: 'Hindi',
    translation: { example: 'उदाहरण', description: 'विवरण', title: 'शीर्षक' },
  },
] as const satisfies readonly TranslocoLanguageDefinition[];

export const TRANSLOCO_LANGUAGE_CODES: readonly string[] = TRANSLOCO_LANGUAGE_DEFINITIONS.map(
  (language) => language.code,
);

export function getTranslocoLanguageDefinition(
  code: string,
): TranslocoLanguageDefinition | undefined {
  return TRANSLOCO_LANGUAGE_DEFINITIONS.find((language) => language.code === code);
}
