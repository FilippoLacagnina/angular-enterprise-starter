# Evolution CLI Guide Contract

## Purpose

Files in this directory are the operational guides for Evolution CLI users.

They explain how to preview, apply, configure, verify and safely remove an installed capability.
Internal architecture and reference-branch implementation details belong under `docs/evolutions/`.

## Documentation ownership

| Documentation area        | Responsibility                                                    |
| ------------------------- | ----------------------------------------------------------------- |
| `README.md`               | Project positioning, quick start and primary navigation.          |
| `docs/schematics.md`      | Evolution CLI workflow, catalog and shared safety model.          |
| `docs/evolution-cli/*.md` | Operational installation and usage guide for one CLI evolution.   |
| `docs/evolutions.md`      | Reference-branch catalog, lifecycle and maintenance strategy.     |
| `docs/evolutions/**/*.md` | Architecture, design decisions and implementation-level guidance. |
| Evolution manifest        | Structured names, options, defaults, dependencies and branches.   |

Structured values should not be maintained independently when they can be read from the evolution
manifest. Prose should explain intent, trade-offs and operational consequences.

## Standard guide structure

Every installer guide must use this order:

1. Purpose
2. When to use it
3. Prerequisites
4. Generated changes
5. Dependencies
6. Options
7. Preview and apply
8. Configuration
9. Safety and repeatability
10. Compatibility
11. Verification
12. Removal and rollback
13. Troubleshooting
14. Architecture reference

Sections may be omitted only when they genuinely do not apply. Avoid repeating internal
architecture already covered by the corresponding `docs/evolutions/` guide.

Add this marker below the document title:

```html
<!-- evolution-guide-standard -->
```

`npm run docs:check` validates every marked guide against the required section set.

## Maintenance rules

When installer behavior changes:

- update the evolution manifest first for structured metadata;
- update the installer preview and apply behavior together;
- update the corresponding operational guide;
- update architecture documentation only when design or generated structure changes;
- run `npm run docs:check`;
- run the schematic and packaged CLI verification described in `docs/schematics.md`.
