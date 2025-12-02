import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('punto_encuentro')
export class PuntoEncuentro {
  @PrimaryGeneratedColumn({ name: 'id_punto_encuentro' })
  id_punto_encuentro: number;

  @Column({ length: 255 })
  nombre: string;

  @Column({ type: 'float' })
  latitud: number;

  @Column({ type: 'float' })
  longitud: number;
}
