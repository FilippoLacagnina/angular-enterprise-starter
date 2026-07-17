import type { AiProviderDefinition } from './ai-provider.definition';
// <ai-genkit-provider-imports>
import { googleGeminiProviderDefinition } from './google-gemini.provider.definition';
// </ai-genkit-provider-imports>

export const INSTALLED_AI_PROVIDER_DEFINITIONS: readonly AiProviderDefinition[] = [
  // <ai-genkit-provider-entries>
  googleGeminiProviderDefinition,
  // </ai-genkit-provider-entries>
];
