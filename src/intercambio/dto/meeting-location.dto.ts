import { IsNumber, IsString, IsOptional } from 'class-validator';

export class ProposeMeetingLocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsString()
  nombre: string;

  @IsString()
  direccion: string;

  @IsString()
  @IsOptional()
  place_id?: string;
}

export class MeetingLocationResponseDto {
  id_intercambio: number;
  ubicacion_encuentro: {
    lat: number;
    lng: number;
    nombre: string;
    direccion: string;
    place_id: string | null;
  } | null;
}
