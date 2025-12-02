import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calificacion } from '../entities/calificacion.entity';
import { Intercambio } from '../entities/exchange.entity';
import { Usuario } from '../entities/user.entity';
import { CreateRatingDto, GetUserRatingsDto, ExchangeRatingsDto } from './rating.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Calificacion)
    private calificacionRepository: Repository<Calificacion>,
    @InjectRepository(Intercambio)
    private intercambioRepository: Repository<Intercambio>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  /**
   * Crear una nueva calificación
   */
  async createRating(dto: CreateRatingDto): Promise<Calificacion> {
    // 1. Verificar que el intercambio existe y está completado
    const intercambio = await this.intercambioRepository.findOne({
      where: { id_intercambio: dto.id_intercambio },
    });

    if (!intercambio) {
      throw new NotFoundException('Intercambio no encontrado');
    }

    // 2. Verificar que ambos usuarios confirmaron el intercambio
    if (!intercambio.confirmacion_solicitante || !intercambio.confirmacion_receptor) {
      throw new BadRequestException('Solo puedes calificar cuando ambos usuarios han confirmado el intercambio');
    }

    // 3. Verificar que el calificador es parte del intercambio
    const isParticipant = 
      dto.id_usuario_calificador === intercambio.id_usuario_solicitante_fk ||
      dto.id_usuario_calificador === intercambio.id_usuario_solicitante_receptor_fk;

    if (!isParticipant) {
      throw new BadRequestException('Solo los participantes del intercambio pueden calificar');
    }

    // 4. Verificar que el calificado es el otro usuario del intercambio
    const expectedOtherUserId = 
      dto.id_usuario_calificador === intercambio.id_usuario_solicitante_fk
        ? intercambio.id_usuario_solicitante_receptor_fk
        : intercambio.id_usuario_solicitante_fk;

    if (dto.id_usuario_calificado !== expectedOtherUserId) {
      throw new BadRequestException('El usuario calificado debe ser el otro participante del intercambio');
    }

    // 5. Verificar que no haya calificado ya
    const existingRating = await this.calificacionRepository.findOne({
      where: {
        id_intercambio: dto.id_intercambio,
        id_usuario_calificador: dto.id_usuario_calificador,
      },
    });

    if (existingRating) {
      throw new ConflictException('Ya has calificado este intercambio');
    }

    // 6. Crear la calificación
    const calificacion = this.calificacionRepository.create({
      id_intercambio: dto.id_intercambio,
      id_usuario_calificador: dto.id_usuario_calificador,
      id_usuario_calificado: dto.id_usuario_calificado,
      estrellas: dto.estrellas,
      resena: dto.resena || undefined,
    });

    const saved = await this.calificacionRepository.save(calificacion);
    return saved;
  }

  /**
   * Obtener todas las calificaciones de un usuario (como calificado)
   */
  async getUserRatings(userId: number): Promise<GetUserRatingsDto> {
    const calificaciones = await this.calificacionRepository.find({
      where: { id_usuario_calificado: userId },
      relations: ['usuario_calificador'],
      order: { id_calificacion: 'DESC' },
    });

    const total = calificaciones.length;
    const promedio = total > 0
      ? calificaciones.reduce((sum, cal) => sum + cal.estrellas, 0) / total
      : 0;

    return {
      promedio: Math.round(promedio * 10) / 10, // Redondear a 1 decimal
      total_calificaciones: total,
      calificaciones: calificaciones.map(cal => ({
        id_calificacion: cal.id_calificacion,
        estrellas: cal.estrellas,
        resena: cal.resena || '',
        fecha_calificacion: cal.fecha_calificacion?.toISOString() || new Date().toISOString(),
        calificador: {
          id_usuario: cal.usuario_calificador.id_usuario,
          nombre_usuario: cal.usuario_calificador.nombre_usuario,
          foto_perfil_url: cal.usuario_calificador.foto_perfil_url || undefined,
        },
      })),
    };
  }

  /**
   * Obtener calificaciones de un intercambio específico
   */
  async getExchangeRatings(exchangeId: number): Promise<ExchangeRatingsDto> {
    const intercambio = await this.intercambioRepository.findOne({
      where: { id_intercambio: exchangeId },
    });

    if (!intercambio) {
      throw new NotFoundException('Intercambio no encontrado');
    }

    const calificaciones = await this.calificacionRepository.find({
      where: { id_intercambio: exchangeId },
    });

    const cal1 = calificaciones.find(c => c.id_usuario_calificador === intercambio.id_usuario_solicitante_fk);
    const cal2 = calificaciones.find(c => c.id_usuario_calificador === intercambio.id_usuario_solicitante_receptor_fk);

    return {
      calificacion_usuario_1: cal1 ? {
        id_calificacion: cal1.id_calificacion,
        estrellas: cal1.estrellas,
        resena: cal1.resena || '',
        fecha_calificacion: cal1.fecha_calificacion?.toISOString() || new Date().toISOString(),
      } : undefined,
      calificacion_usuario_2: cal2 ? {
        id_calificacion: cal2.id_calificacion,
        estrellas: cal2.estrellas,
        resena: cal2.resena || '',
        fecha_calificacion: cal2.fecha_calificacion?.toISOString() || new Date().toISOString(),
      } : undefined,
      ambos_calificaron: !!cal1 && !!cal2,
    };
  }

  /**
   * Verificar si un usuario ya calificó un intercambio
   */
  async hasUserRated(exchangeId: number, userId: number): Promise<boolean> {
    const rating = await this.calificacionRepository.findOne({
      where: {
        id_intercambio: exchangeId,
        id_usuario_calificador: userId,
      },
    });

    return !!rating;
  }
}
