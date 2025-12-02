import { Controller, Get, Patch, Delete, Param, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationDto } from './notification.dto';

@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Obtener notificaciones del usuario
   * GET /api/notifications?userId=123&onlyUnread=true
   */
  @Get()
  async getNotifications(
    @Query('userId') userId: string,
    @Query('onlyUnread') onlyUnread?: string,
  ): Promise<{
    success: boolean;
    data: NotificationDto[];
  }> {
    const notifications = await this.notificationService.getUserNotifications(
      Number(userId),
      onlyUnread === 'true',
    );
    
    return {
      success: true,
      data: notifications,
    };
  }

  /**
   * Obtener contador de no leídas
   * GET /api/notifications/unread-count?userId=123
   */
  @Get('unread-count')
  async getUnreadCount(@Query('userId') userId: string): Promise<{
    success: boolean;
    count: number;
  }> {
    const count = await this.notificationService.getUnreadCount(Number(userId));
    
    return {
      success: true,
      count,
    };
  }

  /**
   * Marcar notificación como leída
   * PATCH /api/notifications/:id/read?userId=123
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<{
    success: boolean;
    data: NotificationDto;
  }> {
    const notification = await this.notificationService.markAsRead(
      Number(id),
      Number(userId),
    );
    
    return {
      success: true,
      data: notification,
    };
  }

  /**
   * Marcar todas como leídas
   * PATCH /api/notifications/mark-all-read?userId=123
   */
  @Patch('mark-all-read')
  async markAllAsRead(@Query('userId') userId: string): Promise<{
    success: boolean;
    count: number;
  }> {
    const result = await this.notificationService.markAllAsRead(Number(userId));
    
    return {
      success: true,
      count: result.count,
    };
  }

  /**
   * Eliminar una notificación específica
   * DELETE /api/notifications/:id?userId=123
   */
  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.notificationService.deleteNotification(
      Number(id),
      Number(userId),
    );
    
    return {
      success: true,
      message: 'Notificación eliminada correctamente',
    };
  }

  /**
   * Endpoint de prueba para enviar notificación push
   * GET /api/notifications/test-push?userId=123
   */
  @Get('test-push')
  async testPushNotification(@Query('userId') userId: string): Promise<{
    success: boolean;
    message: string;
    token?: string;
  }> {
    try {
      const result = await this.notificationService.testPushNotification(Number(userId));
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al enviar notificación de prueba',
      };
    }
  }
}
