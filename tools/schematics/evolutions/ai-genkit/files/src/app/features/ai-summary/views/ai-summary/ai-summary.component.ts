import { ChangeDetectionStrategy, Component, inject, type OnDestroy, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AiClientError,
  type AiClientErrorCode,
} from '@features/ai-summary/data-access/ai-client.error';
import {
  AiSummaryFacade,
  type AiSummaryEvent,
  type AiSummaryMode,
} from '@features/ai-summary/data-access/ai-summary.facade';
import type { Subscription } from 'rxjs';

const MAX_SUMMARY_INPUT_LENGTH = 20_000;

interface AiSummaryViewError {
  code: AiClientErrorCode;
  message: string;
  requestId?: string;
  retryable: boolean;
}

type AiSummaryViewState =
  | { status: 'cancelled' }
  | { error: AiSummaryViewError; status: 'error' }
  | { status: 'idle' }
  | { status: 'loading'; summary: string }
  | { status: 'success'; summary: string };

function toViewError(error: unknown): AiSummaryViewError {
  if (error instanceof AiClientError) {
    return {
      code: error.code,
      message: error.message,
      requestId: error.requestId,
      retryable: error.retryable,
    };
  }

  return {
    code: 'AI_PROVIDER_ERROR',
    message: 'The AI service could not complete the request.',
    retryable: false,
  };
}

@Component({
  selector: 'app-ai-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './ai-summary.component.html',
  styleUrl: './ai-summary.component.scss',
})
export class AiSummaryComponent implements OnDestroy {
  private readonly facade = inject(AiSummaryFacade);
  private activeRequest?: Subscription;

  readonly maxInputLength = MAX_SUMMARY_INPUT_LENGTH;
  readonly mode = signal<AiSummaryMode>('standard');
  readonly state = signal<AiSummaryViewState>({ status: 'idle' });
  readonly text = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(MAX_SUMMARY_INPUT_LENGTH)],
  });

  get inputError(): string | undefined {
    if (!this.text.touched) {
      return undefined;
    }

    if (!this.text.value.trim()) {
      return 'Enter some text to summarize.';
    }

    if (this.text.hasError('maxlength')) {
      return `Text must not exceed ${MAX_SUMMARY_INPUT_LENGTH.toLocaleString()} characters.`;
    }

    return undefined;
  }

  submitForm(event: Event): void {
    event.preventDefault();
    this.summarize();
  }

  summarize(): void {
    this.text.markAsTouched();
    const text = this.text.value.trim();

    if (!text || this.text.invalid || this.state().status === 'loading') {
      return;
    }

    this.state.set({ status: 'loading', summary: '' });
    const request = this.facade.summarize({ text }, this.mode()).subscribe({
      complete: () => {
        this.activeRequest = undefined;
      },
      error: (error: unknown) => {
        this.activeRequest = undefined;
        this.state.set({
          error: toViewError(error),
          status: 'error',
        });
      },
      next: (event) => this.handleStreamEvent(event),
    });
    this.activeRequest = request.closed ? undefined : request;
  }

  cancel(): void {
    if (this.state().status !== 'loading') {
      return;
    }

    this.activeRequest?.unsubscribe();
    this.activeRequest = undefined;
    this.state.set({ status: 'cancelled' });
  }

  selectMode(mode: AiSummaryMode): void {
    if (this.state().status === 'loading' || this.mode() === mode) {
      return;
    }

    this.mode.set(mode);
    this.state.set({ status: 'idle' });
  }

  ngOnDestroy(): void {
    this.activeRequest?.unsubscribe();
    this.activeRequest = undefined;
  }

  private handleStreamEvent(event: AiSummaryEvent): void {
    if (event.type === 'complete') {
      this.state.set({
        status: 'success',
        summary: event.output.summary,
      });
      return;
    }

    this.state.update((currentState) =>
      currentState.status === 'loading'
        ? {
            status: 'loading',
            summary: `${currentState.summary}${event.delta}`,
          }
        : currentState,
    );
  }
}
