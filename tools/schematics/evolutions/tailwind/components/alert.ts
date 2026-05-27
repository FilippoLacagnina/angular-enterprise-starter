import { type TailwindComponentDefinition } from '../tailwind.model';

export const tailwindAlertDefinition: TailwindComponentDefinition = {
  name: 'alert',
  label: 'Alert',
  className: 'TailwindAlert',
  exportPath: './alert/alert',
  files: [
    {
      path: '/src/app/shared/components/tailwind/alert/alert.ts',
      content: `import { booleanAttribute, Component, computed, input, signal } from '@angular/core';

type TailwindAlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-tailwind-alert',
  imports: [],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
})
export class TailwindAlert {
  readonly variant = input<TailwindAlertVariant>('info');
  readonly dismissible = input(false, { transform: booleanAttribute });

  protected readonly dismissed = signal(false);

  protected readonly alertClasses = computed(() =>
    [
      'rounded-lg border px-4 py-3 text-sm shadow-sm',
      this.variantClasses()[this.variant()],
    ].join(' '),
  );

  private variantClasses(): Record<TailwindAlertVariant, string> {
    return {
      info: 'border-sky-200 bg-sky-50 text-sky-900',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      warning: 'border-amber-200 bg-amber-50 text-amber-950',
      danger: 'border-rose-200 bg-rose-50 text-rose-900',
      neutral: 'border-slate-200 bg-slate-50 text-slate-900',
    };
  }

  protected dismiss(): void {
    this.dismissed.set(true);
  }
}
`,
    },
    {
      path: '/src/app/shared/components/tailwind/alert/alert.html',
      content: `@if (!dismissed()) {
  <div [class]="alertClasses()" role="alert">
    <div class="flex items-start gap-3">
      <div class="min-w-0 flex-1">
        <ng-content />
      </div>

      @if (dismissible()) {
        <button
          class="rounded text-current opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current/30"
          aria-label="Close"
          type="button"
          (click)="dismiss()"
        >
          ×
        </button>
      }
    </div>
  </div>
}
`,
    },
    {
      path: '/src/app/shared/components/tailwind/alert/alert.scss',
      content: '',
    },
  ],
};
