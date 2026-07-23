import { type BootstrapComponentDefinition } from '../bootstrap.model';

export const bootstrapCardDefinition: BootstrapComponentDefinition = {
  name: 'card',
  label: 'Card',
  className: 'BootstrapCard',
  exportPath: './card/card',
  files: [
    {
      path: '/src/app/shared/components/bootstrap/card/card.ts',
      content: `import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BootstrapCardHeadingLevel = 2 | 3 | 4 | 5 | 6;
export type BootstrapCardImageLoading = 'eager' | 'lazy';
export type BootstrapCardImagePosition = 'top' | 'bottom';

@Component({
  selector: 'app-bootstrap-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootstrapCard {
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
  readonly headingLevel = input<BootstrapCardHeadingLevel>(3);
  readonly imageSrc = input<string | null>(null);
  readonly imageAlt = input('');
  readonly imagePosition = input<BootstrapCardImagePosition>('top');
  readonly imageLoading = input<BootstrapCardImageLoading>('lazy');
  readonly imageWidth = input<number | null>(null);
  readonly imageHeight = input<number | null>(null);
  readonly ariaLabel = input<string | null>(null);
}
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/card/card.html',
      content: `<article
  [attr.aria-label]="ariaLabel()"
  class="card"
>
  @if (imageSrc() && imagePosition() === 'top') {
    <img
      [alt]="imageAlt()"
      [attr.height]="imageHeight()"
      [attr.loading]="imageLoading()"
      [attr.width]="imageWidth()"
      [src]="imageSrc()"
      class="card-img-top"
    />
  }

  <div class="card-body">
    @if (title()) {
      @switch (headingLevel()) {
        @case (2) {
          <h2 class="card-title">{{ title() }}</h2>
        }
        @case (3) {
          <h3 class="card-title">{{ title() }}</h3>
        }
        @case (4) {
          <h4 class="card-title">{{ title() }}</h4>
        }
        @case (5) {
          <h5 class="card-title">{{ title() }}</h5>
        }
        @case (6) {
          <h6 class="card-title">{{ title() }}</h6>
        }
      }
    }

    @if (subtitle()) {
      <p class="card-subtitle mb-2 text-body-secondary">{{ subtitle() }}</p>
    }

    <div class="card-text">
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
      class="card-img-bottom"
    />
  }
</article>
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/card/card.scss',
      content: '',
    },
  ],
  supplementalFiles: [
    {
      path: '/src/app/shared/components/bootstrap/card/card.spec.ts',
      content: `import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { BootstrapCard } from './card';

describe('BootstrapCard', () => {
  let fixture: ComponentFixture<BootstrapCard>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BootstrapCard);
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

    expect(image.classList.contains('card-img-bottom')).toBe(true);
    expect(image.getAttribute('loading')).toBe('eager');
    expect(image.getAttribute('width')).toBe('640');
    expect(image.getAttribute('height')).toBe('360');
  });
});
`,
    },
  ],
};
