import { type TailwindComponentDefinition } from '../tailwind.model';

export const tailwindInputDefinition: TailwindComponentDefinition = {
  name: 'input',
  label: 'Input',
  className: 'TailwindInput',
  exportPath: './input/input',
  files: [
    {
      path: '/src/app/shared/components/tailwind/input/input.ts',
      content: `import { booleanAttribute, Component, computed, input, output } from '@angular/core';

type TailwindInputSize = 'sm' | 'md' | 'lg';
type TailwindInputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';

@Component({
  selector: 'app-tailwind-input',
  imports: [],
  templateUrl: './input.html',
  styleUrl: './input.scss',
})
export class TailwindInput {
  readonly id = input<string | null>(null);
  readonly name = input<string | null>(null);
  readonly label = input<string | null>(null);
  readonly type = input<TailwindInputType>('text');
  readonly value = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input<string | null>(null);
  readonly describedBy = input<string | null>(null);
  readonly size = input<TailwindInputSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });

  readonly valueChange = output<string>();

  protected readonly inputClasses = computed(() =>
    [
      'block w-full rounded-md border border-slate-300 bg-white text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
      this.sizeClasses()[this.size()],
    ].join(' '),
  );

  private sizeClasses(): Record<TailwindInputSize, string> {
    return {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-2.5 text-base',
    };
  }

  protected updateValue(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
`,
    },
    {
      path: '/src/app/shared/components/tailwind/input/input.html',
      content: `<div class="space-y-1.5">
  @if (label()) {
    <label
      class="block text-sm font-medium text-slate-700"
      [for]="id()"
      >{{ label() }}</label
    >
  }

  <input
    [attr.aria-describedby]="describedBy()"
    [attr.aria-label]="ariaLabel()"
    [class]="inputClasses()"
    [disabled]="disabled()"
    [id]="id()"
    [name]="name()"
    [placeholder]="placeholder()"
    [readOnly]="readOnly()"
    [type]="type()"
    [value]="value()"
    (input)="updateValue($event)"
  />
</div>
`,
    },
    {
      path: '/src/app/shared/components/tailwind/input/input.scss',
      content: '',
    },
  ],
};
