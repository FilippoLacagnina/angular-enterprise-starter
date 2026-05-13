# API Contracts

## Index

- [Endpoint contracts](#endpoint-contracts)
- [Dashboard example](#dashboard-example)
- [HTTP provider](#http-provider)
- [HTTP interceptors](#http-interceptors)

## Endpoint contracts

Base URLs belong to `core/config`.
Endpoint paths belong to `core/api`.

Recommended rule: one file per microservice, with API versions grouped inside the exported object.

```text
core/api/
  dashboard-api.routes.ts
```

`dashboard-api.routes.ts` is included as a baseline example.
Every new microservice should have its own file with the same pattern.

The dashboard API routes and dashboard service are intentionally demonstrative. After cloning this starter, modify or remove them according to the real microservices.

## Dashboard example

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

Feature service usage:

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { dashboardApiRoutes } from '@core/api/dashboard-api.routes';
import { APP_CONFIG } from '@core/config/app-config.token';
import { type Observable } from 'rxjs';

@Injectable()
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  public getDashboardDetail(id: string): Observable<unknown> {
    return this.http.get(`${this.config.api.dashboard}${dashboardApiRoutes.v2.detail(id)}`);
  }
}
```

## HTTP provider

The project registers `HttpClient` in `app.config.ts` with `provideHttpClient(withFetch())`.
`withFetch()` is the baseline for Angular applications with SSR or hybrid rendering.

## HTTP interceptors

Global HTTP interceptors live in `core/interceptors` and are registered with `withInterceptors`.

Current baseline:

- `correlation-id.interceptor.ts`: adds `X-Correlation-Id` to each request.
- `error.interceptor.ts`: central point for HTTP error interception and rethrowing.

The correlation id helps trace a request end-to-end across frontend, backend and microservices.
Backends, API gateways and distributed services can log the same value to reconstruct a call flow during debugging, support or incident analysis.

```http
X-Correlation-Id: 8f2b7c4e-1a2b-4c3d-9e0f-123456789abc
```

In real projects, the correlation id can also be generated or normalized by the backend, API gateway or observability platform.

Usage rules:

- keep only infrastructure and cross-cutting logic in interceptors;
- do not put business logic in interceptors;
- add global interceptors only when they apply to the whole application;
- evaluate feature-specific interceptors carefully.
