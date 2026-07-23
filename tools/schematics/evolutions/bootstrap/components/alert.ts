import { type BootstrapComponentDefinition } from '../bootstrap.model';

export const bootstrapAlertDefinition: BootstrapComponentDefinition = {
  name: 'alert',
  label: 'Alert',
  className: 'BootstrapAlert',
  exportPath: './alert/alert',
  files: [
    {
      path: '/src/app/shared/components/bootstrap/alert/alert.ts',
      content: `import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';

export type BootstrapAlertVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
  | 'neutral';

export type BootstrapAlertRole = 'alert' | 'status';

@Component({
  selector: 'app-bootstrap-alert',
  imports: [],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootstrapAlert {
  readonly variant = input<BootstrapAlertVariant>('info');
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input('Close');
  readonly role = input<BootstrapAlertRole>('alert');
  readonly open = model(true);

  readonly dismissed = output<void>();

  protected readonly alertClasses = computed(() =>
    [
      'alert',
      \`alert-\${this.bootstrapVariant()}\`,
      this.dismissible() ? 'alert-dismissible fade show' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  private bootstrapVariant(): Exclude<BootstrapAlertVariant, 'neutral'> {
    const variant = this.variant();

    return variant === 'neutral' ? 'secondary' : variant;
  }

  protected dismiss(): void {
    this.open.set(false);
    this.dismissed.emit();
  }
}
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/alert/alert.html',
      content: `@if (open()) {
  <div
    [attr.role]="role()"
    [class]="alertClasses()"
  >
    <ng-content />

    @if (dismissible()) {
      <button
        [attr.aria-label]="dismissLabel()"
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
  supplementalFiles: [
    {
      path: '/src/app/shared/components/bootstrap/alert/alert.spec.ts',
      content: `import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { BootstrapAlert } from './alert';

describe('BootstrapAlert', () => {
  let fixture: ComponentFixture<BootstrapAlert>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BootstrapAlert);
    fixture.detectChanges();
  });

  it('renders an informational alert by default', () => {
    const alert = getAlert();

    expect(alert?.classList.contains('alert-info')).toBe(true);
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
