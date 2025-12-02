import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateChatDto {
  @IsOptional()
  @IsNumber()
  id_intercambio?: number;

  @IsNumber()
  @IsNotEmpty()
  id_usuario1: number;

  @IsNumber()
  @IsNotEmpty()
  id_usuario2: number;
}

export class SendMessageDto {
  @IsNumber()
  @IsNotEmpty()
  id_chat: number;

  @IsString()
  @IsNotEmpty()
  contenido_texto: string;
}

export class ChatPreviewDto {
  id_chat: number;
  otherUserId: number;
  otherUserName: string;
  otherUserEmail?: string;
  otherUserPhoto?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
}

export class MessageDto {
  id_mensaje: number;
  id_chat: number;
  id_usuario_emisor: number;
  contenido_texto: string;
  timestamp: string;
  emisor?: {
    id_usuario: number;
    nombre_usuario: string;
    foto_perfil_url?: string;
  };
}
