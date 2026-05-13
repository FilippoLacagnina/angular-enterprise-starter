import { type AppConfig } from '@core/config/app-config.model';

export const environment = {
  appName: 'Angular Enterprise Starter',
  environment: 'local',
  api: {
    dashboard: 'http://localhost:3000',
  },
} satisfies AppConfig;
