import { IsInt, IsString, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @IsNotEmpty()
  id_intercambio: number;

  @IsInt()
  @IsNotEmpty()
  id_usuario_calificador: number;

  @IsInt()
  @IsNotEmpty()
  id_usuario_calificado: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  estrellas: number;

  @IsString()
  @IsOptional()
  resena?: string;
}

export class GetUserRatingsDto {
  promedio: number;
  total_calificaciones: number;
  calificaciones: {
    id_calificacion: number;
    estrellas: number;
    resena: string;
    fecha_calificacion: string;
    calificador: {
      id_usuario: number;
      nombre_usuario: string;
      foto_perfil_url?: string | undefined;
    };
  }[];
}

export class ExchangeRatingsDto {
  calificacion_usuario_1?: {
    id_calificacion: number;
    estrellas: number;
    resena: string;
    fecha_calificacion: string;
  };
  calificacion_usuario_2?: {
    id_calificacion: number;
    estrellas: number;
    resena: string;
    fecha_calificacion: string;
  };
  ambos_calificaron: boolean;
}
