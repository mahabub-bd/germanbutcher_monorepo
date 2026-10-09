import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { HTTP_CACHE_METADATA_KEY } from 'src/common/decorators/http-cache.decorator';

/** Sets Cache-Control on responses from handlers marked with @HttpCache(n). */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const seconds = this.reflector.getAllAndOverride<number | undefined>(
      HTTP_CACHE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!seconds) return next.handle();

    return next.handle().pipe(
      map((data) => {
        const res = context.switchToHttp().getResponse();
        res.setHeader(
          'Cache-Control',
          `public, max-age=${seconds}, stale-while-revalidate=30`,
        );
        return data;
      }),
    );
  }
}
