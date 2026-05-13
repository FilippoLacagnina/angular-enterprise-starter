import { type AppConfig } from '@core/config/app-config.model';

export const environment = {
  appName: 'Angular Enterprise Starter',
  environment: 'prod',
  api: {
    dashboard: 'https://dashboard-api.example.com',
  },
} satisfies AppConfig;
