import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { AiClientError } from '@features/ai-summary/data-access/ai-client.error';
import {
  AiSummaryFacade,
  type AiSummaryEvent,
  type AiSummaryMode,
} from '@features/ai-summary/data-access/ai-summary.facade';
import { Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AiSummaryComponent } from './ai-summary.component';
import type { AiSummaryInput } from '../../../../../contracts/ai/summary.contract';

describe('AiSummaryComponent', () => {
  let component: AiSummaryComponent;
  let fixture: ComponentFixture<AiSummaryComponent>;
  let summarize: ReturnType<
    typeof vi.fn<(input: AiSummaryInput, mode: AiSummaryMode) => Observable<AiSummaryEvent>>
  >;

  beforeEach(async () => {
    summarize = vi.fn<(input: AiSummaryInput, mode: AiSummaryMode) => Observable<AiSummaryEvent>>();

    await TestBed.configureTestingModule({
      imports: [AiSummaryComponent],
      providers: [
        {
          provide: AiSummaryFacade,
          useValue: { summarize },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the minimal summary form', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Summarize with AI');
    expect(element.textContent).not.toContain('Gemini');
    expect(element.querySelector('textarea')).toBeTruthy();
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Summarize');
    expect(element.querySelector<HTMLInputElement>('input[value="standard"]')?.checked).toBe(true);
  });

  it('uses the standard endpoint mode by default', () => {
    const response = new Subject<AiSummaryEvent>();
    summarize.mockReturnValue(response);
    component.text.setValue('  Source text  ');

    component.summarize();
    response.next({ output: { summary: 'Standard summary' }, type: 'complete' });
    response.complete();
    fixture.detectChanges();

    expect(summarize).toHaveBeenCalledWith({ text: 'Source text' }, 'standard');
    expect(component.state()).toEqual({ status: 'success', summary: 'Standard summary' });
  });

  it('shows progressive chunks and replaces them with the validated final summary', () => {
    const response = new Subject<AiSummaryEvent>();
    summarize.mockReturnValue(response);
    component.selectMode('stream');
    component.text.setValue('  Source text  ');

    component.summarize();
    fixture.detectChanges();

    expect(summarize).toHaveBeenCalledWith({ text: 'Source text' }, 'stream');
    expect(component.state()).toEqual({ status: 'loading', summary: '' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Streaming summary');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.result')?.getAttribute('aria-busy'),
    ).toBe('true');

    response.next({ delta: 'Draft ', type: 'chunk' });
    response.next({ delta: 'summary', type: 'chunk' });
    fixture.detectChanges();

    expect(component.state()).toEqual({ status: 'loading', summary: 'Draft summary' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Draft summary');

    response.next({
      output: { summary: 'Validated final summary' },
      requestId: 'request-1',
      type: 'complete',
    });
    response.complete();
    fixture.detectChanges();

    expect(component.state()).toEqual({
      status: 'success',
      summary: 'Validated final summary',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Validated final summary');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Draft summary');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.result')?.getAttribute('aria-busy'),
    ).toBe('false');
  });

  it('handles the native form submission without navigation', () => {
    const response = new Subject<AiSummaryEvent>();
    summarize.mockReturnValue(response);
    component.text.setValue('Source text');
    fixture.detectChanges();
    const form = (fixture.nativeElement as HTMLElement).querySelector('form');
    const event = new Event('submit', { cancelable: true });

    const submissionAllowed = form?.dispatchEvent(event);

    expect(submissionAllowed).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(summarize).toHaveBeenCalledWith({ text: 'Source text' }, 'standard');
    expect(component.state()).toEqual({ status: 'loading', summary: '' });
  });

  it('renders a typed retryable error and request ID', () => {
    const response = new Subject<AiSummaryEvent>();
    summarize.mockReturnValue(response);
    component.text.setValue('Source text');

    component.summarize();
    response.next({ delta: 'Unvalidated partial summary', type: 'chunk' });
    response.error(
      new AiClientError({
        code: 'AI_RATE_LIMITED',
        httpStatus: 429,
        message: 'Try again later.',
        requestId: 'request-429',
        retryable: true,
      }),
    );
    fixture.detectChanges();

    const content = (fixture.nativeElement as HTMLElement).textContent;
    expect(content).toContain('AI_RATE_LIMITED');
    expect(content).toContain('request-429');
    expect(content).toContain('Try again');
    expect(content).not.toContain('Unvalidated partial summary');
  });

  it('cancels the active request', () => {
    let cancelled = false;
    summarize.mockReturnValue(
      new Observable<AiSummaryEvent>((subscriber) => {
        subscriber.next({ delta: 'Unvalidated partial summary', type: 'chunk' });

        return () => {
          cancelled = true;
        };
      }),
    );
    component.text.setValue('Source text');
    component.summarize();

    component.cancel();
    fixture.detectChanges();

    expect(cancelled).toBe(true);
    expect(component.state()).toEqual({ status: 'cancelled' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Request cancelled');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Unvalidated partial summary',
    );
  });

  it('switches modes only when no request is active and resets the previous result', () => {
    component.state.set({ status: 'success', summary: 'Previous summary' });

    component.selectMode('stream');

    expect(component.mode()).toBe('stream');
    expect(component.state()).toEqual({ status: 'idle' });

    component.state.set({ status: 'loading', summary: '' });
    component.selectMode('standard');

    expect(component.mode()).toBe('stream');
  });

  it('does not submit whitespace-only input', () => {
    component.text.setValue('   ');

    component.summarize();
    fixture.detectChanges();

    expect(summarize).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Enter some text to summarize.',
    );
  });
});
