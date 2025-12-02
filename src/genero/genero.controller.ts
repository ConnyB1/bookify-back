import { Controller, Get } from '@nestjs/common';
import { GeneroService } from './genero.service';

@Controller('api/generos')
export class GeneroController {
  constructor(private readonly generoService: GeneroService) {}

  @Get()
  async getAllGenres() {
    try {
      const generos = await this.generoService.findAll();
      return {
        success: true,
        data: generos,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al obtener géneros',
      };
    }
  }
}
