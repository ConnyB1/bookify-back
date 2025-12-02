import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genero } from '../entities/genero.entity';

@Injectable()
export class GeneroService {
  constructor(
    @InjectRepository(Genero)
    private generoRepository: Repository<Genero>,
  ) {}

  async findAll(): Promise<Genero[]> {
    return this.generoRepository.find({
      order: {
        nombre: 'ASC',
      },
    });
  }
}
