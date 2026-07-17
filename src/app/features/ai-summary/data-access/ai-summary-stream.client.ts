import { HttpClient, HttpEventType, type HttpEvent } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, concatMap, defer, from, map, type Observable, throwError } from 'rxjs';

import { AI_CLIENT_CONFIG } from './ai-client.config';
import { AiClientError, mapAiApiErrorToClientError, mapAiClientError } from './ai-client.error';
import { AiStreamProtocolError, AiSummaryNdjsonParser } from './ai-summary-stream.parser';
import type {
  AiSummaryInput,
  AiSummaryStreamErrorEvent,
  AiSummaryStreamEvent,
} from '../../../../contracts/ai/summary.contract';

export type AiSummaryStreamClientEvent = Exclude<AiSummaryStreamEvent, AiSummaryStreamErrorEvent>;

function parseHttpEvent(
  parser: AiSummaryNdjsonParser,
  event: HttpEvent<string>,
): AiSummaryStreamEvent[] {
  if (event.type === HttpEventType.DownloadProgress) {
    return event.partialText === undefined ? [] : parser.pushCumulativeText(event.partialText);
  }

  if (event.type === HttpEventType.Response) {
    return parser.finish(event.body ?? undefined);
  }

  return [];
}

function toClientEvent(event: AiSummaryStreamEvent): AiSummaryStreamClientEvent {
  if (event.type === 'error') {
    throw mapAiApiErrorToClientError(event.error);
  }

  return event;
}

function mapStreamingClientError(error: unknown): AiClientError {
  if (error instanceof AiStreamProtocolError) {
    return new AiClientError({
      code: 'AI_PROVIDER_ERROR',
      message: error.message,
      retryable: true,
    });
  }

  return mapAiClientError(error);
}

@Injectable({ providedIn: 'root' })
export class AiSummaryStreamClient {
  private readonly config = inject(AI_CLIENT_CONFIG);
  private readonly http = inject(HttpClient);

  summarize(input: AiSummaryInput): Observable<AiSummaryStreamClientEvent> {
    const basePath = this.config.basePath.replace(/\/+$/, '');

    return defer(() => {
      const parser = new AiSummaryNdjsonParser();

      return this.http
        .post(`${basePath}/summarize/stream`, input, {
          observe: 'events',
          reportProgress: true,
          responseType: 'text',
          timeout: this.config.timeoutMs,
        })
        .pipe(
          concatMap((event) => from(parseHttpEvent(parser, event))),
          map(toClientEvent),
          catchError((error: unknown) => throwError(() => mapStreamingClientError(error))),
        );
    });
  }
}
