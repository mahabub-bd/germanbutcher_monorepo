import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but never rejects: resolves req.user when a valid
 * Bearer token is present, otherwise lets the request through anonymously.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Anonymous requests are fine - just continue without a user
    return user || null;
  }
}
