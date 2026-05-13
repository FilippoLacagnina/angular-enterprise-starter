import { type Provider } from '@angular/core';

import { type AppConfig } from './app-config.model';
import { APP_CONFIG } from './app-config.token';

export const provideAppConfig = (config: AppConfig): Provider => ({
  provide: APP_CONFIG,
  useValue: config,
});
