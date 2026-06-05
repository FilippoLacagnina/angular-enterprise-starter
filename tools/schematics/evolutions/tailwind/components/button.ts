import { type TailwindComponentDefinition } from '../tailwind.model';

export const tailwindButtonDefinition: TailwindComponentDefinition = {
  name: 'button',
  label: 'Button',
  className: 'TailwindButton',
  exportPath: './button/button',
  files: [
    {
      path: '/src/app/shared/components/tailwind/button/button.ts',
      content: `import { booleanAttribute, Component, computed, input } from '@angular/core';

type TailwindButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
type TailwindButtonSize = 'sm' | 'md' | 'lg';
type TailwindButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-tailwind-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class TailwindButton {
  readonly variant = input<TailwindButtonVariant>('primary');
  readonly size = input<TailwindButtonSize>('md');
  readonly type = input<TailwindButtonType>('button');
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly buttonClasses = computed(() =>
    [
      'inline-flex items-center justify-center rounded-md font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
      this.variantClasses()[this.variant()],
      this.sizeClasses()[this.size()],
    ].join(' '),
  );

  private variantClasses(): Record<TailwindButtonVariant, string> {
    return {
      primary: 'bg-sky-600 text-white hover:bg-sky-700 focus-visible:outline-sky-600',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-500',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600',
      warning: 'bg-amber-400 text-slate-950 hover:bg-amber-500 focus-visible:outline-amber-500',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-500',
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
      content: `<button [class]="buttonClasses()" [disabled]="disabled()" [type]="type()">
  <ng-content />
</button>
`,
    },
    {
      path: '/src/app/shared/components/tailwind/button/button.scss',
      content: '',
    },
  ],
};
