import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImagesService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || 'emaprobookify';
    
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are required: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    }
    
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-2',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  // Subir imagen de libro a S3
  async uploadBookImage(file: Express.Multer.File): Promise<string> {
    const key = `books/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      return `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Subir imagen de perfil a S3
  async uploadProfileImage(file: Express.Multer.File): Promise<string> {
    const key = `profiles/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL removido - el bucket debe tener políticas públicas configuradas
    });

    try {
      await this.s3Client.send(command);
      return `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${key}`;
    } catch (error) {
      throw new Error(`Error uploading profile image: ${error.message}`);
    }
  }

  // Obtener URL firmada para acceso temporal (si necesitas URLs privadas)
  async getSignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      throw new Error(`Error generating signed URL: ${error.message}`);
    }
  }

  // Eliminar imagen de S3
  async deleteImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(`Error deleting image: ${error.message}`);
    }
  }

  // Extraer key de una URL completa
  extractKeyFromUrl(url: string): string {
    const urlParts = url.split('.amazonaws.com/');
    return urlParts.length > 1 ? urlParts[1] : url;
  }
}