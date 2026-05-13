import { type AppConfig } from '@core/config/app-config.model';

export const environment = {
  appName: 'Angular Enterprise Starter',
  environment: 'test',
  api: {
    dashboard: 'https://test-dashboard-api.example.com',
  },
} satisfies AppConfig;
