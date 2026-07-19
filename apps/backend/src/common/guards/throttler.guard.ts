import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { ThrottlerGuard as NestThrottlerGuard, ThrottlerModuleOptions, getOptionsToken, getStorageToken, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ThrottlerGuard extends NestThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) options: ThrottlerModuleOptions,
    @Inject(getStorageToken()) storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const skipThrottle = this.reflector.getAllAndOverride<boolean>('skipThrottle', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipThrottle) {
      return Promise.resolve(true);
    }

    return super.canActivate(context);
  }
}
