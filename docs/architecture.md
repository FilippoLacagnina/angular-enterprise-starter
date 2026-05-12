# Angular Enterprise Starter - Architecture Guidelines

## Obiettivo

Questa base progetto definisce una struttura enterprise chiara, scalabile e facilmente mantenibile.
Le regole sotto sono il contratto d'uso consigliato per tutti i team che adottano lo starter.

## Stato implementazione layout

La shell e impostata in modalita **unstyled base**:

- template minimali con placeholder testuali
- nessuna classe CSS nei template layout
- file SCSS layout intenzionalmente vuoti

Questa scelta mantiene il progetto neutro e pronto per branding/design system personalizzati.

## Struttura base

- `src/app/core`: infrastruttura applicativa singleton (config, auth, guards, interceptors, logger, error handling).
- `src/app/shared`: componenti, directive, pipe e utility riusabili e indipendenti dal dominio.
- `src/app/layout`: shell globale (header, sidebar, footer, content wrapper).
- `src/app/features`: moduli funzionali di business (es. dashboard, users, settings), caricati in lazy loading.

## Shared baseline

La cartella `shared` contiene building block riusabili e indipendenti dal dominio:

- `shared/components`: componenti riusabili e presentazionali.
- `shared/directives`: directive standalone riusabili.
- `shared/pipes`: pipe standalone riusabili.
- `shared/utils`: funzioni pure, helper e utility senza dipendenze Angular quando possibile.

Una UI library dedicata e intenzionalmente rimandata.
In questa fase il progetto resta neutro: la library potra essere introdotta quando saranno chiari design system, API componenti e strategia di riuso.

## Direttive d'uso

1. `core` non contiene componenti UI di business.
2. `shared` non contiene logica di dominio né stato applicativo globale.
3. Ogni feature deve essere autonoma e organizzata in sottocartelle dedicate (`views`, `components`, `services`, `models`).
4. Le feature non si importano tra loro direttamente.
5. Dipendenze consentite:
   - `features -> shared/core`
   - `layout -> shared/core`
   - `shared -> nessuna feature`
   - `core -> nessuna feature`
6. Tutte le feature devono essere lazy-loaded.
7. Il routing root deve comporre layout e feature, non logica di business diretta.
8. L'accesso HTTP deve passare da service/data-access layer, non da componenti presentazionali.
9. DTO e model di dominio vanno mantenuti separati con mapping esplicito.
10. Ogni feature nuova deve includere almeno test base per page/service principali.

## Convenzioni consigliate

- Naming componenti: `feature-name`, `feature-name-card`, `feature-name-form`.
- Naming file: `kebab-case`.
- Preferire componenti standalone e API Angular moderne.
- Le view di routing vivono in `features/<feature-name>/views/<view-name>/<view-name>.component.*`.
- Ogni feature espone le proprie route tramite `features/<feature-name>/<feature-name>.routes.ts`.

## Routing baseline corrente

Il root router mantiene solo il punto di ingresso applicativo:

- `/` redirecta a `/dashboard`
- `/dashboard` carica lazy `features/dashboard/dashboard.routes.ts`

La feature `dashboard` espone la propria view principale in:

- `features/dashboard/views/dashboard/dashboard.component.ts`

## Pattern route feature con child routes

Quando una feature richiede rotte figlie, la gerarchia resta interna alla feature.
Il root router deve conoscere solo il file `<feature-name>.routes.ts`.

Esempio struttura:

```text
features/dashboard/
  dashboard.routes.ts
  views/
    dashboard/
      dashboard.component.ts
      dashboard.component.html
      dashboard.component.scss
    analytics/
      analytics.component.ts
      analytics.component.html
      analytics.component.scss
    reports/
      reports.component.ts
      reports.component.html
      reports.component.scss
```

Esempio routing:

```ts
import { type Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/dashboard/dashboard.component').then(
        (component) => component.DashboardComponent,
      ),
    children: [
      {
        path: 'analytics',
        loadComponent: () =>
          import('./views/analytics/analytics.component').then(
            (component) => component.AnalyticsComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./views/reports/reports.component').then(
            (component) => component.ReportsComponent,
          ),
      },
    ],
  },
];
```

In questo pattern:

- `/dashboard` carica la view principale della feature.
- `/dashboard/analytics` carica una view figlia della feature.
- `/dashboard/reports` carica una view figlia della feature.
- Le view figlie devono essere renderizzate da un `router-outlet` presente nella view padre.

## Layout baseline corrente

I componenti layout correnti sono:

- `app-shell`
- `app-header`
- `app-sidebar`
- `app-footer`

La shell monta i blocchi nell'ordine: header, sidebar, main, footer.
