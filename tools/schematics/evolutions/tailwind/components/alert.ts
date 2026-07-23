import { type TailwindComponentDefinition } from '../tailwind.model';

export const tailwindAlertDefinition: TailwindComponentDefinition = {
  name: 'alert',
  label: 'Alert',
  className: 'TailwindAlert',
  exportPath: './alert/alert',
  files: [
    {
      path: '/src/app/shared/components/tailwind/alert/alert.ts',
      content: `import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';

export type TailwindAlertVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
  | 'neutral';

export type TailwindAlertRole = 'alert' | 'status';

@Component({
  selector: 'app-tailwind-alert',
  imports: [],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TailwindAlert {
  readonly variant = input<TailwindAlertVariant>('info');
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input('Close');
  readonly role = input<TailwindAlertRole>('alert');
  readonly open = model(true);

  readonly dismissed = output<void>();

  protected readonly alertClasses = computed(() =>
    ['rounded-lg border px-4 py-3 text-sm shadow-sm', this.variantClasses()[this.variant()]].join(
      ' ',
    ),
  );

  private variantClasses(): Record<TailwindAlertVariant, string> {
    return {
      primary: 'border-sky-200 bg-sky-50 text-sky-900',
      secondary: 'border-slate-300 bg-slate-100 text-slate-900',
      info: 'border-sky-200 bg-sky-50 text-sky-900',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      warning: 'border-amber-200 bg-amber-50 text-amber-950',
      danger: 'border-rose-200 bg-rose-50 text-rose-900',
      light: 'border-slate-200 bg-white text-slate-800',
      dark: 'border-slate-800 bg-slate-900 text-white',
      neutral: 'border-slate-200 bg-slate-50 text-slate-900',
    };
  }

  protected dismiss(): void {
    this.open.set(false);
    this.dismissed.emit();
  }
}
`,
    },
    {
      path: '/src/app/shared/components/tailwind/alert/alert.html',
      content: `@if (open()) {
  <div
    [attr.role]="role()"
    [class]="alertClasses()"
  >
    <div class="flex items-start gap-3">
      <div class="min-w-0 flex-1">
        <ng-content />
      </div>

      @if (dismissible()) {
        <button
          [attr.aria-label]="dismissLabel()"
          class="rounded text-current opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current/30"
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
  supplementalFiles: [
    {
      path: '/src/app/shared/components/tailwind/alert/alert.spec.ts',
      content: `import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { TailwindAlert } from './alert';

describe('TailwindAlert', () => {
  let fixture: ComponentFixture<TailwindAlert>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TailwindAlert);
    fixture.detectChanges();
  });

  it('renders an informational alert by default', () => {
    const alert = getAlert();

    expect(alert?.classList.contains('bg-sky-50')).toBe(true);
    expect(alert?.getAttribute('role')).toBe('alert');
  });

  it('supports a status role and an accessible dismiss action', () => {
    let dismissed = false;
    fixture.componentInstance.dismissed.subscribe(() => (dismissed = true));
    fixture.componentRef.setInput('dismissible', true);
    fixture.componentRef.setInput('dismissLabel', 'Dismiss notification');
    fixture.componentRef.setInput('role', 'status');
    fixture.detectChanges();

    const dismissButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(getAlert()?.getAttribute('role')).toBe('status');
    expect(dismissButton.getAttribute('aria-label')).toBe('Dismiss notification');

    dismissButton.click();
    fixture.detectChanges();

    expect(dismissed).toBe(true);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(getAlert()).toBeNull();
  });

  function getAlert(): HTMLDivElement | null {
    return fixture.nativeElement.querySelector('[role]') as HTMLDivElement | null;
  }
});
`,
    },
  ],
};
