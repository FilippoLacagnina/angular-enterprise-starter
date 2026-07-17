import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError, timeout } from 'rxjs';

import { AI_CLIENT_CONFIG } from './ai-client.config';
import { AiClientError, mapAiClientError } from './ai-client.error';
import type { AiSummaryInput, AiSummaryOutput } from '../../../../contracts/ai/summary.contract';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validateSummaryOutput(value: unknown): AiSummaryOutput {
  if (isRecord(value) && typeof value['summary'] === 'string') {
    return { summary: value['summary'] };
  }

  throw new AiClientError({
    code: 'AI_PROVIDER_ERROR',
    message: 'The AI service returned an invalid response.',
    retryable: true,
  });
}

@Injectable({ providedIn: 'root' })
export class AiSummaryClient {
  private readonly config = inject(AI_CLIENT_CONFIG);
  private readonly http = inject(HttpClient);

  summarize(input: AiSummaryInput): Observable<AiSummaryOutput> {
    const basePath = this.config.basePath.replace(/\/+$/, '');

    return this.http.post<unknown>(`${basePath}/summarize`, input).pipe(
      timeout({ first: this.config.timeoutMs }),
      map(validateSummaryOutput),
      catchError((error: unknown) => throwError(() => mapAiClientError(error))),
    );
  }
}
