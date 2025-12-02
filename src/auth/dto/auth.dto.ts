export class RegisterDto {
  nombre_usuario: string;
  email: string;
  password: string;
  genero?: string;
}

export class LoginDto {
  nombre_usuario: string; 
  password: string;
}

export class AuthResponseDto {
  success: boolean;
  message: string;
  data?: {
    user: {
      id_usuario: number;
      nombre_usuario: string;
      email: string;
      genero?: string;
      foto_perfil_url?: string;
    };
    tokens?: {
      accessToken: string;
      refreshToken: string;
      idToken: string;
    };
  };
}
