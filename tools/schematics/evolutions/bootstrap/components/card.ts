import { type BootstrapComponentDefinition } from '../bootstrap.model';

export const bootstrapCardDefinition: BootstrapComponentDefinition = {
  name: 'card',
  label: 'Card',
  className: 'BootstrapCard',
  exportPath: './card/card',
  files: [
    {
      path: '/src/app/shared/components/bootstrap/card/card.ts',
      content: `import { Component, input } from '@angular/core';

type BootstrapCardImagePosition = 'top' | 'bottom';

@Component({
  selector: 'app-bootstrap-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class BootstrapCard {
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
  readonly imageSrc = input<string | null>(null);
  readonly imageAlt = input('');
  readonly imagePosition = input<BootstrapCardImagePosition>('top');
}
`,
    },
    {
      path: '/src/app/shared/components/bootstrap/card/card.html',
      content: `<article class="card">
  @if (imageSrc() && imagePosition() === 'top') {
    <img
      class="card-img-top"
      [alt]="imageAlt()"
      [src]="imageSrc()"
    />
  }

  <div class="card-body">
    @if (title()) {
      <h5 class="card-title">{{ title() }}</h5>
    }

    @if (subtitle()) {
      <h6 class="card-subtitle mb-2 text-body-secondary">{{ subtitle() }}</h6>
    }

    <div class="card-text">
      <ng-content />
    </div>
  </div>

  @if (imageSrc() && imagePosition() === 'bottom') {
    <img
      class="card-img-bottom"
      [alt]="imageAlt()"
      [src]="imageSrc()"
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
};
