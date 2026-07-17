import { HttpHeaders, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AI_CLIENT_CONFIG } from './ai-client.config';
import { AiClientError } from './ai-client.error';
import { AiSummaryClient } from './ai-summary.client';

describe('AiSummaryClient', () => {
  let client: AiSummaryClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AI_CLIENT_CONFIG,
          useValue: {
            basePath: '/api/ai/',
            timeoutMs: 1_000,
          },
        },
      ],
    });

    client = TestBed.inject(AiSummaryClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
    TestBed.resetTestingModule();
  });

  it('posts typed input and returns a validated summary', async () => {
    const resultPromise = firstValueFrom(client.summarize({ text: 'Source text' }));
    const request = http.expectOne('/api/ai/summarize');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ text: 'Source text' });
    request.flush({ summary: 'Short summary' });

    await expect(resultPromise).resolves.toEqual({ summary: 'Short summary' });
  });

  it('preserves a typed 429 response from the backend', async () => {
    const resultPromise = firstValueFrom(client.summarize({ text: 'Source text' }));
    const request = http.expectOne('/api/ai/summarize');

    request.flush(
      {
        code: 'AI_RATE_LIMITED',
        message: 'The AI provider rate limit was reached. Try again later.',
        requestId: 'request-429',
        retryable: true,
      },
      { status: 429, statusText: 'Too Many Requests' },
    );

    await expect(resultPromise).rejects.toMatchObject({
      code: 'AI_RATE_LIMITED',
      httpStatus: 429,
      requestId: 'request-429',
      retryable: true,
    });
  });

  it('maps an untyped 429 response without exposing its body', async () => {
    const resultPromise = firstValueFrom(client.summarize({ text: 'Source text' }));
    const request = http.expectOne('/api/ai/summarize');

    request.flush('sensitive provider detail', {
      headers: new HttpHeaders({ 'X-Correlation-Id': 'request-fallback' }),
      status: 429,
      statusText: 'Too Many Requests',
    });

    const error = await resultPromise.catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AiClientError);
    expect(error).toMatchObject({
      code: 'AI_RATE_LIMITED',
      httpStatus: 429,
      requestId: 'request-fallback',
      retryable: true,
    });
    expect(JSON.stringify(error)).not.toContain('sensitive provider detail');
  });

  it('times out and cancels the pending HTTP request', async () => {
    vi.useFakeTimers();
    const resultPromise = firstValueFrom(client.summarize({ text: 'Source text' }));
    const expectedRejection = expect(resultPromise).rejects.toMatchObject({
      code: 'AI_TIMEOUT',
      retryable: true,
    });
    const request = http.expectOne('/api/ai/summarize');

    await vi.advanceTimersByTimeAsync(1_001);

    await expectedRejection;
    expect(request.cancelled).toBe(true);
  });

  it('cancels the HTTP request when the consumer unsubscribes', () => {
    const subscription = client.summarize({ text: 'Source text' }).subscribe();
    const request = http.expectOne('/api/ai/summarize');

    subscription.unsubscribe();

    expect(request.cancelled).toBe(true);
  });

  it('rejects an invalid success response', async () => {
    const resultPromise = firstValueFrom(client.summarize({ text: 'Source text' }));
    const request = http.expectOne('/api/ai/summarize');

    request.flush({ result: 'Unexpected shape' });

    await expect(resultPromise).rejects.toMatchObject({
      code: 'AI_PROVIDER_ERROR',
      message: 'The AI service returned an invalid response.',
      retryable: true,
    });
  });

  it('maps network failures to a retryable client error', async () => {
    const resultPromise = firstValueFrom(client.summarize({ text: 'Source text' }));
    const request = http.expectOne('/api/ai/summarize');

    request.error(new ProgressEvent('error'));

    await expect(resultPromise).rejects.toMatchObject({
      code: 'AI_NETWORK_ERROR',
      retryable: true,
    });
  });
});
