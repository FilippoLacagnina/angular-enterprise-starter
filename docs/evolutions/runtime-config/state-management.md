# Runtime Config State Usage

## Index

- [Signals](#signals)
- [httpResource](#httpresource)
- [Guidelines](#guidelines)

## Signals

`RuntimeConfigService` exposes a readonly signal:

```ts
readonly config = this.runtimeConfigService.config;
```

Use it when UI or services need reactive access to runtime configuration.

For imperative service methods, `value()` is usually simpler after application initialization has completed.

## httpResource

`httpResource` can compose URLs from runtime config:

```ts
import { httpResource } from '@angular/common/http';
import { inject } from '@angular/core';
import { dashboardApiRoutes } from '@core/api/dashboard-api.routes';
import { RuntimeConfigService } from '@core/runtime-config/runtime-config.service';

const runtimeConfig = inject(RuntimeConfigService);

export const dashboardSummaryResource = httpResource(() => {
  return `${runtimeConfig.value().api.dashboard.baseUrl}${dashboardApiRoutes.v2.summary}`;
});
```

## Guidelines

- Use runtime config only for deploy-time values.
- Keep feature state inside feature services or dedicated state utilities.
- Do not use runtime config as a generic global store.
- Do not put secrets in frontend runtime config.
