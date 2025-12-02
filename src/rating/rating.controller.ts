import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './rating.dto';

@Controller('api/rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  /**
   * Crear una nueva calificación
   * POST /api/rating
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRating(@Body() dto: CreateRatingDto) {
    try {
      const rating = await this.ratingService.createRating(dto);
      
      return {
        success: true,
        message: 'Calificación creada exitosamente',
        data: rating,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al crear calificación',
      };
    }
  }

  /**
   * Obtener todas las calificaciones de un usuario
   * GET /api/rating/user/:userId
   */
  @Get('user/:userId')
  async getUserRatings(@Param('userId') userId: string) {
    try {
      const ratings = await this.ratingService.getUserRatings(Number(userId));
      
      return {
        success: true,
        data: ratings,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener calificaciones',
      };
    }
  }

  /**
   * Obtener calificaciones de un intercambio específico
   * GET /api/rating/exchange/:exchangeId
   */
  @Get('exchange/:exchangeId')
  async getExchangeRatings(@Param('exchangeId') exchangeId: string) {
    try {
      const ratings = await this.ratingService.getExchangeRatings(Number(exchangeId));
      
      return {
        success: true,
        data: ratings,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener calificaciones del intercambio',
      };
    }
  }

  /**
   * Verificar si un usuario ya calificó un intercambio
   * GET /api/rating/check?exchangeId=123&userId=456
   */
  @Get('check')
  async checkUserRated(
    @Query('exchangeId') exchangeId: string,
    @Query('userId') userId: string,
  ) {
    try {
      const hasRated = await this.ratingService.hasUserRated(
        Number(exchangeId),
        Number(userId),
      );
      
      return {
        success: true,
        data: { hasRated },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al verificar calificación',
      };
    }
  }
}
