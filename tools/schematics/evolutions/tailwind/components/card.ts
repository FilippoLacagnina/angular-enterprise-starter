import { type TailwindComponentDefinition } from '../tailwind.model';

export const tailwindCardDefinition: TailwindComponentDefinition = {
  name: 'card',
  label: 'Card',
  className: 'TailwindCard',
  exportPath: './card/card',
  files: [
    {
      path: '/src/app/shared/components/tailwind/card/card.ts',
      content: `import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TailwindCardHeadingLevel = 2 | 3 | 4 | 5 | 6;
export type TailwindCardImageLoading = 'eager' | 'lazy';
export type TailwindCardImagePosition = 'top' | 'bottom';

@Component({
  selector: 'app-tailwind-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TailwindCard {
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
  readonly headingLevel = input<TailwindCardHeadingLevel>(3);
  readonly imageSrc = input<string | null>(null);
  readonly imageAlt = input('');
  readonly imagePosition = input<TailwindCardImagePosition>('top');
  readonly imageLoading = input<TailwindCardImageLoading>('lazy');
  readonly imageWidth = input<number | null>(null);
  readonly imageHeight = input<number | null>(null);
  readonly ariaLabel = input<string | null>(null);
}
`,
    },
    {
      path: '/src/app/shared/components/tailwind/card/card.html',
      content: `<article
  [attr.aria-label]="ariaLabel()"
  class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
>
  @if (imageSrc() && imagePosition() === 'top') {
    <img
      [alt]="imageAlt()"
      [attr.height]="imageHeight()"
      [attr.loading]="imageLoading()"
      [attr.width]="imageWidth()"
      [src]="imageSrc()"
      class="h-48 w-full object-cover"
    />
  }

  <div class="space-y-3 p-5">
    @if (title()) {
      @switch (headingLevel()) {
        @case (2) {
          <h2 class="text-lg font-semibold text-slate-950">{{ title() }}</h2>
        }
        @case (3) {
          <h3 class="text-lg font-semibold text-slate-950">{{ title() }}</h3>
        }
        @case (4) {
          <h4 class="text-lg font-semibold text-slate-950">{{ title() }}</h4>
        }
        @case (5) {
          <h5 class="text-lg font-semibold text-slate-950">{{ title() }}</h5>
        }
        @case (6) {
          <h6 class="text-lg font-semibold text-slate-950">{{ title() }}</h6>
        }
      }
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
      [alt]="imageAlt()"
      [attr.height]="imageHeight()"
      [attr.loading]="imageLoading()"
      [attr.width]="imageWidth()"
      [src]="imageSrc()"
      class="h-48 w-full object-cover"
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
  supplementalFiles: [
    {
      path: '/src/app/shared/components/tailwind/card/card.spec.ts',
      content: `import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { TailwindCard } from './card';

describe('TailwindCard', () => {
  let fixture: ComponentFixture<TailwindCard>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TailwindCard);
    fixture.detectChanges();
  });

  it('uses the configured semantic heading level', () => {
    fixture.componentRef.setInput('title', 'Account overview');
    fixture.componentRef.setInput('headingLevel', 2);
    fixture.componentRef.setInput('ariaLabel', 'Account card');
    fixture.detectChanges();

    const article = fixture.nativeElement.querySelector('article') as HTMLElement;

    expect(article.getAttribute('aria-label')).toBe('Account card');
    expect(article.querySelector('h2')?.textContent).toContain('Account overview');
    expect(article.querySelector('h3')).toBeNull();
  });

  it('configures a bottom image without layout metadata loss', () => {
    fixture.componentRef.setInput('imageSrc', '/account.png');
    fixture.componentRef.setInput('imageAlt', 'Account');
    fixture.componentRef.setInput('imagePosition', 'bottom');
    fixture.componentRef.setInput('imageLoading', 'eager');
    fixture.componentRef.setInput('imageWidth', 640);
    fixture.componentRef.setInput('imageHeight', 360);
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;

    expect(image.classList.contains('object-cover')).toBe(true);
    expect(image.getAttribute('loading')).toBe('eager');
    expect(image.getAttribute('width')).toBe('640');
    expect(image.getAttribute('height')).toBe('360');
  });
});
`,
    },
  ],
};
