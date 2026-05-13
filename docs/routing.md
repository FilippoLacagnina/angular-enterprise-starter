# Routing and SSR

## Index

- [Routing baseline](#routing-baseline)
- [Feature child routes](#feature-child-routes)
- [Route guards](#route-guards)
- [SSR render modes](#ssr-render-modes)

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
