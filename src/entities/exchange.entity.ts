import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Libro } from './book.entity';
import { Usuario } from './user.entity';
import { PuntoEncuentro } from './location.entity';

export enum EstadoPropuesta {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
  COMPLETED = 'completed',
}

@Entity('intercambio')
export class Intercambio {
  @PrimaryGeneratedColumn({ name: 'id_intercambio' })
  id_intercambio: number;

  @Column({ name: 'id_libro_solicitado' })
  id_libro_solicitado_fk: number;

  @ManyToOne(() => Libro)
  @JoinColumn({ name: 'id_libro_solicitado' })
  libro_solicitado: Libro;

  @Column({ name: 'id_libro_ofertado', nullable: true })
  id_libro_ofertado_fk: number | null;

  @ManyToOne(() => Libro, { nullable: true })
  @JoinColumn({ name: 'id_libro_ofertado' })
  libro_ofertado: Libro;

  @Column({ name: 'id_usuario_solicitante' })
  id_usuario_solicitante_fk: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.intercambios_solicitados)
  @JoinColumn({ name: 'id_usuario_solicitante' })
  usuario_solicitante: Usuario;

  @Column({ name: 'id_usuario_solicitante_receptor' })
  id_usuario_solicitante_receptor_fk: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.intercambios_recibidos)
  @JoinColumn({ name: 'id_usuario_solicitante_receptor' })
  usuario_solicitante_receptor: Usuario;

  @Column({ name: 'id_punto_encuentro', nullable: true })
  id_punto_encuentro_fk: number | null;

  @ManyToOne(() => PuntoEncuentro, { nullable: true })
  @JoinColumn({ name: 'id_punto_encuentro' })
  punto_encuentro: PuntoEncuentro;

  @Column({
    type: 'enum',
    enum: EstadoPropuesta,
    name: 'estado_propuesta',
    default: EstadoPropuesta.PENDING,
  })
  estado_propuesta: EstadoPropuesta;

  @Column({ type: 'timestamptz', name: 'fecha_propuesta', default: () => 'NOW()' })
  fecha_propuesta: Date;

  @Column({ type: 'timestamptz', name: 'fecha_acuerdo', nullable: true })
  fecha_acuerdo: Date;

  // Confirmaciones de ambos usuarios
  @Column({ name: 'confirmacion_solicitante', default: false })
  confirmacion_solicitante: boolean;

  @Column({ name: 'confirmacion_receptor', default: false })
  confirmacion_receptor: boolean;

  // Ubicación de encuentro propuesta (sin FK, datos directos)
  @Column({ type: 'decimal', precision: 10, scale: 7, name: 'ubicacion_encuentro_lat', nullable: true })
  ubicacion_encuentro_lat: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, name: 'ubicacion_encuentro_lng', nullable: true })
  ubicacion_encuentro_lng: number | null;

  @Column({ type: 'text', name: 'ubicacion_encuentro_nombre', nullable: true })
  ubicacion_encuentro_nombre: string | null;

  @Column({ type: 'text', name: 'ubicacion_encuentro_direccion', nullable: true })
  ubicacion_encuentro_direccion: string | null;

  @Column({ type: 'text', name: 'ubicacion_encuentro_place_id', nullable: true })
  ubicacion_encuentro_place_id: string | null;
}

