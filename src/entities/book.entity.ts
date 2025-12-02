import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './user.entity';
import { Genero } from './genero.entity';
import { LibroImagen } from './libro-imagen.entity';

export enum EstadoLibro {
  AVAILABLE = 'available',
  EXCHANGE_PENDING = 'exchange_pending',
  UNAVAILABLE = 'unavailable',
  EXCHANGED = 'exchanged',
}

@Entity('libro') 
export class Libro {
  @PrimaryGeneratedColumn({ name: 'id_libro' })
  id_libro: number;

  @Column({ name: 'id_propietario' })
  id_propietario: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.libros)
  @JoinColumn({ name: 'id_propietario', referencedColumnName: 'id_usuario' })
  propietario: Usuario;

  @Column({ length: 255 })
  titulo: string;

  @Column({ length: 255 })
  autor: string;

  @Column({ type: 'enum', enum: EstadoLibro, default: EstadoLibro.AVAILABLE })
  estado: EstadoLibro;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToMany(() => Genero, (genero) => genero.libros, { cascade: true })
  @JoinTable({
    name: 'libro_genero',
    joinColumn: { name: 'id_libro', referencedColumnName: 'id_libro' },
    inverseJoinColumn: { name: 'id_genero', referencedColumnName: 'id_genero' },
  })
  generos: Genero[];

  @OneToMany(() => LibroImagen, (imagen) => imagen.libro, { cascade: true })
  imagenes: LibroImagen[];
}
