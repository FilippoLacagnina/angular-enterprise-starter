# Runtime Config API Usage

## Index

- [Ownership rule](#ownership-rule)
- [Dashboard example](#dashboard-example)
- [Versioning rule](#versioning-rule)

## Ownership rule

Runtime config owns service base URLs.
API route files own endpoint paths and API versions.

This keeps deployment configuration separate from API contracts.

## Dashboard example

Runtime config:

```yaml
api:
  dashboard:
    baseUrl: http://localhost:3000
```

API routes:

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
import { RuntimeConfigService } from '@core/runtime-config/runtime-config.service';
import { type Observable } from 'rxjs';

@Injectable()
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  public getDashboardDetail(id: string): Observable<unknown> {
    return this.http.get(
      `${this.runtimeConfig.value().api.dashboard.baseUrl}${dashboardApiRoutes.v2.detail(id)}`,
    );
  }
}
```

## Versioning rule

Do not put API versions in `values.yml` unless the version is truly deployment-owned.

The same microservice can expose different endpoints on different API versions:

```ts
export const createDashboardApiRoutes = (baseUrl: string) => ({
  widgets: `${baseUrl}/v1/dashboard/widgets`,
  analytics: `${baseUrl}/v2/dashboard/analytics`,
  reports: `${baseUrl}/v2/dashboard/reports`,
});
```
