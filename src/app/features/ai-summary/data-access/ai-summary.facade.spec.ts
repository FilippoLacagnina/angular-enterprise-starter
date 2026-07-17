import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, toArray } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AiSummaryStreamClient } from './ai-summary-stream.client';
import { AiSummaryClient } from './ai-summary.client';
import { AiSummaryFacade } from './ai-summary.facade';

describe('AiSummaryFacade', () => {
  const standardSummarize = vi.fn();
  const streamSummarize = vi.fn();
  let facade: AiSummaryFacade;

  beforeEach(() => {
    standardSummarize.mockReset();
    streamSummarize.mockReset();

    TestBed.configureTestingModule({
      providers: [
        AiSummaryFacade,
        { provide: AiSummaryClient, useValue: { summarize: standardSummarize } },
        { provide: AiSummaryStreamClient, useValue: { summarize: streamSummarize } },
      ],
    });

    facade = TestBed.inject(AiSummaryFacade);
  });

  it('uses the standard client and normalizes its output as a complete event', async () => {
    standardSummarize.mockReturnValue(of({ summary: 'Standard summary.' }));

    const result = await firstValueFrom(facade.summarize({ text: 'Source text' }, 'standard'));

    expect(result).toEqual({
      output: { summary: 'Standard summary.' },
      type: 'complete',
    });
    expect(standardSummarize).toHaveBeenCalledWith({ text: 'Source text' });
    expect(streamSummarize).not.toHaveBeenCalled();
  });

  it('uses the streaming client without discarding progressive events', async () => {
    streamSummarize.mockReturnValue(
      of(
        { delta: 'Streaming ', type: 'chunk' },
        {
          output: { summary: 'Streaming summary.' },
          requestId: 'request-1',
          type: 'complete',
        },
      ),
    );

    const result = await firstValueFrom(
      facade.summarize({ text: 'Source text' }, 'stream').pipe(toArray()),
    );

    expect(result).toEqual([
      { delta: 'Streaming ', type: 'chunk' },
      {
        output: { summary: 'Streaming summary.' },
        requestId: 'request-1',
        type: 'complete',
      },
    ]);
    expect(streamSummarize).toHaveBeenCalledWith({ text: 'Source text' });
    expect(standardSummarize).not.toHaveBeenCalled();
  });
});
