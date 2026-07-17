import { InjectionToken } from '@angular/core';

export const DEFAULT_AI_CLIENT_TIMEOUT_MS = 35_000;

export interface AiClientConfig {
  basePath: string;
  timeoutMs: number;
}

export const AI_CLIENT_CONFIG = new InjectionToken<AiClientConfig>('AI_CLIENT_CONFIG', {
  factory: () => ({
    basePath: '/api/ai',
    timeoutMs: DEFAULT_AI_CLIENT_TIMEOUT_MS,
  }),
  providedIn: 'root',
});
