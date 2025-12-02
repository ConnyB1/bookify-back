import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Libro } from './book.entity';

@Entity('libro_imagen')
export class LibroImagen {
  @PrimaryGeneratedColumn({ name: 'id_imagen' })
  id_imagen: number;

  @Column({ name: 'id_libro' })
  id_libro: number;

  @ManyToOne(() => Libro, (libro) => libro.imagenes)
  @JoinColumn({ name: 'id_libro', referencedColumnName: 'id_libro' })
  libro: Libro;

  @Column({ name: 'url_imagen', length: 255 })
  url_imagen: string;
}