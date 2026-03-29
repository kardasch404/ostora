import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from './ws-auth.guard';
import { NotificationService } from '../notification/notification.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

  constructor(private notificationService: NotificationService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // JWT validation happens in WsAuthGuard middleware
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Validate token and extract user
      const user = await this.validateToken(token);
      if (!user) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      client.userId = user.id;
      client.user = user;

      // Join user-specific room
      const room = `user:${user.id}`;
      await client.join(room);

      // Track connected socket
      if (!this.connectedUsers.has(user.id)) {
        this.connectedUsers.set(user.id, new Set());
      }
      this.connectedUsers.get(user.id)!.add(client.id);

      this.logger.log(`Client connected: ${client.id} (User: ${user.id})`);

      // Send unread count on connection
      const unreadCount = await this.notificationService.getUnreadCount(user.id);
      client.emit('unread_count', { count: unreadCount });

      // Send recent notifications
      const recentNotifications = await this.notificationService.getRecentNotifications(user.id, 10);
      client.emit('recent_notifications', recentNotifications);

    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(client.userId);
        }
      }
      this.logger.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
    }
  }

  @SubscribeMessage('mark_as_read')
  @UseGuards(WsAuthGuard)
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      await this.notificationService.markAsRead(client.userId!, data.notificationId);
      
      const unreadCount = await this.notificationService.getUnreadCount(client.userId!);
      client.emit('unread_count', { count: unreadCount });

      return { success: true };
    } catch (error) {
      this.logger.error(`Mark as read error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('mark_all_as_read')
  @UseGuards(WsAuthGuard)
  async handleMarkAllAsRead(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      await this.notificationService.markAllAsRead(client.userId!);
      
      client.emit('unread_count', { count: 0 });

      return { success: true };
    } catch (error) {
      this.logger.error(`Mark all as read error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('get_notifications')
  @UseGuards(WsAuthGuard)
  async handleGetNotifications(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { limit?: number; offset?: number },
  ) {
    try {
      const notifications = await this.notificationService.getUserNotifications(
        client.userId!,
        data.limit || 20,
        data.offset || 0,
      );

      return { success: true, data: notifications };
    } catch (error) {
      this.logger.error(`Get notifications error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Send notification to specific user
  async sendToUser(userId: string, event: string, data: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit(event, data);
    this.logger.log(`Sent ${event} to user ${userId}`);
  }

  // Send notification to multiple users
  async sendToUsers(userIds: string[], event: string, data: any) {
    for (const userId of userIds) {
      await this.sendToUser(userId, event, data);
    }
  }

  // Broadcast to all connected clients
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasted ${event} to all users`);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  private async validateToken(token: string): Promise<{ id: string; email: string } | null> {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace('Bearer ', '');
      
      // TODO: Implement actual JWT validation
      // For now, return mock user for development
      // In production, validate with auth service
      
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
