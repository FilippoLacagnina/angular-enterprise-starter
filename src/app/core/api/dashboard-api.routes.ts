export const dashboardApiRoutes = {
  v1: {
    summary: '/v1/dashboard/summary',
  },
  v2: {
    summary: '/v2/dashboard/summary',
    detail: (id: string) => `/v2/dashboard/${id}`,
  },
} as const;
