import { logger as genkitLogger } from 'genkit/logging';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { configureSecureGenkitLogging } from './genkit-logging';

describe('configureSecureGenkitLogging', () => {
  afterEach(() => {
    genkitLogger.init(genkitLogger.defaultLogger);
    vi.restoreAllMocks();
  });

  it('prevents raw provider errors from reaching the console', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    configureSecureGenkitLogging();

    genkitLogger.error({
      detail: {
        apiKey: 'server-secret',
        prompt: 'sensitive user content',
      },
    });

    expect(error).not.toHaveBeenCalled();
  });
});
