import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { Calificacion } from '../entities/calificacion.entity';
import { Intercambio } from '../entities/exchange.entity';
import { Usuario } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Calificacion, Intercambio, Usuario]),
  ],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
