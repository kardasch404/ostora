import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const token = client.handshake?.auth?.token || client.handshake?.headers?.authorization;

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      // Validate JWT token
      const user = await this.validateToken(token);
      
      if (!user) {
        throw new WsException('Unauthorized: Invalid token');
      }

      // Attach user to client
      client.userId = user.id;
      client.user = user;

      return true;
    } catch (error) {
      this.logger.error(`WS Auth error: ${error.message}`);
      throw new WsException('Unauthorized');
    }
  }

  private async validateToken(token: string): Promise<{ id: string; email: string } | null> {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace('Bearer ', '');

      // TODO: Implement actual JWT validation
      // Call auth service or validate locally
      // For now, mock validation for development
      
      if (!cleanToken || cleanToken.length < 10) {
        return null;
      }

      return {
        id: 'user-123',
        email: 'user@ostora.com',
      };
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`);
      return null;
    }
  }
}
