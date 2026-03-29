import { Controller, Get, Post, Delete, Param, Query, Req, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { MarkReadDto } from './dto/mark-read.dto';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getNotifications(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationService.getUserNotifications(
      req.user.id,
      limit ? parseInt(limit.toString()) : 20,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.id, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  async deleteNotification(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.deleteNotification(req.user.id, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications' })
  async deleteAllNotifications(@Req() req: any) {
    return this.notificationService.deleteAllNotifications(req.user.id);
  }
}
