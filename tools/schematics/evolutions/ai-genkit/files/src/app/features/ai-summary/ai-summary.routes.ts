import { type Routes } from '@angular/router';

export const aiSummaryRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/ai-summary/ai-summary.component').then(
        (component) => component.AiSummaryComponent,
      ),
  },
];
