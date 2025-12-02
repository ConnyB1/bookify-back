import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeController } from './intercambio.controller';
import { ExchangeService } from './intercambio.service';
import { Intercambio } from '../entities/exchange.entity';
import { Libro } from '../entities/book.entity';
import { Usuario } from '../entities/user.entity';
import { Notificacion } from '../entities/notification.entity';
import { ChatModule } from '../chat/chat.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Intercambio, Libro, Usuario, Notificacion]),
    ChatModule, // Importar ChatModule para crear chats automáticamente
    NotificationModule, // Para enviar push notifications
  ],
  controllers: [ExchangeController],
  providers: [ExchangeService],
  exports: [ExchangeService],
})
export class ExchangeModule {}
