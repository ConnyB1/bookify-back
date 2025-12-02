import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './book/book.module';
import { ImagesModule } from './images/images.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { ExchangeModule } from './intercambio/intercambio.module';
import { NotificationModule } from './notifications/notification.module';
import { UserModule } from './user/user.module';
import { RatingModule } from './rating/rating.module';
import { GeneroModule } from './genero/genero.module';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Configuración de TypeORM con PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Usamos init.sql en su lugar
        logging: true,
      }),
      inject: [ConfigService],
    }),
    
    // Módulos de la aplicación
    BookModule,
    ImagesModule,
    AuthModule,
    ChatModule,
    ExchangeModule,
    NotificationModule,
    UserModule,
    RatingModule,
    GeneroModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
