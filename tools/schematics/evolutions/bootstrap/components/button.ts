import { type BootstrapComponentDefinition } from '../bootstrap.model';

export const bootstrapButtonDefinition: BootstrapComponentDefinition = {
  name: 'button',
  label: 'Button',
  className: 'BootstrapButton',
  exportPath: './button/button',
  files: [
    {
      path: '/src/app/shared/components/bootstrap/button/button.ts',
      content: `import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type BootstrapButtonVariant =
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

export type BootstrapButtonSize = 'sm' | 'md' | 'lg';
export type BootstrapButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-bootstrap-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootstrapButton {
  readonly variant = input<BootstrapButtonVariant>('primary');
  readonly outline = input(false, { transform: booleanAttribute });
  readonly size = input<BootstrapButtonSize>('md');
  readonly type = input<BootstrapButtonType>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected readonly buttonClasses = computed(() =>
    [
      'btn d-inline-flex align-items-center justify-content-center gap-2',
      this.variantClass(),
      this.size() === 'md' ? '' : \`btn-\${this.size()}\`,
      this.fullWidth() ? 'w-100' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  private variantClass(): string {
    if (this.variant() === 'ghost') {
      return 'btn-outline-secondary border-0';
    }

    if (this.variant() === 'link') {
      return 'btn-link';
    }

    return this.outline() ? \`btn-outline-\${this.variant()}\` : \`btn-\${this.variant()}\`;
  }
}
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/button/button.html',
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
      class="spinner-border spinner-border-sm"
    ></span>
  }

  <ng-content />
</button>
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/button/button.scss',
      content: '',
    },
  ],
  supplementalFiles: [
    {
      path: '/src/app/shared/components/bootstrap/button/button.spec.ts',
      content: `import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { BootstrapButton } from './button';

describe('BootstrapButton', () => {
  let fixture: ComponentFixture<BootstrapButton>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BootstrapButton);
    fixture.detectChanges();
  });

  it('renders an enabled primary button by default', () => {
    const button = getButton();

    expect(button.classList.contains('btn-primary')).toBe(true);
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

    expect(button.classList.contains('btn-outline-success')).toBe(true);
    expect(button.classList.contains('btn-lg')).toBe(true);
    expect(button.classList.contains('w-100')).toBe(true);
  });

  it('disables the button and exposes busy state while loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const button = getButton();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.spinner-border')).not.toBeNull();
  });

  function getButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }
});
`,
    },
  ],
};
