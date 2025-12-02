import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from './user.entity';
import { Intercambio } from './exchange.entity';

export enum TipoNotificacion {
  SOLICITUD_INTERCAMBIO = 'solicitud_intercambio',
  INTERCAMBIO_ACEPTADO = 'intercambio_aceptado',
  INTERCAMBIO_RECHAZADO = 'intercambio_rechazado',
  INTERCAMBIO_CANCELADO = 'intercambio_cancelado',
  INTERCAMBIO_COMPLETADO = 'intercambio_completado',
  MENSAJE_NUEVO = 'mensaje_nuevo',
}

@Entity('notificacion')
export class Notificacion {
  @PrimaryGeneratedColumn({ name: 'id_notificacion' })
  id_notificacion: number;

  @Column({ name: 'id_usuario_receptor' })
  id_usuario_receptor: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_receptor' })
  usuario_receptor: Usuario;

  @Column({ name: 'id_usuario_emisor', nullable: true })
  id_usuario_emisor: number | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario_emisor' })
  usuario_emisor: Usuario | null;

  @Column({ name: 'id_intercambio', nullable: true })
  id_intercambio: number | null;

  @ManyToOne(() => Intercambio, { nullable: true })
  @JoinColumn({ name: 'id_intercambio' })
  intercambio: Intercambio | null;

  @Column({
    type: 'enum',
    enum: TipoNotificacion,
    name: 'tipo',
  })
  tipo: TipoNotificacion;

  @Column({ type: 'varchar', length: 500, name: 'mensaje' })
  mensaje: string;

  @Column({ type: 'boolean', name: 'leida', default: false })
  leida: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'fecha_creacion' })
  fecha_creacion: Date;
}
