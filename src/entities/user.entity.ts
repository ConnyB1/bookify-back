import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Libro } from './book.entity';
import { Intercambio } from './exchange.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ name: 'nombre_usuario', unique: true })
  nombre_usuario: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column({ nullable: true, type: 'varchar' })
  genero: string | null;

  @Column({ name: 'foto_perfil_url', nullable: true, type: 'varchar' })
  foto_perfil_url: string | null;

  // ========================================
  // Campos de Ubicación (Sistema de Proximidad)
  // ========================================
  
  @Column({ type: 'float', nullable: true })
  latitud: number | null;
  
  @Column({ type: 'float', nullable: true })
  longitud: number | null;
  
  @Column({ name: 'radio_busqueda_km', type: 'integer', default: 10 })
  radio_busqueda_km: number;
  
  @Column({ type: 'varchar', length: 100, nullable: true })
  ciudad: string | null;
  
  @Column({ name: 'ubicacion_actualizada_at', type: 'timestamptz', nullable: true })
  ubicacion_actualizada_at: Date | null;

  @Column({ name: 'push_token', nullable: true, type: 'text' })
  push_token: string | null;

  @Column({ name: 'genero_preferencias', type: 'integer', array: true, nullable: true })
  genero_preferencias: number[] | null;

  // ✅ Relación con los libros que posee el usuario
  @OneToMany(() => Libro, (libro) => libro.propietario)
  libros: Libro[];

  // ✅ Relación con los intercambios donde el usuario es el solicitante
  @OneToMany(() => Intercambio, (intercambio) => intercambio.usuario_solicitante)
  intercambios_solicitados: Intercambio[];

  // ✅ Relación con los intercambios donde el usuario es el receptor
  @OneToMany(() => Intercambio, (intercambio) => intercambio.usuario_solicitante_receptor)
  intercambios_recibidos: Intercambio[];
}

