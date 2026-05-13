import { type HttpInterceptorFn } from '@angular/common/http';

export const correlationIdInterceptor: HttpInterceptorFn = (request, next) => {
  const correlationId = crypto.randomUUID();

  return next(
    request.clone({
      setHeaders: {
        'X-Correlation-Id': correlationId,
      },
    }),
  );
};
