import { IsNumber, IsOptional, IsEnum } from 'class-validator';
import { EstadoPropuesta } from '../entities/exchange.entity';

export class CreateExchangeDto {
  @IsNumber()
  id_libro_solicitado: number;

  @IsNumber()
  @IsOptional()
  id_libro_ofertado?: number;

  @IsNumber()
  id_usuario_solicitante: number;

  // El receptor se obtiene automáticamente del propietario del libro solicitado
  @IsNumber()
  @IsOptional()
  id_usuario_receptor?: number;
}

export class UpdateExchangeDto {
  @IsEnum(EstadoPropuesta)
  estado_propuesta: EstadoPropuesta;

  @IsNumber()
  @IsOptional()
  id_punto_encuentro?: number;
}

export class ExchangeResponseDto {
  id_intercambio: number;
  libro_solicitado: {
    id_libro: number;
    titulo: string;
  };
  libro_ofertado?: {
    id_libro: number;
    titulo: string;
  } | null;
  usuario_solicitante: {
    id_usuario: number;
    nombre_usuario: string;
  };
  usuario_receptor: {
    id_usuario: number;
    nombre_usuario: string;
  };
  estado_propuesta: EstadoPropuesta;
  fecha_propuesta: string;
  fecha_acuerdo?: string | null;
}
