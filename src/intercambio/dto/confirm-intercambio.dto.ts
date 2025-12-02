export class ConfirmExchangeDto {
  // Sin campos necesarios, la confirmación se basa en el usuario autenticado
}

export class ExchangeConfirmationResponseDto {
  id_intercambio: number;
  confirmacion_solicitante: boolean;
  confirmacion_receptor: boolean;
  ambos_confirmaron: boolean;
  estado_propuesta: string;
}
