import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/user.entity';
import { UpdateGenrePreferencesDto, GenrePreferencesResponseDto } from './dto/genre-preferences.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Usuario)
    private userRepository: Repository<Usuario>,
  ) {}
  
  async updatePushToken(userId: number, token: string): Promise<void> {
    await this.userRepository.update(
      { id_usuario: userId }, 
      { push_token: token }   
    );
  }

  async updateGenrePreferences(userId: number, dto: UpdateGenrePreferencesDto): Promise<GenrePreferencesResponseDto> {
    await this.userRepository.update(
      { id_usuario: userId },
      { genero_preferencias: dto.genreIds }
    );
    
    return { genreIds: dto.genreIds };
  }

  async getGenrePreferences(userId: number): Promise<GenrePreferencesResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id_usuario: userId },
      select: ['genero_preferencias'],
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return { genreIds: user.genero_preferencias || [] };
  }

  async getUserProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id_usuario: userId },
      relations: ['libros', 'libros.imagenes', 'libros.generos'],
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id_usuario: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      correo_electronico: user.email,
      foto_perfil_url: user.foto_perfil_url,
      libros: user.libros?.map((libro) => ({
        id_libro: libro.id_libro,
        titulo: libro.titulo,
        autor: libro.autor,
        estado: libro.estado,
        imagenes: libro.imagenes?.map((img) => ({
          url_imagen: img.url_imagen,
        })),
        generos: libro.generos?.map((gen) => ({
          nombre: gen.nombre,
        })),
      })),
    };
  }
}
