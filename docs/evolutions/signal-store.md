# Signal Store Evolution

## Index

- [Goal](#goal)
- [When to use it](#when-to-use-it)
- [When not to use it](#when-not-to-use-it)
- [Installed package](#installed-package)
- [Architecture](#architecture)
- [Dashboard example](#dashboard-example)
- [SignalStore building blocks](#signalstore-building-blocks)
- [RxJS methods](#rxjs-methods)
- [State scope](#state-scope)
- [Root-provided store](#root-provided-store)
- [Recommended conventions](#recommended-conventions)
- [Quality checks](#quality-checks)
- [References](#references)

## Goal

This evolution adds an optional NgRx SignalStore baseline for applications that need a more structured state management convention while staying aligned with Angular Signals.

The goal is not to replace Angular Signals everywhere.
The goal is to provide a consistent pattern for feature state when plain component signals or service signals are no longer enough.

This document owns state architecture and SignalStore conventions. For generated options, preview,
apply, repeatability and troubleshooting, see the
[SignalStore CLI Installer](../evolution-cli/signal-store.md).

## When to use it

Use SignalStore when a feature owns structured state such as:

- `data`
- `selectedId`
- `isLoading`
- `errorMessage`
- filters
- pagination
- derived state
- explicit state transitions

SignalStore is useful when multiple components in the same feature need to share state and when the team wants a consistent state shape across features.

## When not to use it

Do not use SignalStore by default for every state value.

Prefer Angular primitives for simple cases:

| Scenario                        | Recommended approach                |
| ------------------------------- | ----------------------------------- |
| Component-local UI state        | Angular `signal()`                  |
| Simple shared UI state          | Angular service + signals           |
| Feature loading/error/data      | NgRx SignalStore                    |
| Cross-feature lightweight state | service signals or root SignalStore |
| Complex event-driven workflows  | consider classic NgRx Store         |

Examples that usually do not need SignalStore:

- sidebar open/closed
- active tab
- small local filter
- modal visibility
- one-off component state

## Installed package

This branch installs:

```text
@ngrx/signals
```

The branch intentionally does not install:

```text
@ngrx/store
@ngrx/effects
@ngrx/store-devtools
```

Classic NgRx Store is a different architectural choice and should be introduced through a separate evolution branch if needed.

## Architecture

This evolution follows a feature-first state strategy.

Recommended structure:

```text
src/app/features/<feature-name>/state/
  <feature-name>.state.ts
  <feature-name>.store.ts
```

Use `core/state` only for state that is truly cross-feature or application-wide.

```text
src/app/core/state/
  app.state.ts
  app.store.ts
```

Avoid moving feature state to `core` just because it is shared by multiple components inside the same feature.

## Dashboard example

The dashboard feature includes a minimal feature-scoped store:

```text
src/app/features/dashboard/state/
  dashboard.state.ts
  dashboard.store.ts
```

The store models a small state shape:

```ts
export interface DashboardState {
  readonly selectedWidgetId: string | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}
```

The route provides the store at feature route level:

```ts
export const dashboardRoutes: Routes = [
  {
    path: '',
    providers: [DashboardStore],
    loadComponent: () => import('./views/dashboard/dashboard.component').then(...),
  },
];
```

This keeps the store lifecycle bound to the feature route instead of making it global by default.

The component injects the store without changing the UI template:

```ts
export class DashboardComponent {
  protected readonly dashboardStore = inject(DashboardStore);
}
```

This keeps the example visible in code while avoiding opinionated UI content.

## SignalStore building blocks

SignalStore is composed through small features.
The baseline example uses:

```ts
export const DashboardStore = signalStore(
  withState(initialDashboardState),
  withComputed(({ errorMessage, isLoading, selectedWidgetId }) => ({
    hasSelectedWidget: () => selectedWidgetId() !== null,
    isReady: () => !isLoading() && errorMessage() === null,
  })),
  withMethods((store) => ({
    selectWidget(widgetId: string): void {
      patchState(store, { selectedWidgetId: widgetId });
    },
  })),
);
```

### withState

`withState` defines the store state shape and initial values.

Example:

```ts
export interface DashboardState {
  readonly selectedWidgetId: string | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

export const initialDashboardState: DashboardState = {
  selectedWidgetId: null,
  isLoading: false,
  errorMessage: null,
};
```

Then:

```ts
withState(initialDashboardState);
```

Each state property becomes a signal exposed by the store.

Example usage:

```ts
const selectedWidgetId = dashboardStore.selectedWidgetId();
const isLoading = dashboardStore.isLoading();
```

In a template:

```html
@if (dashboardStore.isLoading()) {
<p>Loading</p>
}
```

### withComputed

`withComputed` defines derived state.

Use it when a value can be calculated from existing state instead of being stored separately.

Example:

```ts
withComputed(({ errorMessage, isLoading, selectedWidgetId }) => ({
  hasSelectedWidget: () => selectedWidgetId() !== null,
  isReady: () => !isLoading() && errorMessage() === null,
}));
```

This exposes computed signals:

```ts
dashboardStore.hasSelectedWidget();
dashboardStore.isReady();
```

Practical rule:

- store source values in `withState`
- derive values with `withComputed`
- avoid duplicating derived values inside state

### withMethods

`withMethods` defines the public API used to change the store.

Components should call store methods instead of mutating state directly.

Example:

```ts
withMethods((store) => ({
  selectWidget(widgetId: string): void {
    patchState(store, { selectedWidgetId: widgetId });
  },
  clearSelectedWidget(): void {
    patchState(store, { selectedWidgetId: null });
  },
}));
```

Component usage:

```ts
export class DashboardComponent {
  protected readonly dashboardStore = inject(DashboardStore);

  protected selectWidget(widgetId: string): void {
    this.dashboardStore.selectWidget(widgetId);
  }
}
```

Template usage:

```html
<button
  type="button"
  (click)="dashboardStore.selectWidget('summary')"
>
  Select widget
</button>
```

### patchState

`patchState` updates one or more state slices.

Object patch:

```ts
patchState(store, { isLoading: true });
```

Updater function:

```ts
patchState(store, (state) => ({
  selectedWidgetId: state.selectedWidgetId === widgetId ? null : widgetId,
}));
```

Use `patchState` inside store methods to keep state transitions explicit and centralized.

## RxJS methods

SignalStore can also expose RxJS-powered methods for asynchronous workflows.

Use this pattern when state transitions depend on streams, debounce, cancellation, retry logic or HTTP requests.

Example search flow:

```ts
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { debounceTime, distinctUntilChanged, pipe, switchMap, tap } from 'rxjs';

export const BooksStore = signalStore(
  withState({
    books: [] as Book[],
    isLoading: false,
    errorMessage: null as string | null,
  }),
  withMethods((store, booksService = inject(BooksService)) => ({
    loadByQuery: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => patchState(store, { isLoading: true, errorMessage: null })),
        switchMap((query) => {
          return booksService.getByQuery(query).pipe(
            tapResponse({
              next: (books) => patchState(store, { books }),
              error: () =>
                patchState(store, {
                  errorMessage: 'Unable to load books.',
                }),
              finalize: () => patchState(store, { isLoading: false }),
            }),
          );
        }),
      ),
    ),
  })),
);
```

What this method does:

- `rxMethod<string>` creates a store method that receives a string query.
- `debounceTime(300)` waits before calling the API, useful for search inputs.
- `distinctUntilChanged()` skips duplicated queries.
- `tap()` marks the store as loading before the request starts.
- `switchMap()` cancels the previous request when a newer query arrives.
- `tapResponse()` centralizes success, error and finalize handling.
- `patchState()` updates the store after each lifecycle step.

Component usage:

```ts
export class BooksComponent {
  protected readonly booksStore = inject(BooksStore);

  protected search(query: string): void {
    this.booksStore.loadByQuery(query);
  }
}
```

Template usage:

```html
<input
  type="search"
  #query
  (input)="booksStore.loadByQuery(query.value)"
/>
```

Recommended usage:

- use `rxMethod` for search, autocomplete, polling, websocket-like streams and cancellable HTTP workflows;
- keep simple synchronous state transitions in regular `withMethods`;
- avoid putting every HTTP call in the store by default;
- keep API details inside feature services when possible.

## State scope

Preferred scope order:

1. Component-local signal.
2. Feature service with signals.
3. Feature-scoped SignalStore.
4. Root SignalStore.
5. Classic NgRx Store for complex event-driven domains.

Start as small as possible and move up only when the state complexity justifies it.

## Root-provided store

SignalStore can also be registered in the root injector:

```ts
export const AppStore = signalStore(
  { providedIn: 'root' },
  withState({
    currentUserId: null as string | null,
    isSidebarOpen: false,
  }),
  withMethods((store) => ({
    setCurrentUser(userId: string | null): void {
      patchState(store, { currentUserId: userId });
    },
    toggleSidebar(): void {
      patchState(store, (state) => ({ isSidebarOpen: !state.isSidebarOpen }));
    },
  })),
);
```

When a store is provided with `{ providedIn: 'root' }`, it is registered with the root injector and becomes available everywhere in the application.
This is useful for global state because Angular creates one shared store instance for the whole application.

Use root-provided stores for state that is truly application-wide, such as:

- authenticated user identity
- global layout preferences
- tenant or organization context
- feature flags loaded once
- state shared by multiple unrelated features

Avoid root-provided stores for state that belongs to a single feature.
Feature state should stay feature-scoped whenever possible.

## Recommended conventions

- Keep feature stores inside `features/<feature>/state`.
- Keep state interfaces in `*.state.ts`.
- Keep SignalStore definitions in `*.store.ts`.
- Prefer readonly state interfaces.
- Model explicit methods for state transitions.
- Keep computed values inside the store when they depend on store state.
- Do not inject stores into unrelated features.
- Do not use a root store as a shortcut for feature communication.
- Keep HTTP orchestration in services unless the store needs to coordinate loading/error/data transitions.

## Quality checks

After changing SignalStore code, run:

```bash
npm run format:check
npm run lint
npm run test
npm run build
```

## References

- [NgRx Signal Store documentation](https://ngrx.io/guide/signals/signal-store)
- [NgRx Signals package](https://www.npmjs.com/package/@ngrx/signals)
