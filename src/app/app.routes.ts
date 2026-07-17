import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((routes) => routes.dashboardRoutes),
  },
  {
    path: 'ai-summary',
    loadChildren: () =>
      import('./features/ai-summary/ai-summary.routes').then((routes) => routes.aiSummaryRoutes),
  },
];
