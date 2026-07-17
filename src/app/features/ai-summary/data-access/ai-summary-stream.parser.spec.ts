import { describe, expect, it } from 'vitest';

import { AiStreamProtocolError, AiSummaryNdjsonParser } from './ai-summary-stream.parser';

const chunkFrame = JSON.stringify({ delta: 'Angular ', type: 'chunk' });
const completeFrame = JSON.stringify({
  output: { summary: 'Angular summary.' },
  requestId: 'request-1',
  type: 'complete',
});

describe('AiSummaryNdjsonParser', () => {
  it('parses fragmented frames from cumulative download text', () => {
    const parser = new AiSummaryNdjsonParser();
    const firstPartial = chunkFrame.slice(0, 12);
    const completeChunk = `${chunkFrame}\n`;

    expect(parser.pushCumulativeText(firstPartial)).toEqual([]);
    expect(parser.pushCumulativeText(completeChunk)).toEqual([
      { delta: 'Angular ', type: 'chunk' },
    ]);
    expect(parser.pushCumulativeText(`${completeChunk}${completeFrame}\n`)).toEqual([
      {
        output: { summary: 'Angular summary.' },
        requestId: 'request-1',
        type: 'complete',
      },
    ]);
    expect(parser.finish()).toEqual([]);
  });

  it('parses a final frame without a trailing newline', () => {
    const parser = new AiSummaryNdjsonParser();

    expect(parser.finish(completeFrame)).toEqual([
      {
        output: { summary: 'Angular summary.' },
        requestId: 'request-1',
        type: 'complete',
      },
    ]);
  });

  it('accepts a typed error as a terminal event', () => {
    const parser = new AiSummaryNdjsonParser();
    const errorFrame = JSON.stringify({
      error: {
        code: 'AI_RATE_LIMITED',
        message: 'Try again later.',
        requestId: 'request-429',
        retryable: true,
      },
      type: 'error',
    });

    expect(parser.finish(errorFrame)).toEqual([
      {
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'Try again later.',
          requestId: 'request-429',
          retryable: true,
        },
        type: 'error',
      },
    ]);
  });

  it.each([
    'not-json\n',
    `${JSON.stringify({ delta: 42, type: 'chunk' })}\n`,
    `${JSON.stringify({ output: { summary: 42 }, requestId: 'request-1', type: 'complete' })}\n`,
    `${JSON.stringify({ error: { code: 'UNKNOWN' }, type: 'error' })}\n`,
  ])('rejects an invalid frame without exposing its contents', (responseText) => {
    const parser = new AiSummaryNdjsonParser();

    expect(() => parser.pushCumulativeText(responseText)).toThrowError(new AiStreamProtocolError());
  });

  it('rejects non-cumulative progress text', () => {
    const parser = new AiSummaryNdjsonParser();

    parser.pushCumulativeText(chunkFrame.slice(0, 12));

    expect(() => parser.pushCumulativeText('different text')).toThrow(AiStreamProtocolError);
  });

  it('rejects data received after a terminal event', () => {
    const parser = new AiSummaryNdjsonParser();
    parser.pushCumulativeText(`${completeFrame}\n`);

    expect(() => parser.pushCumulativeText(`${completeFrame}\n${chunkFrame}\n`)).toThrow(
      AiStreamProtocolError,
    );
  });

  it('rejects a stream that ends without a terminal event', () => {
    const parser = new AiSummaryNdjsonParser();
    parser.pushCumulativeText(`${chunkFrame}\n`);

    expect(() => parser.finish()).toThrow(AiStreamProtocolError);
  });

  it('rejects a frame larger than the configured safety limit', () => {
    const parser = new AiSummaryNdjsonParser(10);

    expect(() => parser.pushCumulativeText(chunkFrame)).toThrow(AiStreamProtocolError);
  });
});
