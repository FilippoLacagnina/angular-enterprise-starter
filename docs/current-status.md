# Current Status

## Data

12 maggio 2026

## Cosa e stato fatto

1. Setup quality baseline

- ESLint configurato con Angular ESLint e regole strict.
- Prettier rinforzato con script dedicati (`format`, `format:check`).

2. Struttura enterprise iniziale

- Create le directory:
  - `src/app/core`
  - `src/app/shared`
  - `src/app/layout`
  - `src/app/features`

3. Layout base scaffold

- Creati componenti standalone:
  - `layout/shell`
  - `layout/header`
  - `layout/sidebar`
  - `layout/footer`
- Collegamento in `App` tramite `app-shell`.

4. Reset per personalizzazione massima

- Rimossa la UI strutturata precedente.
- Mantenuti solo placeholder testuali nei template layout.
- Rimossi stili e classi CSS dai layout.

5. Routing e dashboard baseline

- Aggiunto redirect root da `/` a `/dashboard`.
- Aggiunta feature lazy `features/dashboard`.
- Aggiunta view standalone `features/dashboard/views/dashboard/dashboard.component.*`.

## Scelta progettuale corrente

Il repository resta neutro lato design per permettere a chi lo adotta di:

- applicare il proprio design system
- scegliere liberamente struttura CSS/SCSS
- introdurre tema/layout senza vincoli preimpostati
