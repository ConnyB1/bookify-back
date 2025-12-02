import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from '../entities/notification.entity';
import { Usuario } from '../entities/user.entity';
import { NotificationDto } from './notification.dto';
import { Expo } from 'expo-server-sdk';

@Injectable()
export class NotificationService {
  private expo = new Expo();

  constructor(
    @InjectRepository(Notificacion)
    private notificacionRepository: Repository<Notificacion>,
    @InjectRepository(Usuario)
    private userRepository: Repository<Usuario>,
  ) {}

  async sendPushNotification(toToken: string, title: string, body: string, data: any = {}) {
    console.log('🚀 [NotificationService] Enviando push notification...');
    console.log('   - Token:', toToken.substring(0, 30) + '...');
    console.log('   - Title:', title);
    console.log('   - Body:', body);
    
    if (!Expo.isExpoPushToken(toToken)) {
      console.error(`❌ Push token ${toToken} no es un token válido de Expo`);
      return;
    }

    const messages = [{
      to: toToken,
      sound: 'default' as const, 
      title: title,
      body: body,
      data: data,
    }];

    try {
      const chunks = this.expo.chunkPushNotifications(messages);
      console.log(`   - Enviando ${chunks.length} chunk(s)...`);
      
      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        console.log('   - Tickets recibidos:', JSON.stringify(ticketChunk));
      }
      
      console.log('✅ Notificación enviada exitosamente a', toToken.substring(0, 30) + '...');
    } catch (error) {
      console.error('❌ Error enviando push notification:', error);
      throw error;
    }
  }

  // ... (Mantén aquí tus otros métodos: getUserNotifications, markAsRead, etc.)
  // Puedes copiar y pegar tus métodos anteriores aquí abajo 👇
  
  async getUserNotifications(userId: number, onlyUnread = false): Promise<NotificationDto[]> {
    const where: any = { id_usuario_receptor: userId };
    if (onlyUnread) where.leida = false;

    const notificaciones = await this.notificacionRepository.find({
      where,
      relations: ['usuario_emisor', 'intercambio'],
      order: { fecha_creacion: 'DESC' },
      take: 50,
    });
    return notificaciones.map(n => this.formatNotification(n));
  }

  async markAsRead(notificationId: number, userId: number): Promise<NotificationDto> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { id_notificacion: notificationId, id_usuario_receptor: userId },
      relations: ['usuario_emisor', 'intercambio'],
    });
    if (!notificacion) throw new Error('Notificación no encontrada');
    notificacion.leida = true;
    return this.formatNotification(await this.notificacionRepository.save(notificacion));
  }

  async markAllAsRead(userId: number): Promise<{ count: number }> {
    const result = await this.notificacionRepository.update(
      { id_usuario_receptor: userId, leida: false },
      { leida: true },
    );
    return { count: result.affected || 0 };
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificacionRepository.count({
      where: { id_usuario_receptor: userId, leida: false },
    });
  }

  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { id_notificacion: notificationId, id_usuario_receptor: userId },
    });
    if (!notificacion) throw new Error('No encontrada');
    await this.notificacionRepository.remove(notificacion);
  }

  async testPushNotification(userId: number): Promise<{ success: boolean; message: string; token?: string }> {
    const user = await this.userRepository.findOne({
      where: { id_usuario: userId },
    });

    if (!user) {
      return {
        success: false,
        message: 'Usuario no encontrado',
      };
    }

    if (!user.push_token) {
      return {
        success: false,
        message: 'Usuario no tiene push_token registrado. El usuario debe iniciar sesión para registrar su token.',
      };
    }

    try {
      await this.sendPushNotification(
        user.push_token,
        '🧪 Notificación de Prueba',
        'Esta es una notificación de prueba desde Bookify',
        { type: 'test', timestamp: new Date().toISOString() }
      );

      return {
        success: true,
        message: 'Notificación de prueba enviada exitosamente',
        token: user.push_token.substring(0, 30) + '...',
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al enviar notificación: ${error.message}`,
        token: user.push_token.substring(0, 30) + '...',
      };
    }
  }

  private formatNotification(notificacion: Notificacion): NotificationDto {
    return {
      id_notificacion: notificacion.id_notificacion,
      tipo: notificacion.tipo,
      mensaje: notificacion.mensaje,
      leida: notificacion.leida,
      fecha_creacion: notificacion.fecha_creacion.toISOString(),
      usuario_emisor: notificacion.usuario_emisor ? {
        id_usuario: notificacion.usuario_emisor.id_usuario,
        nombre_usuario: notificacion.usuario_emisor.nombre_usuario,
        foto_perfil_url: notificacion.usuario_emisor.foto_perfil_url ?? undefined,
      } : null,
      intercambio: notificacion.intercambio ? {
        id_intercambio: notificacion.intercambio.id_intercambio,
        estado_propuesta: notificacion.intercambio.estado_propuesta,
      } : null,
    };
  }
}