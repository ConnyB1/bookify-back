import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { UpdateGenrePreferencesDto } from './dto/genre-preferences.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard) // Protegemos la ruta
  @Patch('push-token')
  async updatePushToken(@Request() req, @Body() body: { token: string }) {
    const userId = req.user.userId || req.user.id_usuario || req.user.sub; 
    
    return this.userService.updatePushToken(userId, body.token);
  }

  @Patch(':id/genre-preferences')
  async updateGenrePreferences(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGenrePreferencesDto,
  ) {
    try {
      const result = await this.userService.updateGenrePreferences(id, dto);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al actualizar preferencias de géneros',
      };
    }
  }

  @Get(':id/genre-preferences')
  async getGenrePreferences(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.userService.getGenrePreferences(id);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener preferencias de géneros',
      };
    }
  }

  @Get(':id')
  async getUserProfile(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.userService.getUserProfile(id);
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener perfil de usuario',
      };
    }
  }
}