import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './user.entity';
import { Intercambio } from './exchange.entity';

@Entity('calificacion')
export class Calificacion {
  @PrimaryGeneratedColumn({ name: 'id_calificacion' })
  id_calificacion: number;

  @Column({ name: 'id_intercambio' })
  id_intercambio: number;

  @Column({ name: 'id_usuario_calificador' })
  id_usuario_calificador: number;

  @Column({ name: 'id_usuario_calificado' })
  id_usuario_calificado: number;

  @Column({ name: 'estrellas' })
  estrellas: number;

  @Column({ name: 'reseña', type: 'text', nullable: true })
  resena?: string;

  @Column({ 
    name: 'fecha_calificacion', 
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
    insert: false  // Don't include in INSERT statements
  })
  fecha_calificacion?: Date;

  // Relaciones
  @ManyToOne(() => Intercambio)
  @JoinColumn({ name: 'id_intercambio' })
  intercambio: Intercambio;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_calificador' })
  usuario_calificador: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_calificado' })
  usuario_calificado: Usuario;
}
