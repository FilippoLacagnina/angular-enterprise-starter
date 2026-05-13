# State Management

## Index

- [Guidelines](#guidelines)
- [Signals and RxJS](#signals-and-rxjs)
- [httpResource](#httpresource)
- [Future options](#future-options)

## Guidelines

The starter does not include a global state management library.
State should grow with the real complexity of the application.

Recommended usage:

- use Angular Signals for local synchronous UI state;
- use `computed` for derived state;
- use `effect` only for explicit and controlled side effects;
- use RxJS for async flows, HTTP, websockets, polling, debounce and complex streams;
- use feature services to orchestrate feature state and data calls;
- introduce global state only when the domain actually requires it.

## Signals and RxJS

```text
Signals for state.
RxJS for streams.
Feature services for orchestration.
Global store only when justified.
```

Examples:

- UI open/close state works well as a `signal`.
- HTTP calls can stay as `Observable`.
- A list loaded by HTTP can be converted to a signal only when the template benefits from it.
- A workflow shared by multiple features can justify global state.

## httpResource

`httpResource` can be used for read-oriented HTTP queries consumed directly by the UI and integrated with Signals.

```ts
import { httpResource } from '@angular/common/http';
import { inject } from '@angular/core';
import { dashboardApiRoutes } from '@core/api/dashboard-api.routes';
import { APP_CONFIG } from '@core/config/app-config.token';

const config = inject(APP_CONFIG);

export const dashboardSummaryResource = httpResource(() => {
  return `${config.api.dashboard}${dashboardApiRoutes.v2.summary}`;
});
```

Practical rule:

- use `HttpClient` + RxJS for workflows, commands, mutations, advanced retry logic and complex streams;
- use `httpResource` for read-oriented queries that should expose reactive UI state;
- do not automatically replace every `Observable` with `httpResource`.

## Future options

- Angular Signal Store
- NgRx
- another state manager, if required by the real project
