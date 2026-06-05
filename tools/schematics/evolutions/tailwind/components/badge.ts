import { type TailwindComponentDefinition } from '../tailwind.model';

export const tailwindBadgeDefinition: TailwindComponentDefinition = {
  name: 'badge',
  label: 'Badge',
  className: 'TailwindBadge',
  exportPath: './badge/badge',
  files: [
    {
      path: '/src/app/shared/components/tailwind/badge/badge.ts',
      content: `import { booleanAttribute, Component, computed, input } from '@angular/core';

type TailwindBadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'neutral';

@Component({
  selector: 'app-tailwind-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class TailwindBadge {
  readonly variant = input<TailwindBadgeVariant>('primary');
  readonly pill = input(false, { transform: booleanAttribute });

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
      neutral: 'bg-zinc-50 text-zinc-700 ring-zinc-700/10',
    };
  }
}
`,
    },
    {
      path: '/src/app/shared/components/tailwind/badge/badge.html',
      content: `<span [class]="badgeClasses()">
  <ng-content />
</span>
`,
    },
    {
      path: '/src/app/shared/components/tailwind/badge/badge.scss',
      content: '',
    },
  ],
};
