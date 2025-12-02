export class UpdateLocationDto {
  latitud: number;
  longitud: number;
  ciudad?: string;
  radio_busqueda_km?: number;
}

export class LocationResponseDto {
  latitud: number | null;
  longitud: number | null;
  radio_busqueda_km: number;
  ciudad: string | null;
  ubicacion_actualizada_at: Date | null;
}
