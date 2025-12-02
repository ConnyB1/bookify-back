import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Intercambio } from './exchange.entity';
import { Usuario } from './user.entity';

@Entity('calificacion')
export class Calificacion {
  @PrimaryColumn({ name: 'id_intercambio' })
  id_intercambio: number;

  @ManyToOne(() => Intercambio)
  @JoinColumn({ name: 'id_intercambio' })
  intercambio: Intercambio;

  @Column({ name: 'id_usuario_calificador' })
  id_usuario_calificador: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_calificador' })
  usuario_calificador: Usuario;

  @Column({ name: 'id_usuario_calificado' })
  id_usuario_calificado: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_calificado' })
  usuario_calificado: Usuario;

  @Column({ type: 'integer' })
  estrellas: number;

  @Column({ type: 'text', nullable: true })
  reseña: string | null;
}
