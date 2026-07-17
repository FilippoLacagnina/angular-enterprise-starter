import {
  HttpErrorResponse,
  HttpEventType,
  HttpHeaders,
  provideHttpClient,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, toArray } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AI_CLIENT_CONFIG } from './ai-client.config';
import { mapAiClientError } from './ai-client.error';
import { AiSummaryStreamClient } from './ai-summary-stream.client';

const chunkFrame = JSON.stringify({ delta: 'Short ', type: 'chunk' });
const completeFrame = JSON.stringify({
  output: { summary: 'Short summary.' },
  requestId: 'request-1',
  type: 'complete',
});

describe('AiSummaryStreamClient', () => {
  let client: AiSummaryStreamClient;
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

    client = TestBed.inject(AiSummaryStreamClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('emits fragmented progress chunks followed by the validated final output', async () => {
    const resultPromise = firstValueFrom(client.summarize({ text: 'Source text' }).pipe(toArray()));
    const request = http.expectOne('/api/ai/summarize/stream');
    const firstPartial = chunkFrame.slice(0, 10);
    const completeChunk = `${chunkFrame}\n`;
    const completeResponse = `${completeChunk}${completeFrame}\n`;

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ text: 'Source text' });
    expect(request.request.reportProgress).toBe(true);
    expect(request.request.responseType).toBe('text');
    expect(request.request.timeout).toBe(1_000);

    request.event({
      loaded: firstPartial.length,
      partialText: firstPartial,
      type: HttpEventType.DownloadProgress,
    });
    request.event({
      loaded: completeChunk.length,
      partialText: completeChunk,
      type: HttpEventType.DownloadProgress,
    });
    request.flush(completeResponse);

    await expect(resultPromise).resolves.toEqual([
      { delta: 'Short ', type: 'chunk' },
      {
        output: { summary: 'Short summary.' },
        requestId: 'request-1',
        type: 'complete',
      },
    ]);
  });

  it('maps an error frame to the Observable error channel', async () => {
    const events: unknown[] = [];
    const resultPromise = new Promise<unknown>((resolve) => {
      client.summarize({ text: 'Source text' }).subscribe({
        complete: () => resolve(undefined),
        error: resolve,
        next: (event) => events.push(event),
      });
    });
    const request = http.expectOne('/api/ai/summarize/stream');
    const errorFrame = JSON.stringify({
      error: {
        code: 'AI_RATE_LIMITED',
        message: 'Try again later.',
        requestId: 'request-429',
        retryable: true,
      },
      type: 'error',
    });
    const partialResponse = `${chunkFrame}\n`;

    request.event({
      loaded: partialResponse.length,
      partialText: partialResponse,
      type: HttpEventType.DownloadProgress,
    });
    request.flush(`${partialResponse}${errorFrame}\n`);

    await expect(resultPromise).resolves.toMatchObject({
      code: 'AI_RATE_LIMITED',
      requestId: 'request-429',
      retryable: true,
    });
    expect(events).toEqual([{ delta: 'Short ', type: 'chunk' }]);
  });

  it('preserves a typed 429 returned before streaming starts', async () => {
    const resultPromise = firstValueFrom(client.summarize({ text: 'Source text' }));
    const request = http.expectOne('/api/ai/summarize/stream');

    request.flush(
      JSON.stringify({
        code: 'AI_RATE_LIMITED',
        message: 'The AI provider rate limit was reached. Try again later.',
        requestId: 'request-before-stream',
        retryable: true,
      }),
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        status: 429,
        statusText: 'Too Many Requests',
      },
    );

    await expect(resultPromise).rejects.toMatchObject({
      code: 'AI_RATE_LIMITED',
      httpStatus: 429,
      requestId: 'request-before-stream',
      retryable: true,
    });
  });

  it('rejects an invalid or incomplete stream with a safe protocol error', async () => {
    const resultPromise = firstValueFrom(client.summarize({ text: 'Source text' }));
    const request = http.expectOne('/api/ai/summarize/stream');

    request.flush('sensitive invalid provider response');

    const error = await resultPromise.catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      code: 'AI_PROVIDER_ERROR',
      message: 'The AI service returned an invalid streaming response.',
      retryable: true,
    });
    expect(JSON.stringify(error)).not.toContain('sensitive invalid provider response');
  });

  it('uses the HTTP backend timeout and maps its TimeoutError', async () => {
    const resultPromise = firstValueFrom(client.summarize({ text: 'Source text' }));
    const request = http.expectOne('/api/ai/summarize/stream');

    expect(request.request.timeout).toBe(1_000);
    request.error(new ProgressEvent('timeout'));

    await expect(resultPromise).rejects.toMatchObject({
      code: 'AI_TIMEOUT',
      retryable: true,
    });
  });

  it('maps the native FetchBackend TimeoutError without treating it as a network failure', () => {
    const error = mapAiClientError(
      new HttpErrorResponse({
        error: new DOMException('signal timed out', 'TimeoutError'),
        status: 0,
      }),
    );

    expect(error).toMatchObject({
      code: 'AI_TIMEOUT',
      retryable: true,
    });
  });

  it('cancels the HTTP request when the consumer unsubscribes', () => {
    const subscription = client.summarize({ text: 'Source text' }).subscribe();
    const request = http.expectOne('/api/ai/summarize/stream');

    subscription.unsubscribe();

    expect(request.cancelled).toBe(true);
  });
});
