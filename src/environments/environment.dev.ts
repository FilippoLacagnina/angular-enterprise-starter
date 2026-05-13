import { type AppConfig } from '@core/config/app-config.model';

export const environment = {
  appName: 'Angular Enterprise Starter',
  environment: 'dev',
  api: {
    dashboard: 'https://dev-dashboard-api.example.com',
  },
} satisfies AppConfig;
