import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth } from '@nestjs/swagger';

@Injectable()
@ApiBearerAuth('refresh-token') // Documents the special refresh token requirement
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check for public routes (if needed)
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Add refresh token specific validation
    const request = context.switchToHttp().getRequest();
    if (!request.headers['authorization']) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Refresh token is required',
        error: 'Unauthorized',
      });
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Custom error handling for refresh token specific cases
    if (err || !user || !user.refreshToken) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
        error: 'Unauthorized',
      });
    }

    // Attach refresh token to user object for service layer
    return {
      ...user,
      refreshToken: this.extractTokenFromHeader(user.refreshToken),
    };
  }

  private extractTokenFromHeader(token: string): string {
    return token?.replace('Bearer ', '') ?? null;
  }
}
