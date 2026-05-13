import { type AppEnvironment } from './app-environment.type';

export interface AppApiEndpoints {
  dashboard: string;
}

export interface AppConfig {
  appName: string;
  environment: AppEnvironment;
  api: AppApiEndpoints;
}
