import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Libro } from './book.entity';

@Entity('genero')
export class Genero {
  @PrimaryGeneratedColumn({ name: 'id_genero' })
  id_genero: number;

  @Column({ unique: true })
  nombre: string;

  @ManyToMany(() => Libro, (libro) => libro.generos)
  libros: Libro[];
}
