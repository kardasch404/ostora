import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expected = process.env.INTERNAL_SERVICE_SECRET;

    if (!expected) {
      return true;
    }

    const provided = request.headers['x-internal-secret'];
    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Missing or invalid internal secret');
    }

    return true;
  }
}
