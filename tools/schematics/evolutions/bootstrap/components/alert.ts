import { type BootstrapComponentDefinition } from '../bootstrap.model';

export const bootstrapAlertDefinition: BootstrapComponentDefinition = {
  name: 'alert',
  label: 'Alert',
  className: 'BootstrapAlert',
  exportPath: './alert/alert',
  files: [
    {
      path: '/src/app/shared/components/bootstrap/alert/alert.ts',
      content: `import { booleanAttribute, Component, computed, input, signal } from '@angular/core';

type BootstrapAlertVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';

@Component({
  selector: 'app-bootstrap-alert',
  imports: [],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
})
export class BootstrapAlert {
  readonly variant = input<BootstrapAlertVariant>('primary');
  readonly dismissible = input(false, { transform: booleanAttribute });

  protected readonly dismissed = signal(false);

  protected readonly alertClasses = computed(() =>
    [
      'alert',
      \`alert-\${this.variant()}\`,
      this.dismissible() ? 'alert-dismissible fade show' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  protected dismiss(): void {
    this.dismissed.set(true);
  }
}
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/alert/alert.html',
      content: `@if (!dismissed()) {
  <div [class]="alertClasses()" role="alert">
    <ng-content />

    @if (dismissible()) {
      <button
        aria-label="Close"
        class="btn-close"
        type="button"
        (click)="dismiss()"
      ></button>
    }
  </div>
}
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/alert/alert.scss',
      content: '',
    },
  ],
};
