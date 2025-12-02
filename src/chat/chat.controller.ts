import { 
  Controller, 
  Get, 
  Post, 
  Delete,
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto, SendMessageDto } from './chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('my-chats')
  async getMyChats(@Request() req) {
    const userId = req.user?.id_usuario || req.query.userId;
    
    if (!userId) {
      return { 
        success: false, 
        message: 'Usuario no autenticado' 
      };
    }

    const chats = await this.chatService.getUserChats(Number(userId));
    
    return {
      success: true,
      data: chats,
    };
  }

  @Get(':chatId/messages')
  async getChatMessages(
    @Param('chatId') chatId: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    const userId = req.user?.id_usuario || req.query.userId;
    
    if (!userId) {
      return { 
        success: false, 
        message: 'Usuario no autenticado' 
      };
    }

    const messages = await this.chatService.getChatMessages(
      Number(chatId),
      Number(userId),
      limit ? Number(limit) : 200,
    );

    return {
      success: true,
      data: messages,
    };
  }

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(@Body() dto: SendMessageDto, @Request() req) {
    const userId = req.user?.id_usuario || req.body.userId;
    
    if (!userId) {
      return { 
        success: false, 
        message: 'Usuario no autenticado' 
      };
    }

    const message = await this.chatService.sendMessage(Number(userId), dto);

    return {
      success: true,
      data: message,
      message: 'Mensaje enviado',
    };
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createChat(@Body() dto: CreateChatDto) {
    const result = await this.chatService.createChat(dto);

    return {
      success: true,
      data: result,
    };
  }

  @Get(':chatId/new-messages')
  async getNewMessages(
    @Param('chatId') chatId: string,
    @Query('since') since: string,
    @Request() req,
  ) {
    const userId = req.user?.id_usuario || req.query.userId;
    
    if (!userId) {
      return { 
        success: false, 
        message: 'Usuario no autenticado' 
      };
    }

    if (!since) {
      return {
        success: false,
        message: 'Parámetro "since" es requerido',
      };
    }

    const messages = await this.chatService.getNewMessages(
      Number(chatId),
      Number(userId),
      since,
    );

    return {
      success: true,
      data: messages,
      count: messages.length,
    };
  }


  @Get(':chatId/exchanges')
  async getChatExchanges(@Param('chatId') chatId: string) {
    try {
      const exchanges = await this.chatService.getChatExchanges(Number(chatId));
      return {
        success: true,
        data: exchanges,
      };
    } catch (error) {
      console.error('[getChatExchanges]', error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  }

  //información del intercambio

  @Get(':chatId/exchange')
  async getChatExchange(@Param('chatId') chatId: string) {
    try {
      const exchange = await this.chatService.getChatExchange(Number(chatId));
      
      if (!exchange) {
        throw new NotFoundException('Este chat no tiene un intercambio asociado');
      }

      return {
        success: true,
        data: exchange,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      return {
        success: false,
        message: error.message || 'Error al obtener información del intercambio',
      };
    }
  }

  //confirmaciones y ubicación 
  @Get(':chatId/exchange-status')
  async getChatExchangeStatus(@Param('chatId') chatId: string) {
    try {
      const status = await this.chatService.getChatExchangeStatus(Number(chatId));
      
      if (!status) {
        throw new NotFoundException('Este chat no tiene un intercambio asociado');
      }

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      return {
        success: false,
        message: error.message || 'Error al obtener estado del intercambio',
      };
    }
  }

  @Get(':chatId/payload')
  async getChatPayload(
    @Param('chatId') chatId: string,
    @Query('userId') userId: string,
  ) {
    try {
      const uid = Number(userId);
      const cid = Number(chatId);

      if (!uid) {
        return { 
          success: false, 
          message: 'Usuario no autenticado' 
        };
      }

      const isMember = await this.chatService.verifyUserInChat(cid, uid);
      if (!isMember) {
        return {
          success: false,
          message: 'No tienes acceso a este chat',
        };
      }
      const [participants, exchange, messages] = await Promise.all([
        this.chatService.getChatParticipants(cid, uid),
        this.chatService.getChatExchange(cid),
        this.chatService.getChatMessages(cid, uid, 50),
      ]);

      return {
        success: true,
        data: {
          id_chat: cid,
          participants,
          exchange,
          recentMessages: messages,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener payload del chat',
      };
    }
  }

  // Borrar chat
  @Delete(':chatId')
  @HttpCode(HttpStatus.OK)
  async deleteChat(
    @Param('chatId') chatId: string,
    @Query('userId') userId: string,
  ) {
    try {
      const uid = Number(userId);
      const cid = Number(chatId);

      if (!uid) {
        return { 
          success: false, 
          message: 'Usuario no autenticado' 
        };
      }

      await this.chatService.deleteChat(cid, uid);

      return {
        success: true,
        message: 'Chat eliminado exitosamente',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al eliminar chat',
      };
    }
  }
}
