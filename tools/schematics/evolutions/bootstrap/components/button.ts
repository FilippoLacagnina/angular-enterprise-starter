import { type BootstrapComponentDefinition } from '../bootstrap.model';

export const bootstrapButtonDefinition: BootstrapComponentDefinition = {
  name: 'button',
  label: 'Button',
  className: 'BootstrapButton',
  exportPath: './button/button',
  files: [
    {
      path: '/src/app/shared/components/bootstrap/button/button.ts',
      content: `import { booleanAttribute, Component, computed, input } from '@angular/core';

type BootstrapButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
  | 'link';

type BootstrapButtonSize = 'sm' | 'md' | 'lg';
type BootstrapButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-bootstrap-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class BootstrapButton {
  readonly variant = input<BootstrapButtonVariant>('primary');
  readonly outline = input(false, { transform: booleanAttribute });
  readonly size = input<BootstrapButtonSize>('md');
  readonly type = input<BootstrapButtonType>('button');
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly buttonClasses = computed(() =>
    [
      'btn',
      this.outline() ? \`btn-outline-\${this.variant()}\` : \`btn-\${this.variant()}\`,
      this.size() === 'md' ? '' : \`btn-\${this.size()}\`,
    ]
      .filter(Boolean)
      .join(' '),
  );
}
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/button/button.html',
      content: `<button
  [class]="buttonClasses()"
  [disabled]="disabled()"
  [type]="type()"
>
  <ng-content />
</button>
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/button/button.scss',
      content: '',
    },
  ],
};
