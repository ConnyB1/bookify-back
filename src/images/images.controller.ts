import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import type { Express } from 'express'; // Importar Express como tipo

@Controller('api/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  // Endpoint para subir una imagen de libro (para Buscar.tsx)
  @Post('upload/book')
  @UseInterceptors(FileInterceptor('image'))
  async uploadBookImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB máximo
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      // Llama al servicio que sube a S3
      const imageUrl = await this.imagesService.uploadBookImage(file);
      
      return {
        success: true,
        message: 'Book image uploaded successfully',
        data: {
          imageUrl,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  // Endpoint para subir múltiples imágenes de libro
  @Post('upload/book/multiple')
  @UseInterceptors(FilesInterceptor('images', 5)) // Máximo 5 imágenes
  async uploadMultipleBookImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|gif|webp)$/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No images uploaded');
    }

    try {
      const uploadPromises = files.map(file => 
        this.imagesService.uploadBookImage(file)
      );
      
      const imageUrls = await Promise.all(uploadPromises);
      
      return {
        success: true,
        message: `${imageUrls.length} book images uploaded successfully`,
        data: {
          imageUrls,
          count: imageUrls.length,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Multiple upload failed: ${error.message}`);
    }
  }

  // Endpoint para subir imagen de perfil
  @Post('upload/profile')
  @UseInterceptors(FileInterceptor('image')) // Espera un campo 'image'
  async uploadProfileImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 3 * 1024 * 1024 }), // 3MB para perfil
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      // Llama al servicio que sube a S3
      const imageUrl = await this.imagesService.uploadProfileImage(file);
      
      return {
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          imageUrl,
          filename: file.originalname,
          size: file.size,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Profile upload failed: ${error.message}`);
    }
  }

  // Obtener URL firmada (si necesitas URLs privadas)
  @Get('signed-url/:key')
  async getSignedUrl(@Param('key') key: string) {
    try {
      const signedUrl = await this.imagesService.getSignedUrl(key);
      return {
        success: true,
        data: { signedUrl },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to generate signed URL: ${error.message}`);
    }
  }

  // Eliminar imagen
  @Delete(':key')
  async deleteImage(@Param('key') key: string) {
    try {
      await this.imagesService.deleteImage(key);
      return {
        success: true,
        message: 'Image deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }

  // Eliminar imagen por URL completa
  @Delete('by-url/:url')
  async deleteImageByUrl(@Param('url') url: string) {
    try {
      const decodedUrl = decodeURIComponent(url);
      const key = this.imagesService.extractKeyFromUrl(decodedUrl);
      await this.imagesService.deleteImage(key);
      
      return {
        success: true,
        message: 'Image deleted successfully',
        data: { deletedUrl: decodedUrl },
      };
    } catch (error) {
      throw new BadRequestException(`Delete by URL failed: ${error.message}`);
    }
  }
}