import { type BootstrapComponentDefinition } from '../bootstrap.model';

export const bootstrapInputDefinition: BootstrapComponentDefinition = {
  name: 'input',
  label: 'Input',
  className: 'BootstrapInput',
  exportPath: './input/input',
  files: [
    {
      path: '/src/app/shared/components/bootstrap/input/input.ts',
      content: `import { booleanAttribute, Component, computed, input, output } from '@angular/core';

type BootstrapInputSize = 'sm' | 'md' | 'lg';
type BootstrapInputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';

@Component({
  selector: 'app-bootstrap-input',
  imports: [],
  templateUrl: './input.html',
  styleUrl: './input.scss',
})
export class BootstrapInput {
  readonly id = input<string | null>(null);
  readonly name = input<string | null>(null);
  readonly label = input<string | null>(null);
  readonly type = input<BootstrapInputType>('text');
  readonly value = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input<string | null>(null);
  readonly describedBy = input<string | null>(null);
  readonly size = input<BootstrapInputSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });

  readonly valueChange = output<string>();

  protected readonly inputClasses = computed(() =>
    ['form-control', this.size() === 'md' ? '' : \`form-control-\${this.size()}\`]
      .filter(Boolean)
      .join(' '),
  );

  protected updateValue(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/input/input.html',
      content: `<div>
  @if (label()) {
    <label class="form-label" [for]="id()">{{ label() }}</label>
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
      path: '/src/app/shared/components/bootstrap/input/input.scss',
      content: '',
    },
  ],
};
