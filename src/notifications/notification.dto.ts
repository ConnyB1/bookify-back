import { TipoNotificacion } from '../entities/notification.entity';

export class NotificationDto {
  id_notificacion: number;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
  usuario_emisor?: {
    id_usuario: number;
    nombre_usuario: string;
    foto_perfil_url?: string;
  } | null;
  intercambio?: {
    id_intercambio: number;
    estado_propuesta: string;
  } | null;
}
