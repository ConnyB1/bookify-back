import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, ChatUsuario, Mensaje } from './chat.entity';
import { Usuario } from '../entities/user.entity';
import { Intercambio, EstadoPropuesta } from '../entities/exchange.entity';
import { Libro } from '../entities/book.entity';
import { CreateChatDto, SendMessageDto, ChatPreviewDto, MessageDto } from './chat.dto';
import { NotificationService } from '../notifications/notification.service'; // ✅ Ruta corregida

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ChatUsuario)
    private chatUsuarioRepository: Repository<ChatUsuario>,
    @InjectRepository(Mensaje)
    private mensajeRepository: Repository<Mensaje>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Intercambio)
    private intercambioRepository: Repository<Intercambio>,
    @InjectRepository(Libro)
    private libroRepository: Repository<Libro>,
    private notificationService: NotificationService,
  ) {}

  async getUserChats(userId: number): Promise<ChatPreviewDto[]> {
    const chatsWithData = await this.chatUsuarioRepository
      .createQueryBuilder('cu')
      .innerJoin('chat_usuario', 'cu_other', 'cu_other.id_chat = cu.id_chat AND cu_other.id_usuario != :userId', { userId })
      .innerJoin('usuario', 'other_user', 'other_user.id_usuario = cu_other.id_usuario')
      .leftJoin(
        (qb) =>
          qb
            .select('m.id_chat', 'chat_id')
            .addSelect('MAX(m.timestamp)', 'max_timestamp')
            .from(Mensaje, 'm')
            .groupBy('m.id_chat'),
        'last_msg_info',
        'last_msg_info.chat_id = cu.id_chat'
      )
      .leftJoin(
        'mensaje',
        'last_msg',
        'last_msg.id_chat = cu.id_chat AND last_msg.timestamp = last_msg_info.max_timestamp'
      )
      .select([
        'cu.id_chat AS id_chat',
        'other_user.id_usuario AS other_user_id',
        'other_user.nombre_usuario AS other_user_name',
        'other_user.email AS other_user_email',
        'other_user.foto_perfil_url AS other_user_photo',
        'COALESCE(last_msg.contenido_texto, \'Sin mensajes\') AS last_message',
        'COALESCE(last_msg.timestamp, CURRENT_TIMESTAMP) AS timestamp',
      ])
      .where('cu.id_usuario = :userId', { userId })
      .orderBy('timestamp', 'DESC')
      .getRawMany();

    return chatsWithData.map((row) => ({
      id_chat: row.id_chat,
      otherUserId: row.other_user_id,
      otherUserName: row.other_user_name,
      otherUserEmail: row.other_user_email,
      otherUserPhoto: row.other_user_photo ?? undefined,
      lastMessage: row.last_message,
      timestamp: new Date(row.timestamp).toISOString(),
    }));
  }
  

  async getChatMessages(chatId: number, userId: number, limit = 200): Promise<MessageDto[]> {
    const isMember = await this.chatUsuarioRepository.findOne({
      where: { id_chat: chatId, id_usuario: userId },
    });

    if (!isMember) {
      throw new BadRequestException('No tienes acceso a este chat');
    }

    const messages = await this.mensajeRepository.find({
      where: { id_chat: chatId },
      order: { timestamp: 'ASC' },
      take: limit,
      relations: ['emisor'],
    });

    return messages.map(m => ({
      id_mensaje: m.id_mensaje,
      id_chat: m.id_chat,
      id_usuario_emisor: m.id_usuario_emisor,
      contenido_texto: m.contenido_texto,
      timestamp: m.timestamp.toISOString(),
      emisor: {
        id_usuario: m.emisor.id_usuario,
        nombre_usuario: m.emisor.nombre_usuario,
        foto_perfil_url: m.emisor.foto_perfil_url ?? undefined,
      },
    }));
  }


  async sendMessage(userId: number, dto: SendMessageDto): Promise<MessageDto> {
    const isMember = await this.chatUsuarioRepository.findOne({
      where: { id_chat: dto.id_chat, id_usuario: userId },
    });

    if (!isMember) {
      throw new BadRequestException('No tienes acceso a este chat');
    }

    const mensaje = this.mensajeRepository.create({
      id_chat: dto.id_chat,
      id_usuario_emisor: userId,
      contenido_texto: dto.contenido_texto,
    });

    const savedMessage = await this.mensajeRepository.save(mensaje);
    try {
      const chatParticipants = await this.chatUsuarioRepository.find({
        where: { id_chat: dto.id_chat },
        relations: ['usuario'],
      });

      const receptor = chatParticipants.find(p => p.id_usuario !== userId)?.usuario;
const emisor = await this.usuarioRepository.findOne({ where: { id_usuario: userId } });
      if (receptor && receptor.push_token) {
        const nombreMostrar = emisor?.nombre_usuario || 'Usuario Bookify'; 

        await this.notificationService.sendPushNotification(
          receptor.push_token,
          `Mensaje de ${nombreMostrar}`, 
          dto.contenido_texto,
          { chatId: dto.id_chat, type: 'chat_message' }
        );
      }
    } catch (error) {
      console.error('Error enviando push notification:', error);
    }

    const fullMessage = await this.mensajeRepository.findOne({
      where: { id_mensaje: savedMessage.id_mensaje },
      relations: ['emisor'],
    });

    if (!fullMessage) {
      throw new Error('Error al obtener el mensaje guardado');
    }

    return {
      id_mensaje: fullMessage.id_mensaje,
      id_chat: fullMessage.id_chat,
      id_usuario_emisor: fullMessage.id_usuario_emisor,
      contenido_texto: fullMessage.contenido_texto,
      timestamp: fullMessage.timestamp.toISOString(),
      emisor: {
        id_usuario: fullMessage.emisor.id_usuario,
        nombre_usuario: fullMessage.emisor.nombre_usuario,
        foto_perfil_url: fullMessage.emisor.foto_perfil_url ?? undefined,
      },
    };
  }
  async getChatExchangeStatus(chatId: number) {
    const result = await this.chatRepository
      .createQueryBuilder('chat')
      .innerJoin('intercambio', 'i', 'i.id_intercambio = chat.id_intercambio')
      .select([
        'i.id_intercambio',
        'i.id_libro_ofertado_fk',
        'i.confirmacion_solicitante',
        'i.confirmacion_receptor',
        'i.ubicacion_encuentro_lat',
        'i.ubicacion_encuentro_lng',
        'i.ubicacion_encuentro_nombre',
      ])
      .where('chat.id_chat = :chatId', { chatId })
      .andWhere('chat.id_intercambio IS NOT NULL')
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      id_intercambio: result.i_id_intercambio,
      id_libro_ofertado: result.i_id_libro_ofertado_fk,
      confirmacion_solicitante: result.i_confirmacion_solicitante,
      confirmacion_receptor: result.i_confirmacion_receptor,
      ubicacion_encuentro_lat: result.i_ubicacion_encuentro_lat,
      ubicacion_encuentro_lng: result.i_ubicacion_encuentro_lng,
      ubicacion_encuentro_nombre: result.i_ubicacion_encuentro_nombre,
    };
  }

  async createChat(dto: CreateChatDto): Promise<{ id_chat: number; message: string }> {
    const user1 = await this.usuarioRepository.findOne({ 
      where: { id_usuario: dto.id_usuario1 } 
    });
    const user2 = await this.usuarioRepository.findOne({ 
      where: { id_usuario: dto.id_usuario2 } 
    });

    if (!user1 || !user2) {
      throw new NotFoundException('Uno o ambos usuarios no existen');
    }

    if (dto.id_usuario1 === dto.id_usuario2) {
      throw new BadRequestException('No puedes crear un chat contigo mismo');
    }

    const existingChat = await this.findExistingChat(dto.id_usuario1, dto.id_usuario2);
    if (existingChat) {
      return {
        id_chat: existingChat,
        message: 'Ya existe un chat entre estos usuarios',
      };
    }

    const chat = this.chatRepository.create({
      id_intercambio: dto.id_intercambio || null,
    });

    const savedChat = await this.chatRepository.save(chat);

    await this.chatUsuarioRepository.save([
      { id_chat: savedChat.id_chat, id_usuario: dto.id_usuario1 },
      { id_chat: savedChat.id_chat, id_usuario: dto.id_usuario2 },
    ]);

    return {
      id_chat: savedChat.id_chat,
      message: 'Chat creado exitosamente',
    };
  }

  private async findExistingChat(userId1: number, userId2: number): Promise<number | null> {
    const result = await this.chatUsuarioRepository
      .createQueryBuilder('cu1')
      .select('cu1.id_chat')
      .innerJoin(
        'chat_usuario',
        'cu2',
        'cu1.id_chat = cu2.id_chat'
      )
      .where('cu1.id_usuario = :userId1', { userId1 })
      .andWhere('cu2.id_usuario = :userId2', { userId2 })
      .getRawOne();

    return result ? result.cu1_id_chat : null;
  }


  async getNewMessages(
    chatId: number, 
    userId: number, 
    sinceTimestamp: string
  ): Promise<MessageDto[]> {
    const isMember = await this.chatUsuarioRepository.findOne({
      where: { id_chat: chatId, id_usuario: userId },
    });

    if (!isMember) {
      throw new BadRequestException('No tienes acceso a este chat');
    }

    const messages = await this.mensajeRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.emisor', 'u')
      .where('m.id_chat = :chatId', { chatId })
      .andWhere('m.timestamp > :since', { since: sinceTimestamp })
      .orderBy('m.timestamp', 'ASC')
      .getMany();

    return messages.map(m => ({
      id_mensaje: m.id_mensaje,
      id_chat: m.id_chat,
      id_usuario_emisor: m.id_usuario_emisor,
      contenido_texto: m.contenido_texto,
      timestamp: m.timestamp.toISOString(),
      emisor: {
        id_usuario: m.emisor.id_usuario,
        nombre_usuario: m.emisor.nombre_usuario,
        foto_perfil_url: m.emisor.foto_perfil_url ?? undefined,
      },
    }));
  }
  async getChatExchange(chatId: number) {
    const chatInfo = await this.chatRepository
      .createQueryBuilder('chat')
      .select(['chat.id_chat', 'chat.id_intercambio'])
      .where('chat.id_chat = :chatId', { chatId })
      .andWhere('chat.id_intercambio IS NOT NULL')
      .getOne();

    if (!chatInfo || !chatInfo.id_intercambio) {
      return null;
    }

    const intercambio = await this.intercambioRepository.findOne({
      where: { id_intercambio: chatInfo.id_intercambio },
      relations: [
        'libro_solicitado',
        'libro_solicitado.imagenes',
        'libro_solicitado.propietario',
        'libro_ofertado',
        'libro_ofertado.imagenes',
        'libro_ofertado.propietario',
        'usuario_solicitante',
        'usuario_solicitante_receptor',
      ],
    });

    if (!intercambio) {
      return null;
    }

    return {
      id_intercambio: intercambio.id_intercambio,
      id_libro_solicitado: intercambio.id_libro_solicitado_fk,
      id_libro_ofertado: intercambio.id_libro_ofertado_fk,
      id_usuario_solicitante: intercambio.id_usuario_solicitante_fk,
      id_usuario_solicitante_receptor: intercambio.id_usuario_solicitante_receptor_fk,
      estado_propuesta: intercambio.estado_propuesta,
      // ubicación de encuentro
      ubicacion_encuentro_lat: intercambio.ubicacion_encuentro_lat,
      ubicacion_encuentro_lng: intercambio.ubicacion_encuentro_lng,
      ubicacion_encuentro_nombre: intercambio.ubicacion_encuentro_nombre,
      ubicacion_encuentro_direccion: intercambio.ubicacion_encuentro_direccion,
      ubicacion_encuentro_place_id: intercambio.ubicacion_encuentro_place_id,
      // confirmación 
      confirmacion_solicitante: intercambio.confirmacion_solicitante,
      confirmacion_receptor: intercambio.confirmacion_receptor,
      // nombres de usuarios
      nombre_usuario_solicitante: intercambio.usuario_solicitante.nombre_usuario,
      nombre_usuario_receptor: intercambio.usuario_solicitante_receptor.nombre_usuario,
      libro_solicitado: {
        id_libro: intercambio.libro_solicitado.id_libro,
        titulo: intercambio.libro_solicitado.titulo,
        autor: intercambio.libro_solicitado.autor,
        descripcion: intercambio.libro_solicitado.descripcion,
        imagenes: intercambio.libro_solicitado.imagenes.map(img => ({
          url_imagen: img.url_imagen,
        })),
        propietario: {
          id_usuario: intercambio.libro_solicitado.propietario.id_usuario,
          nombre_usuario: intercambio.libro_solicitado.propietario.nombre_usuario,
        },
      },
      libro_ofertado: intercambio.libro_ofertado ? {
        id_libro: intercambio.libro_ofertado.id_libro,
        titulo: intercambio.libro_ofertado.titulo,
        autor: intercambio.libro_ofertado.autor,
        descripcion: intercambio.libro_ofertado.descripcion,
        imagenes: intercambio.libro_ofertado.imagenes.map(img => ({
          url_imagen: img.url_imagen,
        })),
        propietario: {
          id_usuario: intercambio.libro_ofertado.propietario.id_usuario,
          nombre_usuario: intercambio.libro_ofertado.propietario.nombre_usuario,
        },
      } : null,
    };
  }


  async getChatExchanges(chatId: number) {
    const chatUsuarios = await this.chatUsuarioRepository.find({
      where: { id_chat: chatId },
      relations: ['usuario'],
    });

    if (chatUsuarios.length < 2) {
      return [];
    }

    const userId1 = chatUsuarios[0].id_usuario;
    const userId2 = chatUsuarios[1].id_usuario;

    // Buscar todos los intercambios entre estos dos usuarios
    const intercambios = await this.intercambioRepository
      .createQueryBuilder('intercambio')
      .leftJoinAndSelect('intercambio.libro_solicitado', 'libro_solicitado')
      .leftJoinAndSelect('libro_solicitado.imagenes', 'imagenes_solicitado')
      .leftJoinAndSelect('libro_solicitado.propietario', 'propietario_solicitado')
      .leftJoinAndSelect('intercambio.libro_ofertado', 'libro_ofertado')
      .leftJoinAndSelect('libro_ofertado.imagenes', 'imagenes_ofertado')
      .leftJoinAndSelect('libro_ofertado.propietario', 'propietario_ofertado')
      .leftJoinAndSelect('intercambio.usuario_solicitante', 'usuario_solicitante')
      .leftJoinAndSelect('intercambio.usuario_solicitante_receptor', 'usuario_receptor')
      .where(
        '((intercambio.id_usuario_solicitante_fk = :userId1 AND intercambio.id_usuario_solicitante_receptor_fk = :userId2) OR ' +
        '(intercambio.id_usuario_solicitante_fk = :userId2 AND intercambio.id_usuario_solicitante_receptor_fk = :userId1))',
        { userId1, userId2 }
      )
      .andWhere('intercambio.estado_propuesta IN (:...estados)', {
        estados: ['accepted', 'completed']
      })
      .orderBy('intercambio.fecha_propuesta', 'DESC')
      .getMany();

    return intercambios.map(intercambio => ({
      id_intercambio: intercambio.id_intercambio,
      id_libro_solicitado: intercambio.id_libro_solicitado_fk,
      id_libro_ofertado: intercambio.id_libro_ofertado_fk,
      id_usuario_solicitante: intercambio.id_usuario_solicitante_fk,
      id_usuario_solicitante_receptor: intercambio.id_usuario_solicitante_receptor_fk,
      estado_propuesta: intercambio.estado_propuesta,
      // Campos de ubicación de encuentro
      ubicacion_encuentro_lat: intercambio.ubicacion_encuentro_lat,
      ubicacion_encuentro_lng: intercambio.ubicacion_encuentro_lng,
      ubicacion_encuentro_nombre: intercambio.ubicacion_encuentro_nombre,
      ubicacion_encuentro_direccion: intercambio.ubicacion_encuentro_direccion,
      ubicacion_encuentro_place_id: intercambio.ubicacion_encuentro_place_id,
      // Campos de confirmación bilateral
      confirmacion_solicitante: intercambio.confirmacion_solicitante,
      confirmacion_receptor: intercambio.confirmacion_receptor,
      // Nombres de usuarios
      nombre_usuario_solicitante: intercambio.usuario_solicitante.nombre_usuario,
      nombre_usuario_receptor: intercambio.usuario_solicitante_receptor.nombre_usuario,
      libro_solicitado: {
        id_libro: intercambio.libro_solicitado.id_libro,
        titulo: intercambio.libro_solicitado.titulo,
        autor: intercambio.libro_solicitado.autor,
        descripcion: intercambio.libro_solicitado.descripcion,
        imagenes: intercambio.libro_solicitado.imagenes.map(img => ({
          url_imagen: img.url_imagen,
        })),
        propietario: {
          id_usuario: intercambio.libro_solicitado.propietario.id_usuario,
          nombre_usuario: intercambio.libro_solicitado.propietario.nombre_usuario,
        },
      },
      libro_ofertado: intercambio.libro_ofertado ? {
        id_libro: intercambio.libro_ofertado.id_libro,
        titulo: intercambio.libro_ofertado.titulo,
        autor: intercambio.libro_ofertado.autor,
        descripcion: intercambio.libro_ofertado.descripcion,
        imagenes: intercambio.libro_ofertado.imagenes.map(img => ({
          url_imagen: img.url_imagen,
        })),
        propietario: {
          id_usuario: intercambio.libro_ofertado.propietario.id_usuario,
          nombre_usuario: intercambio.libro_ofertado.propietario.nombre_usuario,
        },
      } : null,
    }));
  }

  async verifyUserInChat(chatId: number, userId: number): Promise<boolean> {
    const member = await this.chatUsuarioRepository.findOne({
      where: { id_chat: chatId, id_usuario: userId },
    });
    return !!member;
  }

  async getChatParticipants(chatId: number, currentUserId: number) {
    const participants = await this.chatUsuarioRepository
      .createQueryBuilder('cu')
      .leftJoinAndSelect('cu.usuario', 'u')
      .where('cu.id_chat = :chatId', { chatId })
      .andWhere('cu.id_usuario != :currentUserId', { currentUserId })
      .getMany();

    return participants.map(p => ({
      id_usuario: p.usuario.id_usuario,
      nombre_usuario: p.usuario.nombre_usuario,
      email: p.usuario.email,
      foto_perfil_url: p.usuario.foto_perfil_url ?? undefined,
    }));
  }

  async deleteChat(chatId: number, userId: number): Promise<void> {
    const isMember = await this.verifyUserInChat(chatId, userId);
    if (!isMember) {
      throw new ForbiddenException('No tienes permiso para eliminar este chat');
    }

    const chatUsuarios = await this.chatUsuarioRepository.find({
      where: { id_chat: chatId },
      relations: ['usuario'],
    });

    if (chatUsuarios.length !== 2) {
      throw new BadRequestException('El chat debe tener exactamente 2 participantes');
    }

    const userId1 = chatUsuarios[0].id_usuario;
    const userId2 = chatUsuarios[1].id_usuario;

    const intercambios = await this.intercambioRepository
      .createQueryBuilder('intercambio')
      .where(
        '((intercambio.id_usuario_solicitante_fk = :userId1 AND intercambio.id_usuario_solicitante_receptor_fk = :userId2) OR (intercambio.id_usuario_solicitante_fk = :userId2 AND intercambio.id_usuario_solicitante_receptor_fk = :userId1))',
        { userId1, userId2 }
      )
      .andWhere('intercambio.estado_propuesta IN (:...estados)', { 
        estados: ['pending', 'accepted', 'completed'] 
      })
      .getMany();

    for (const intercambio of intercambios) {
      intercambio.estado_propuesta = EstadoPropuesta.REJECTED;
      await this.intercambioRepository.save(intercambio);
    }

    await this.mensajeRepository.delete({ id_chat: chatId });

    await this.chatUsuarioRepository.delete({ id_chat: chatId });

    await this.chatRepository.delete({ id_chat: chatId });
  }
}