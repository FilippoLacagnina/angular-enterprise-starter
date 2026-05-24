import { type BootstrapComponentDefinition } from '../bootstrap.model';

export const bootstrapBadgeDefinition: BootstrapComponentDefinition = {
  name: 'badge',
  label: 'Badge',
  className: 'BootstrapBadge',
  exportPath: './badge/badge',
  files: [
    {
      path: '/src/app/shared/components/bootstrap/badge/badge.ts',
      content: `import { booleanAttribute, Component, computed, input } from '@angular/core';

type BootstrapBadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';

@Component({
  selector: 'app-bootstrap-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class BootstrapBadge {
  readonly variant = input<BootstrapBadgeVariant>('primary');
  readonly pill = input(false, { transform: booleanAttribute });

  protected readonly badgeClasses = computed(() =>
    ['badge', \`text-bg-\${this.variant()}\`, this.pill() ? 'rounded-pill' : '']
      .filter(Boolean)
      .join(' '),
  );
}
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/badge/badge.html',
      content: `<span [class]="badgeClasses()">
  <ng-content />
</span>
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/badge/badge.scss',
      content: '',
    },
  ],
};
