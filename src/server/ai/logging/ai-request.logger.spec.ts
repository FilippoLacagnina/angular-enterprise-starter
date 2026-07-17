import { afterEach, describe, expect, it, vi } from 'vitest';

import { consoleAiRequestLogger } from './ai-request.logger';

describe('consoleAiRequestLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs only the structured allowlisted metadata', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    consoleAiRequestLogger.log({
      durationMs: 42,
      event: 'ai_request_completed',
      httpStatus: 200,
      model: 'gemini-test-model',
      provider: 'google-ai',
      requestId: 'request-123',
      status: 'success',
    });

    expect(info).toHaveBeenCalledOnce();
    expect(info).toHaveBeenCalledWith(
      JSON.stringify({
        durationMs: 42,
        event: 'ai_request_completed',
        httpStatus: 200,
        model: 'gemini-test-model',
        provider: 'google-ai',
        requestId: 'request-123',
        status: 'success',
      }),
    );
    expect(info.mock.calls.flat().join(' ')).not.toMatch(/prompt|response|api.?key|user content/i);
  });
});
