import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Injectable()
@ApiBearerAuth('token') // Adds Bearer auth documentation to all guarded endpoints
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Add custom authentication logic here
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Customize error responses
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException({
          statusCode: 401,
          message: 'Invalid or expired token',
          error: 'Unauthorized',
        })
      );
    }
    return user;
  }
}
