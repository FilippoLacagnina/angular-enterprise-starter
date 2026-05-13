import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAppConfig } from '@core/config/app-config.provider';
import { correlationIdInterceptor } from '@core/interceptors/correlation-id.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppConfig(environment),
    provideHttpClient(withFetch(), withInterceptors([correlationIdInterceptor, errorInterceptor])),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
  ],
};
