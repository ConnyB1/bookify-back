import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Libro } from '../entities/book.entity'; 
import { Genero } from '../entities/genero.entity';
import { LibroImagen } from '../entities/libro-imagen.entity';
import { Usuario } from '../entities/user.entity';
import { Intercambio } from '../entities/exchange.entity';
import { Chat, ChatUsuario, Mensaje } from '../chat/chat.entity';
import { BookService } from './book.service';
import { BookController } from './book.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    Libro, 
    Genero, 
    LibroImagen, 
    Usuario,
    Intercambio,
    Chat,
    ChatUsuario,
    Mensaje
  ])],
  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {} 