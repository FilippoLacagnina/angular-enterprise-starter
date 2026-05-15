# PrimeNG Evolution

## Index

- [Goal](#goal)
- [Official resources](#official-resources)
- [Current setup](#current-setup)
- [License and premium assets](#license-and-premium-assets)
- [Animations](#animations)
- [Usage](#usage)
- [Icons](#icons)
- [Tailwind integration](#tailwind-integration)
- [Guidelines](#guidelines)
- [Merge notes](#merge-notes)

## Goal

This evolution branch adds a minimal PrimeNG baseline.

The goal is to make PrimeNG available as an enterprise-oriented component foundation without turning the starter into a pre-designed UI kit.

## Official resources

- [PrimeNG documentation](https://primeng.org/)
- [PrimeNG installation](https://primeng.org/installation)
- [PrimeNG theming](https://primeng.org/theming)
- [PrimeNG GitHub repository](https://github.com/primefaces/primeng)

## Current setup

The branch installs the PrimeNG community component library, Prime UIX themes and PrimeIcons:

```text
primeng
@primeuix/themes
primeicons
```

PrimeNG is configured in:

```text
src/app/app.config.ts
```

Current theme preset:

```text
Aura
```

PrimeIcons CSS is imported globally from:

```text
src/styles.scss
```

## License and premium assets

This branch uses the PrimeNG community packages.

PrimeNG community versions are licensed under MIT.
Premium templates, paid themes, commercial LTS packages and commercial support are intentionally not included.

## Animations

This branch does not register `provideAnimations()`, `provideAnimationsAsync()` or `provideNoopAnimations()`.

Those providers are deprecated in modern Angular versions.
Projects that need custom animations should prefer Angular's newer `animate.enter` and `animate.leave` APIs or project-specific CSS animation patterns.

Using PrimeNG components only requires importing the needed PrimeNG modules into standalone components.
No animation provider is required by this starter baseline.

## Usage

PrimeNG components can be imported directly into standalone components after cloning this branch.

Example:

```ts
import { ButtonModule } from 'primeng/button';

@Component({
  imports: [ButtonModule],
})
export class ExampleComponent {}
```

Template example:

```html
<p-button label="Primary action" />
```

This branch does not apply PrimeNG components to the existing layout or dashboard templates by default.
This keeps the evolution branch easier to merge with other optional branches.

## Icons

This branch includes PrimeIcons because it is part of the PrimeNG ecosystem and is commonly used by PrimeNG components and examples.

General-purpose icon libraries are still handled as dedicated optional evolutions so teams can compose the icon set that best fits their product.

Examples planned for future evolutions:

```text
evo/icons/lucide
evo/icons/bootstrap-icons
evo/icons/primeicons
evo/icons/material-icons
```

## Tailwind integration

PrimeNG can also be integrated with Tailwind CSS.

This branch intentionally keeps the PrimeNG baseline independent from Tailwind.
A dedicated `evo/design-system/primeng-tailwind` branch can be used for the combined setup.

## Guidelines

- Keep PrimeNG usage intentional and project-specific.
- Avoid turning shared starter templates into business-specific UI examples.
- Replace or customize the Aura preset when the product design direction is defined.
- Avoid mixing multiple UI component frameworks unless the project explicitly needs it.
- Prefer dedicated icon evolutions for additional icon libraries outside the PrimeNG ecosystem.
- Keep premium templates and paid assets outside this starter branch.

## Merge notes

This evolution is intentionally small and additive-first.

Expected merge points:

- `package.json`
- `package-lock.json`
- `src/app/app.config.ts`
- `src/styles.scss`

No existing layout or feature templates are changed by this branch.
