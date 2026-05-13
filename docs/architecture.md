# Angular Enterprise Starter - Architecture Guidelines

## Index

- [Obiettivo](#obiettivo)
- [Stato implementazione layout](#stato-implementazione-layout)
- [Struttura base](#struttura-base)
- [Shared baseline](#shared-baseline)
- [Core baseline](#core-baseline)
- [Application config and environments](#application-config-and-environments)
- [API routes baseline](#api-routes-baseline)
- [HTTP interceptors baseline](#http-interceptors-baseline)
- [Feature baseline](#feature-baseline)
- [Direttive d'uso](#direttive-duso)
- [Convenzioni consigliate](#convenzioni-consigliate)
- [Import aliases](#import-aliases)
- [Structural pattern for files and tests](#structural-pattern-for-files-and-tests)
- [Routing baseline corrente](#routing-baseline-corrente)
- [Pattern route feature con child routes](#pattern-route-feature-con-child-routes)
- [SSR render modes](#ssr-render-modes)
- [Layout baseline corrente](#layout-baseline-corrente)

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

## Core baseline

La cartella `core` contiene infrastruttura applicativa singleton e cross-cutting concern:

- `core/config`: configurazioni applicative, loader e adapter di configurazione.
- `core/api`: path endpoint organizzati per microservizio.
- `core/guards`: route guard e logiche di protezione accesso.
- `core/interceptors`: interceptor HTTP globali.
- `core/services`: servizi singleton trasversali.
- `core/tokens`: injection token e provider condivisi.

`core` non deve contenere componenti UI, view di routing o logica specifica di una singola feature.
Le feature possono dipendere da `core`, ma `core` non deve importare feature.

## Application config and environments

La configurazione applicativa globale vive in `core/config` ed e registrata tramite dependency injection.
Il progetto prevede quattro ambienti:

- `local`
- `dev`
- `test`
- `prod`

Struttura corrente:

```text
core/config/
  app-environment.type.ts
  app-config.model.ts
  app-config.provider.ts
  app-config.token.ts

environments/
  environment.ts
  environment.local.ts
  environment.dev.ts
  environment.test.ts
  environment.prod.ts
```

Il codice applicativo importa sempre `src/environments/environment.ts`.
Angular sostituisce questo file tramite `fileReplacements` nelle configurazioni `local`, `development`, `test` e `production`.

Mapping consigliato:

```text
ng serve                         -> local
ng serve --configuration test    -> test
ng build --configuration local   -> local
ng build --configuration development -> dev
ng build --configuration test    -> test
ng build --configuration production -> prod
```

Uso ambienti:

- `local`: macchina dello sviluppatore, backend locali o mock locali.
- `dev`: ambiente condiviso di sviluppo.
- `test`: ambiente QA/integration.
- `prod`: produzione.

Esempio model:

```ts
export type AppEnvironment = 'local' | 'dev' | 'test' | 'prod';

export interface AppApiEndpoints {
  dashboard: string;
}

export interface AppConfig {
  appName: string;
  environment: AppEnvironment;
  api: AppApiEndpoints;
}
```

Esempio environment:

```ts
export const environment = {
  appName: 'Angular Enterprise Starter',
  environment: 'local',
  api: {
    dashboard: 'http://localhost:3000',
  },
} satisfies AppConfig;
```

Uso consigliato:

- aggiungere in `AppApiEndpoints` una chiave per ogni microservizio necessario;
- mantenere nei file environment solo base URL e valori dipendenti dall'ambiente;
- non inserire path endpoint REST negli environment.

## API routes baseline

I base URL dei microservizi appartengono alla configurazione applicativa (`core/config`).
I path degli endpoint appartengono a `core/api`.

La regola consigliata e: **un file per microservizio**, con eventuali versioni gestite dentro l'oggetto esportato.
Questo evita mega-file centralizzati e rende piu chiara l'ownership quando piu team lavorano su API diverse.

Esempio struttura:

```text
core/api/
  dashboard-api.routes.ts
```

Il progetto include `dashboard-api.routes.ts` come esempio baseline.
Ogni nuovo microservizio dovrebbe avere un file dedicato con lo stesso pattern.
Gli esempi `dashboard-api.routes.ts` e `DashboardService` sono volutamente dimostrativi: dopo il clone del progetto vanno modificati o rimossi in base ai microservizi reali.

Esempio base URL nella config:

```ts
export interface AppApiEndpoints {
  dashboard: string;
}
```

Esempio path versionati per microservizio:

```ts
export const dashboardApiRoutes = {
  v1: {
    summary: '/v1/dashboard/summary',
  },
  v2: {
    summary: '/v2/dashboard/summary',
    detail: (id: string) => `/v2/dashboard/${id}`,
  },
} as const;
```

Esempio utilizzo in un service di feature:

```ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { dashboardApiRoutes } from '@core/api/dashboard-api.routes';
import { APP_CONFIG } from '@core/config/app-config.token';

@Injectable()
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  getDashboardDetail(id: string) {
    return this.http.get(`${this.config.api.dashboard}${dashboardApiRoutes.v2.detail(id)}`);
  }
}
```

Il progetto include questo esempio in `features/dashboard/services/dashboard.service.ts`.
Il service non e collegato alla UI: serve solo come riferimento strutturale per mostrare come combinare `APP_CONFIG` e `dashboardApiRoutes`.

In questo pattern:

- `core/config` definisce quale base URL usare per ambiente (`local`, `dev`, `test`, `prod`).
- `core/api` definisce i path endpoint per microservizio.
- `features/<feature>/services` contiene le chiamate HTTP e la logica specifica della feature.
- la versione API e esplicita nel punto di utilizzo (`dashboardApiRoutes.v1`, `dashboardApiRoutes.v2`).

Il progetto registra `HttpClient` in `app.config.ts` tramite `provideHttpClient(withFetch())`.
`withFetch()` e la baseline consigliata per applicazioni Angular con SSR/hybrid rendering.

## HTTP interceptors baseline

Gli interceptor HTTP globali vivono in `core/interceptors` e sono registrati in `app.config.ts` tramite `withInterceptors`.

Baseline corrente:

- `correlation-id.interceptor.ts`: aggiunge header `X-Correlation-Id` a ogni request.
- `error.interceptor.ts`: punto centralizzato per intercettare errori HTTP e rilanciarli.

Il correlation id serve a tracciare una request end-to-end tra frontend, backend e microservizi.
Backend, API gateway e servizi distribuiti possono loggare lo stesso valore per ricostruire il flusso di una chiamata durante debug, supporto o incident analysis.

Esempio header:

```http
X-Correlation-Id: 8f2b7c4e-1a2b-4c3d-9e0f-123456789abc
```

In progetti reali il correlation id puo anche essere generato o normalizzato da backend, API gateway o piattaforme di observability.

Uso consigliato:

- tenere negli interceptor solo logica infrastrutturale e cross-cutting;
- non inserire business logic negli interceptor;
- aggiungere interceptor globali solo quando valgono per tutta l'applicazione;
- valutare con attenzione eventuali interceptor specifici di feature.

## Feature baseline

Ogni feature rappresenta un'area funzionale autonoma.
La struttura consigliata e:

```text
features/<feature-name>/
  <feature-name>.routes.ts
  views/
  components/
  services/
  models/
```

Uso consigliato:

- `views`: componenti collegati direttamente al routing della feature.
- `components`: componenti interni alla feature, non condivisi globalmente.
- `services`: service specifici della feature.
- `models`: tipi, interfacce e model specifici della feature.

Un service specifico della dashboard, ad esempio, vive in `features/dashboard/services`.
Non va inserito in `core/services`, perche `core/services` e riservato a servizi globali e trasversali.

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

## Import aliases

Il progetto espone alias TypeScript per evitare import relativi lunghi tra layer applicativi:

- `@core/*`: infrastruttura applicativa singleton.
- `@shared/*`: building block riusabili.
- `@features/*`: feature lazy e logica di dominio.
- `@layout/*`: shell e componenti layout globali.

Uso consigliato:

- usare gli alias quando si importa da un layer applicativo diverso o da una cartella distante;
- preferire import relativi brevi per file molto vicini nello stesso blocco;
- non usare gli alias per aggirare i boundary architetturali.

Esempio:

```ts
import { ShellComponent } from '@layout/shell/shell';
```

## Structural pattern for files and tests

La struttura interna resta flat quando un elemento e composto da un singolo file sorgente piu eventuale test.
Quando invece un elemento richiede piu file correlati, va creata una directory dedicata.

Questa regola si applica a `core`, `shared` e `features`.
I test unitari restano sempre vicino al sorgente testato.

Esempio flat:

```text
core/guards/
  auth.guard.ts
  auth.guard.spec.ts
```

Esempio con directory dedicata:

```text
core/services/logger/
  logger.service.ts
  logger.service.spec.ts
  logger.model.ts
  logger.adapter.ts
```

Regola pratica:

- 1 file sorgente + eventuale `.spec.ts`: struttura flat.
- N file correlati: directory dedicata con nome del blocco.
- Test accanto al file o al blocco testato.

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

## SSR render modes

Il progetto include la configurazione Angular SSR in `src/app/app.routes.server.ts`.
Il default corrente dello starter e `RenderMode.Prerender`.

Angular supporta questi render mode:

- `RenderMode.Server`: Server-Side Rendering (SSR), contenuto renderizzato sul server per ogni request.
- `RenderMode.Client`: Client-Side Rendering (CSR), contenuto renderizzato nel browser.
- `RenderMode.Prerender`: Static Site Generation (SSG), contenuto pre-renderizzato a build time e servito come file statico.

Hybrid rendering non e un quarto valore di `RenderMode`.
E la strategia complessiva dell'applicazione ottenuta combinando render mode diversi sulle singole server routes.

Esempio hybrid rendering:

```ts
export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'profile',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
```

Baseline corrente:

```ts
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
```

Regola consigliata:

- usare `Prerender` per route statiche o prevedibili;
- usare `Server` per route che richiedono rendering per request;
- usare `Client` quando la route deve essere gestita solo nel browser.

## Layout baseline corrente

I componenti layout correnti sono:

- `app-shell`
- `app-header`
- `app-sidebar`
- `app-footer`

La shell monta i blocchi nell'ordine: header, sidebar, main, footer.
