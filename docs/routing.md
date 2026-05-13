# Routing and SSR

## Index

- [Routing baseline](#routing-baseline)
- [Feature child routes](#feature-child-routes)
- [Route guards](#route-guards)
- [SSR render modes](#ssr-render-modes)
- [Hydration](#hydration)

## Routing baseline

The root router keeps only the application entrypoint:

- `/` redirects to `/dashboard`
- `/dashboard` lazy-loads `features/dashboard/dashboard.routes.ts`

The dashboard feature exposes its main routed view in:

```text
features/dashboard/views/dashboard/dashboard.component.ts
```

## Feature child routes

When a feature needs child routes, the hierarchy stays inside the feature.
The root router should know only the feature routes file.

```text
features/dashboard/
  dashboard.routes.ts
  views/
    dashboard/
      dashboard.component.ts
    analytics/
      analytics.component.ts
    reports/
      reports.component.ts
```

```ts
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
    ],
  },
];
```

Child views must be rendered by a `router-outlet` in the parent routed view.

## Route guards

Global guards live in `core/guards` when they represent cross-cutting rules such as authentication or permissions.
The starter does not implement real guards because auth, session and roles depend on the project that clones this base.

Recommended pattern:

```text
core/guards/
  auth.guard.ts
  permission.guard.ts
```

```ts
import { type CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  return true;
};
```

Usage:

```ts
export const routes: Routes = [
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((routes) => routes.dashboardRoutes),
  },
];
```

## SSR render modes

Angular SSR configuration lives in `src/app/app.routes.server.ts`.
The current starter default is `RenderMode.Prerender`.

Render modes:

- `RenderMode.Server`: Server-Side Rendering, rendered on the server for each request.
- `RenderMode.Client`: Client-Side Rendering, rendered in the browser.
- `RenderMode.Prerender`: Static Site Generation, pre-rendered at build time and served as static files.

Hybrid rendering is not a fourth `RenderMode`.
It is the application strategy created by combining different render modes on individual server routes.

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

Current baseline:

```ts
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
```

After building the application, the generated server bundle can be tested locally with:

```bash
npm run build
npm run serve:ssr
```

The `serve:ssr` script runs `dist/angular-enterprise-starter/server/server.mjs`.

### When to use RenderMode.Server

`RenderMode.Server` should be introduced when a route needs to be rendered on the server for every request.
It is not the starter default because the current dashboard route is static and does not require request-aware rendering.

Good candidates:

- user-specific pages;
- pages that depend on cookies, headers or request context;
- dynamic SEO content that must be fresh on each request;
- routes with frequently changing server data;
- routes that cannot be pre-rendered safely at build time.

Before using `RenderMode.Server`, review:

- browser-only APIs such as `window`, `document` and `localStorage`;
- server-safe auth/session access;
- cookie and header handling;
- cache strategy;
- API latency and timeout behavior;
- observability for server-rendered requests.

Example:

```ts
export const serverRoutes: ServerRoute[] = [
  {
    path: 'profile',
    renderMode: RenderMode.Server,
  },
];
```

Recommended approach:

- keep `Prerender` for static or predictable routes;
- use `Server` only for routes with real request-time requirements;
- document why a route needs SSR when changing its render mode.

## Hydration

Hydration is the phase where Angular takes the HTML already rendered by the server or produced at build time and attaches the client-side application behavior to it.

The starter enables hydration in `src/app/app.config.ts`:

```ts
provideClientHydration(withEventReplay());
```

Flow:

```text
server/prerender output -> browser receives HTML -> Angular boots on client -> existing DOM is hydrated -> user interactions continue
```

`withEventReplay()` captures user events that happen before Angular finishes bootstrapping on the client and replays them after hydration is ready.
This improves perceived responsiveness during SSR/prerender startup.

When working with hydrated routes:

- avoid changing server-rendered DOM before Angular hydrates it;
- guard browser-only APIs such as `window`, `document` and `localStorage`;
- keep generated IDs deterministic when they affect rendered markup;
- avoid side effects during component construction;
- move browser-only logic to lifecycle hooks or platform-safe services;
- test pages both after direct refresh and after client-side navigation.

Hydration applies to both `RenderMode.Server` and `RenderMode.Prerender` outputs.
Pure `RenderMode.Client` routes are rendered in the browser and do not reuse pre-rendered HTML in the same way.
