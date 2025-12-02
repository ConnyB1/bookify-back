export interface CreateBookDto {
  titulo: string;
  autor: string;
  descripcion?: string;
  generos?: string[];
  imagenes?: string[];
  id_usuario: number;
}

export interface UpdateBookDto {
  titulo?: string;
  autor?: string;
  descripcion?: string;
  generos?: string[];
  imagenes?: string[];
}