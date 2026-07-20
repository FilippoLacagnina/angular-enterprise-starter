import { type TailwindComponentDefinition } from '../tailwind.model';

export const tailwindCardDefinition: TailwindComponentDefinition = {
  name: 'card',
  label: 'Card',
  className: 'TailwindCard',
  exportPath: './card/card',
  files: [
    {
      path: '/src/app/shared/components/tailwind/card/card.ts',
      content: `import { Component, input } from '@angular/core';

type TailwindCardImagePosition = 'top' | 'bottom';

@Component({
  selector: 'app-tailwind-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class TailwindCard {
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
  readonly imageSrc = input<string | null>(null);
  readonly imageAlt = input('');
  readonly imagePosition = input<TailwindCardImagePosition>('top');
}
`,
    },
    {
      path: '/src/app/shared/components/tailwind/card/card.html',
      content: `<article class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
  @if (imageSrc() && imagePosition() === 'top') {
    <img
      class="h-48 w-full object-cover"
      [alt]="imageAlt()"
      [src]="imageSrc()"
    />
  }

  <div class="space-y-3 p-5">
    @if (title()) {
      <h3 class="text-lg font-semibold text-slate-950">{{ title() }}</h3>
    }

    @if (subtitle()) {
      <p class="text-sm text-slate-500">{{ subtitle() }}</p>
    }

    <div class="text-sm text-slate-700">
      <ng-content />
    </div>
  </div>

  @if (imageSrc() && imagePosition() === 'bottom') {
    <img
      class="h-48 w-full object-cover"
      [alt]="imageAlt()"
      [src]="imageSrc()"
    />
  }
</article>
`,
    },
    {
      path: '/src/app/shared/components/tailwind/card/card.scss',
      content: '',
    },
  ],
};
