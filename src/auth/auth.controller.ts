import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Headers, 
  UnauthorizedException, 
  Param, 
  Put, 
  UploadedFile, 
  UseInterceptors,
  Patch
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UpdateLocationDto, LocationResponseDto } from './dto/location.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  async getProfile(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authorization.replace('Bearer ', '');
    const decoded = await this.authService.verifyToken(token);
    const user = await this.authService.getUserById(decoded.id);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // ✅ FIX: Incluir TODOS los campos necesarios, especialmente latitud/longitud
    return {
      success: true,
      data: {
        user: {
          id_usuario: user.id_usuario,
          nombre_usuario: user.nombre_usuario,
          email: user.email,
          genero: user.genero,
          foto_perfil_url: user.foto_perfil_url,
          latitud: user.latitud,                           // ✅ Agregado
          longitud: user.longitud,                         // ✅ Agregado
          ciudad: user.ciudad,                             // ✅ Agregado
          radio_busqueda_km: user.radio_busqueda_km,       // ✅ Agregado
          ubicacion_actualizada_at: user.ubicacion_actualizada_at, // ✅ Agregado
        },
      },
    };
  }

  // ======================================================
  // CORRECCIÓN:
  // Cambiado de @Put('profile-photo/:userId') 
  // a @Put('profile/picture/:userId') para coincidir con la API
  // También cambiamos @Put por @Patch, ya que solo actualizamos un campo
  // ======================================================
  @Patch('profile/picture/:userId') // <-- RUTA CORREGIDA
  async updateProfilePhoto(
    @Param('userId') userId: string,
    @Body() body: { photoUrl: string },
  ) {
    return this.authService.updateProfilePhoto(+userId, body.photoUrl);
  }
  @Get('location/:userId')
  async getLocation(@Param('userId') userId: string): Promise<{ success: boolean; data: LocationResponseDto }> {
    const location = await this.authService.getUserLocation(+userId);
    return {
      success: true,
      data: location,
    };
  }

  @Patch('location/:userId')
  async updateLocation(
    @Param('userId') userId: string,
    @Body() locationDto: UpdateLocationDto,
  ): Promise<{ success: boolean; data: LocationResponseDto }> {
    const location = await this.authService.updateUserLocation(+userId, locationDto);
    return {
      success: true,
      data: location,
    };
  }

  @Patch('search-radius/:userId')
  async updateSearchRadius(
    @Param('userId') userId: string,
    @Body() body: { radio_busqueda_km: number },
  ): Promise<{ success: boolean; message: string }> {
    await this.authService.updateSearchRadius(+userId, body.radio_busqueda_km);
    return {
      success: true,
      message: 'Radio de búsqueda actualizado correctamente',
    };
  }
}
