import { logger as genkitLogger } from 'genkit/logging';

const secureGenkitLogger = {
  debug(): void {},
  error(): void {},
  info(): void {},
  level: 'error',
  shouldLog(): boolean {
    return false;
  },
  warn(): void {},
};

/**
 * Genkit's provider logger can receive raw upstream errors. Request outcomes are
 * logged separately through the AI request logger, so internal payloads stay silent.
 */
export function configureSecureGenkitLogging(): void {
  genkitLogger.init(secureGenkitLogger);
}
