import { type TailwindComponentDefinition } from '../tailwind.model';

export const tailwindBadgeDefinition: TailwindComponentDefinition = {
  name: 'badge',
  label: 'Badge',
  className: 'TailwindBadge',
  exportPath: './badge/badge',
  files: [
    {
      path: '/src/app/shared/components/tailwind/badge/badge.ts',
      content: `import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type TailwindBadgeVariant =
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
  selector: 'app-tailwind-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TailwindBadge {
  readonly variant = input<TailwindBadgeVariant>('primary');
  readonly pill = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);

  protected readonly badgeClasses = computed(() =>
    [
      'inline-flex items-center px-2 py-1 text-xs font-medium ring-1 ring-inset',
      this.pill() ? 'rounded-full' : 'rounded-md',
      this.variantClasses()[this.variant()],
    ].join(' '),
  );

  private variantClasses(): Record<TailwindBadgeVariant, string> {
    return {
      primary: 'bg-sky-50 text-sky-700 ring-sky-700/10',
      secondary: 'bg-slate-50 text-slate-700 ring-slate-700/10',
      success: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10',
      danger: 'bg-rose-50 text-rose-700 ring-rose-700/10',
      warning: 'bg-amber-50 text-amber-800 ring-amber-700/10',
      info: 'bg-cyan-50 text-cyan-700 ring-cyan-700/10',
      light: 'bg-white text-slate-700 ring-slate-300',
      dark: 'bg-slate-900 text-white ring-slate-900',
      neutral: 'bg-zinc-50 text-zinc-700 ring-zinc-700/10',
    };
  }
}
`,
    },
    {
      path: '/src/app/shared/components/tailwind/badge/badge.html',
      content: `<span
  [attr.aria-label]="ariaLabel()"
  [class]="badgeClasses()"
>
  <ng-content />
</span>
`,
    },
    {
      path: '/src/app/shared/components/tailwind/badge/badge.scss',
      content: '',
    },
  ],
  supplementalFiles: [
    {
      path: '/src/app/shared/components/tailwind/badge/badge.spec.ts',
      content: `import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { TailwindBadge } from './badge';

describe('TailwindBadge', () => {
  let fixture: ComponentFixture<TailwindBadge>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TailwindBadge);
    fixture.detectChanges();
  });

  it('renders the primary variant by default', () => {
    expect(getBadge().classList.contains('bg-sky-50')).toBe(true);
  });

  it('applies the selected variant and exposes accessible labeling', () => {
    fixture.componentRef.setInput('variant', 'dark');
    fixture.componentRef.setInput('pill', true);
    fixture.componentRef.setInput('ariaLabel', 'Active items');
    fixture.detectChanges();

    const badge = getBadge();

    expect(badge.classList.contains('bg-slate-900')).toBe(true);
    expect(badge.classList.contains('rounded-full')).toBe(true);
    expect(badge.getAttribute('aria-label')).toBe('Active items');
  });

  function getBadge(): HTMLSpanElement {
    return fixture.nativeElement.querySelector('span') as HTMLSpanElement;
  }
});
`,
    },
  ],
};
