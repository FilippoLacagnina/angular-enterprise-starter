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
