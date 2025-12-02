import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token de autenticación no proporcionado');
    }

    // Formato esperado: "Bearer <token>"
    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido. Use: Bearer <token>');
    }

    try {
      // Decodificar y verificar token
      const decoded = await this.authService.verifyToken(token);

      // Obtener usuario completo de la BD
      const user = await this.authService.getUserById(decoded.id);

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // Inyectar usuario en request para que esté disponible en controladores
      request.user = {
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
