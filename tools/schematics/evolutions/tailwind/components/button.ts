import { type TailwindComponentDefinition } from '../tailwind.model';

export const tailwindButtonDefinition: TailwindComponentDefinition = {
  name: 'button',
  label: 'Button',
  className: 'TailwindButton',
  exportPath: './button/button',
  files: [
    {
      path: '/src/app/shared/components/tailwind/button/button.ts',
      content: `import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type TailwindButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
  | 'link'
  | 'ghost';

export type TailwindButtonSize = 'sm' | 'md' | 'lg';
export type TailwindButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-tailwind-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TailwindButton {
  readonly variant = input<TailwindButtonVariant>('primary');
  readonly outline = input(false, { transform: booleanAttribute });
  readonly size = input<TailwindButtonSize>('md');
  readonly type = input<TailwindButtonType>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected readonly buttonClasses = computed(() =>
    [
      'inline-flex items-center justify-center rounded-md font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
      this.outline()
        ? this.outlineVariantClasses()[this.variant()]
        : this.variantClasses()[this.variant()],
      this.sizeClasses()[this.size()],
      this.fullWidth() ? 'w-full' : '',
    ].join(' '),
  );

  private variantClasses(): Record<TailwindButtonVariant, string> {
    return {
      primary: 'bg-sky-600 text-white hover:bg-sky-700 focus-visible:outline-sky-600',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-500',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600',
      warning: 'bg-amber-400 text-slate-950 hover:bg-amber-500 focus-visible:outline-amber-500',
      info: 'bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:outline-cyan-600',
      light:
        'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 focus-visible:outline-slate-400',
      dark: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-700',
      link: 'bg-transparent text-sky-700 shadow-none underline-offset-4 hover:underline focus-visible:outline-sky-600',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-500',
    };
  }

  private outlineVariantClasses(): Record<TailwindButtonVariant, string> {
    return {
      primary:
        'border border-sky-600 bg-transparent text-sky-700 hover:bg-sky-50 focus-visible:outline-sky-600',
      secondary:
        'border border-slate-400 bg-transparent text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-500',
      success:
        'border border-emerald-600 bg-transparent text-emerald-700 hover:bg-emerald-50 focus-visible:outline-emerald-600',
      danger:
        'border border-rose-600 bg-transparent text-rose-700 hover:bg-rose-50 focus-visible:outline-rose-600',
      warning:
        'border border-amber-500 bg-transparent text-amber-800 hover:bg-amber-50 focus-visible:outline-amber-500',
      info: 'border border-cyan-600 bg-transparent text-cyan-700 hover:bg-cyan-50 focus-visible:outline-cyan-600',
      light:
        'border border-slate-300 bg-transparent text-slate-600 hover:bg-slate-50 focus-visible:outline-slate-400',
      dark: 'border border-slate-900 bg-transparent text-slate-900 hover:bg-slate-100 focus-visible:outline-slate-700',
      link: 'bg-transparent text-sky-700 shadow-none underline-offset-4 hover:underline focus-visible:outline-sky-600',
      ghost:
        'bg-transparent text-slate-700 shadow-none hover:bg-slate-100 focus-visible:outline-slate-500',
    };
  }

  private sizeClasses(): Record<TailwindButtonSize, string> {
    return {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    };
  }
}
`,
    },
    {
      path: '/src/app/shared/components/tailwind/button/button.html',
      content: `<button
  [attr.aria-busy]="loading() ? 'true' : null"
  [attr.aria-label]="ariaLabel()"
  [class]="buttonClasses()"
  [disabled]="isDisabled()"
  [type]="type()"
>
  @if (loading()) {
    <span
      aria-hidden="true"
      class="size-4 animate-spin rounded-full border-2 border-current border-e-transparent"
    ></span>
  }

  <ng-content />
</button>
`,
    },
    {
      path: '/src/app/shared/components/tailwind/button/button.scss',
      content: '',
    },
  ],
  supplementalFiles: [
    {
      path: '/src/app/shared/components/tailwind/button/button.spec.ts',
      content: `import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { TailwindButton } from './button';

describe('TailwindButton', () => {
  let fixture: ComponentFixture<TailwindButton>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TailwindButton);
    fixture.detectChanges();
  });

  it('renders an enabled primary button by default', () => {
    const button = getButton();

    expect(button.classList.contains('bg-sky-600')).toBe(true);
    expect(button.disabled).toBe(false);
    expect(button.type).toBe('button');
  });

  it('applies size, outline and full-width options', () => {
    fixture.componentRef.setInput('variant', 'success');
    fixture.componentRef.setInput('outline', true);
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('fullWidth', true);
    fixture.detectChanges();

    const button = getButton();

    expect(button.classList.contains('border-emerald-600')).toBe(true);
    expect(button.classList.contains('text-base')).toBe(true);
    expect(button.classList.contains('w-full')).toBe(true);
  });

  it('disables the button and exposes busy state while loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const button = getButton();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.animate-spin')).not.toBeNull();
  });

  function getButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }
});
`,
    },
  ],
};
