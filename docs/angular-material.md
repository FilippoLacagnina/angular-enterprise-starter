# Angular Material Evolution

## Index

- [Goal](#goal)
- [Official resources](#official-resources)
- [Current setup](#current-setup)
- [Animations](#animations)
- [Usage](#usage)
- [Icons](#icons)
- [Guidelines](#guidelines)
- [Merge notes](#merge-notes)

## Goal

This evolution branch adds a minimal Angular Material baseline.

The goal is to make Angular Material available as a component foundation without turning the starter into a pre-designed UI kit.

## Official resources

- [Angular Material documentation](https://material.angular.dev/)
- [Angular Material getting started](https://material.angular.dev/guide/getting-started)
- [Angular Material theming](https://material.angular.dev/guide/theming)
- [Angular Components GitHub repository](https://github.com/angular/components)

## Current setup

The branch installs Angular Material and Angular CDK:

```text
@angular/material
@angular/cdk
```

The Material prebuilt theme is imported globally from:

```text
src/styles.scss
```

Current prebuilt theme:

```text
azure-blue.css
```

This gives cloned projects a working Material baseline while keeping project-specific theming decisions easy to replace later.

## Animations

This branch does not register `provideAnimations()`, `provideAnimationsAsync()` or `provideNoopAnimations()`.

Those providers are deprecated in modern Angular versions.
Projects that need custom animations should prefer Angular's newer `animate.enter` and `animate.leave` APIs or project-specific CSS animation patterns.

Using Angular Material components only requires importing the needed Material modules into standalone components.
No animation provider is required by this starter baseline.

## Usage

Angular Material components can be imported directly into standalone components after cloning this branch.

Example:

```ts
import { MatButtonModule } from '@angular/material/button';

@Component({
  imports: [MatButtonModule],
})
export class ExampleComponent {}
```

Template example:

```html
<button matButton="filled">Primary action</button>
```

This branch does not apply Angular Material components to the existing layout or dashboard templates by default.
This keeps the evolution branch easier to merge with other optional branches.

## Icons

This branch does not install an icon library by default.

Icon libraries are handled as dedicated optional evolutions so teams can compose the icon set that best fits their product.

Examples planned for future evolutions:

```text
evo/icons/lucide
evo/icons/bootstrap-icons
evo/icons/material-icons
```

## Guidelines

- Keep Angular Material usage intentional and project-specific.
- Avoid turning shared starter templates into business-specific UI examples.
- Replace the prebuilt theme with a project-specific theme when the product design direction is defined.
- Avoid mixing multiple UI component frameworks unless the project explicitly needs it.
- Prefer dedicated icon evolutions instead of coupling icons directly to this branch.

## Merge notes

This evolution is intentionally small and additive-first.

Expected merge points:

- `package.json`
- `package-lock.json`
- `src/styles.scss`

No existing layout or feature templates are changed by this branch.
