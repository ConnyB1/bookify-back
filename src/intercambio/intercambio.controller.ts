import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { ExchangeService } from './intercambio.service';
import { CreateExchangeDto, UpdateExchangeDto, ExchangeResponseDto } from './intercambio.dto';
import { ProposeMeetingLocationDto } from './dto/meeting-location.dto';

@Controller('api/exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}


  @Post('request')
  async createRequest(@Body() dto: CreateExchangeDto): Promise<{
    success: boolean;
    data: ExchangeResponseDto;
    message: string;
  }> {
    try {
      const exchange = await this.exchangeService.createExchangeRequest(dto);
      return {
        success: true,
        data: exchange,
        message: 'Solicitud de intercambio enviada correctamente',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Verificar si existe una solicitud pendiente
   * GET /api/exchange/check-pending?bookId=123&userId=456&ownerId=789
   */
  @Get('check-pending')
  async checkPendingExchange(
    @Query('bookId') bookId: string,
    @Query('userId') userId: string,
    @Query('ownerId') ownerId: string,
  ): Promise<{
    success: boolean;
    hasPending: boolean;
  }> {
    try {
      const hasPending = await this.exchangeService.checkPendingExchange(
        Number(bookId),
        Number(userId),
        Number(ownerId),
      );
      return {
        success: true,
        hasPending,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Obtener intercambios recibidos
   * GET /api/exchange/received?userId=123
   */
  @Get('received')
  async getReceived(@Query('userId') userId: string): Promise<{
    success: boolean;
    data: ExchangeResponseDto[];
  }> {
    const exchanges = await this.exchangeService.getReceivedExchanges(Number(userId));
    return {
      success: true,
      data: exchanges,
    };
  }

  /**
   * Obtener intercambios enviados
   * GET /api/exchange/sent?userId=123
   */
  @Get('sent')
  async getSent(@Query('userId') userId: string): Promise<{
    success: boolean;
    data: ExchangeResponseDto[];
  }> {
    const exchanges = await this.exchangeService.getSentExchanges(Number(userId));
    return {
      success: true,
      data: exchanges,
    };
  }

  /**
   * Obtener un intercambio específico por ID
   * GET /api/exchange/:id
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<{
    success: boolean;
    data: ExchangeResponseDto & { id_chat?: number };
  }> {
    try {
      const exchange = await this.exchangeService.getExchangeById(Number(id));
      return {
        success: true,
        data: exchange,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Aceptar o rechazar intercambio
   * PATCH /api/exchange/:id?userId=123
   */
  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Body() dto: UpdateExchangeDto,
  ): Promise<{
    success: boolean;
    data: ExchangeResponseDto;
    message: string;
  }> {
    try {
      const exchange = await this.exchangeService.updateExchangeStatus(
        Number(id),
        Number(userId),
        dto,
      );
      return {
        success: true,
        data: exchange,
        message: `Intercambio ${dto.estado_propuesta === 'accepted' ? 'aceptado' : 'rechazado'} correctamente`,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Seleccionar libro para ofrecer en intercambio
   * PUT /api/exchange/:id/offer-book
   */
  @Put(':id/offer-book')
  async offerBook(
    @Param('id') id: string,
    @Body() body: { id_libro_ofertado: number },
  ): Promise<{
    success: boolean;
    data: ExchangeResponseDto;
    message: string;
  }> {
    try {
      const exchange = await this.exchangeService.offerBook(
        Number(id),
        body.id_libro_ofertado,
      );
      return {
        success: true,
        data: exchange,
        message: 'Libro ofrecido correctamente',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Proponer ubicación de encuentro
   * POST /api/exchange/:id/propose-location
   */
  @Post(':id/propose-location')
  async proposeMeetingLocation(
    @Param('id') id: string,
    @Body() dto: ProposeMeetingLocationDto,
  ): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    try {
      const result = await this.exchangeService.proposeMeetingLocation(
        Number(id),
        dto.lat,
        dto.lng,
        dto.nombre,
        dto.direccion,
        dto.place_id,
      );
      return {
        success: true,
        data: result.data,
        message: 'Ubicación de encuentro propuesta correctamente',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Confirmar intercambio (bilateral)
   * PUT /api/exchange/:id/confirm?userId=123
   */
  @Put(':id/confirm')
  async confirmExchange(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    try {
      const result = await this.exchangeService.confirmExchange(
        Number(id),
        Number(userId),
      );
      return {
        success: true,
        data: result.data,
        message: result.data.ambos_confirmaron 
          ? '¡Intercambio completado! Ambos usuarios han confirmado' 
          : 'Confirmación registrada. Esperando confirmación del otro usuario',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Cancelar intercambio
   * DELETE /api/exchange/:id/cancel?userId=123
   */
  @Delete(':id/cancel')
  async cancelExchange(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.exchangeService.cancelExchange(Number(id), Number(userId));
      return {
        success: true,
        message: 'Intercambio cancelado exitosamente',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
