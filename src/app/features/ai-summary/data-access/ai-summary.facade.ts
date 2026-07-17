import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { AiSummaryStreamClient } from './ai-summary-stream.client';
import { AiSummaryClient } from './ai-summary.client';
import type {
  AiSummaryInput,
  AiSummaryOutput,
  AiSummaryStreamChunkEvent,
} from '../../../../contracts/ai/summary.contract';

export type AiSummaryMode = 'standard' | 'stream';

export type AiSummaryEvent =
  | AiSummaryStreamChunkEvent
  | { output: AiSummaryOutput; requestId?: string; type: 'complete' };

@Injectable({ providedIn: 'root' })
export class AiSummaryFacade {
  private readonly standardClient = inject(AiSummaryClient);
  private readonly streamClient = inject(AiSummaryStreamClient);

  summarize(input: AiSummaryInput, mode: AiSummaryMode): Observable<AiSummaryEvent> {
    if (mode === 'stream') {
      return this.streamClient.summarize(input);
    }

    return this.standardClient.summarize(input).pipe(
      map((output) => ({
        output,
        type: 'complete' as const,
      })),
    );
  }
}
