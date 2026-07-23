import { type BootstrapComponentDefinition } from '../bootstrap.model';

export const bootstrapBadgeDefinition: BootstrapComponentDefinition = {
  name: 'badge',
  label: 'Badge',
  className: 'BootstrapBadge',
  exportPath: './badge/badge',
  files: [
    {
      path: '/src/app/shared/components/bootstrap/badge/badge.ts',
      content: `import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type BootstrapBadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
  | 'neutral';

@Component({
  selector: 'app-bootstrap-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootstrapBadge {
  readonly variant = input<BootstrapBadgeVariant>('primary');
  readonly pill = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);

  protected readonly badgeClasses = computed(() =>
    ['badge', \`text-bg-\${this.bootstrapVariant()}\`, this.pill() ? 'rounded-pill' : '']
      .filter(Boolean)
      .join(' '),
  );

  private bootstrapVariant(): Exclude<BootstrapBadgeVariant, 'neutral'> {
    const variant = this.variant();

    return variant === 'neutral' ? 'secondary' : variant;
  }
}
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/badge/badge.html',
      content: `<span
  [attr.aria-label]="ariaLabel()"
  [class]="badgeClasses()"
>
  <ng-content />
</span>
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/badge/badge.scss',
      content: '',
    },
  ],
  supplementalFiles: [
    {
      path: '/src/app/shared/components/bootstrap/badge/badge.spec.ts',
      content: `import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { BootstrapBadge } from './badge';

describe('BootstrapBadge', () => {
  let fixture: ComponentFixture<BootstrapBadge>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BootstrapBadge);
    fixture.detectChanges();
  });

  it('renders the primary variant by default', () => {
    expect(getBadge().classList.contains('text-bg-primary')).toBe(true);
  });

  it('maps the neutral variant and exposes accessible labeling', () => {
    fixture.componentRef.setInput('variant', 'neutral');
    fixture.componentRef.setInput('pill', true);
    fixture.componentRef.setInput('ariaLabel', 'Pending items');
    fixture.detectChanges();

    const badge = getBadge();

    expect(badge.classList.contains('text-bg-secondary')).toBe(true);
    expect(badge.classList.contains('rounded-pill')).toBe(true);
    expect(badge.getAttribute('aria-label')).toBe('Pending items');
  });

  function getBadge(): HTMLSpanElement {
    return fixture.nativeElement.querySelector('span') as HTMLSpanElement;
  }
});
`,
    },
  ],
};
