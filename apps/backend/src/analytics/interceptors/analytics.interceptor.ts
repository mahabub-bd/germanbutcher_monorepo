import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AnalyticsService } from '../analytics.service';
import { SKIP_ANALYTICS_KEY } from 'src/common/decorators/skip-analytics.decorator';
import { getClientIp } from 'src/common/utils/ip-extractor.util';

@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const startTime = Date.now();

    // Check if analytics should be skipped for this route
    const skipAnalytics = this.reflector.getAllAndOverride<boolean>(
      SKIP_ANALYTICS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipAnalytics) {
      return next.handle();
    }

    // Define allowed analytics endpoints
    const allowedRoutes = [
      '/products',
      '/orders',
      '/order',
      '/cart',
      '/wishlist',
      '/categories',
      '/brands',
      '/brand',
      '/auth',
    ];

    const routePath = req.route?.path || req.originalUrl;

    // Only track if route matches one of the allowed paths
    const shouldTrack = allowedRoutes.some((route) =>
      routePath?.includes(route),
    );

    if (!shouldTrack) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          const userId = req.user?.userId;
          const ipAddress = getClientIp(req);
          const userAgent = req.headers['user-agent'];

          this.analyticsService
            .logRequest({
              endpoint: routePath,
              method: req.method,
              statusCode: response.statusCode,
              responseTime,
              userId,
              ipAddress,
              userAgent,
              isAuthenticated: !!req.user,
            })
            .catch((error) => {
              // Silent fail - don't let analytics break the API
              console.error(`Failed to log analytics: ${error.message}`);
            });
        },
        error: (error) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          const userId = req.user?.userId;
          const ipAddress = getClientIp(req);
          const userAgent = req.headers['user-agent'];

          this.analyticsService
            .logRequest({
              endpoint: routePath,
              method: req.method,
              statusCode: error.status || 500,
              responseTime,
              userId,
              ipAddress,
              userAgent,
              isAuthenticated: !!req.user,
            })
            .catch((err) => {
              console.error(`Failed to log analytics: ${err.message}`);
            });
        },
      }),
    );
  }
}
