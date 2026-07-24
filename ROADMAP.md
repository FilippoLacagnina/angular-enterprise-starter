# Roadmap

This roadmap tracks the public alpha work required to evolve Angular Enterprise Starter without compromising its minimal, composable baseline.

## Current Phase

Evolution CLI reliability, sustainable installer maintenance and Builder alignment.

Current priorities:

- keep `main` minimal and independent from optional evolutions;
- keep the Interactive Builder aligned with published CLI capabilities;
- maintain one manifest-backed contract for installable evolutions;
- expand safety guards, generated-workspace verification and documentation checks;
- add new evolutions only when their long-term maintenance model is clear.

## Delivered Milestones

| Milestone        | Outcome                                                                  |
| ---------------- | ------------------------------------------------------------------------ |
| `0.1.0-alpha.0`  | Minimal Angular enterprise architecture, SSR and quality baseline.       |
| `0.2.0-alpha.0`  | Optional `evo/*` branch model and runtime configuration reference.       |
| `0.3.0-alpha.0`  | Centralized evolution documentation and Evolution CLI preview.           |
| `0.4.0-alpha.0`  | Versioned Evolution CLI package published on npm.                        |
| `0.5.0-alpha.0`  | Transloco and Tailwind CLI installers.                                   |
| `0.5.1-alpha.0`  | Bundled, render-safe schematic execution for consumer workspaces.        |
| `0.6.0-alpha.0`  | Runtime Config installer with preview, apply and safety guards.          |
| `0.7.0-alpha.0`  | AI Genkit installer, multi-provider-ready foundation and Angular 21 LTS. |
| `0.8.0-alpha.0`  | Hardened Evolution CLI and configurable Transloco language generation.   |
| `0.9.0-alpha.0`  | Builder-ready design-system contracts and hardened UI primitives.        |
| `0.10.0-alpha.0` | Configurable Layout Shell and accessible responsive navigation.          |

## Next

- Keep the Builder catalog and configurators synchronized with the Evolution CLI manifest.
- Continue compatibility testing across supported combinations of evolutions.
- Improve generated-project verification beyond in-memory schematic tests.
- Review Angular and ecosystem dependency updates without destabilizing existing evolutions.
- Prioritize optional testing and authentication foundations after the current installer set remains stable.

## Before Stable Release

- Decide the first stable version target and support policy.
- Define the compatibility window for Angular, Node and Evolution CLI releases.
- Review repository metadata, GitHub topics and public onboarding.
- Remove or adapt demonstrative dashboard API and service examples.
- Confirm that every installable evolution has preview, apply, rollback, documentation and generated-workspace coverage.
- Confirm Builder and CLI behavior against the same released starter baseline.

## Later

- Add further Evolution CLI installers only after branch-level validation.
- Evaluate optional end-to-end testing foundations.
- Evaluate an optional OIDC authentication and session foundation.
- Reassess planned evolutions against adoption value and maintenance cost.
