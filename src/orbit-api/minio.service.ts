import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

@Injectable()
export class OrbitMediaStorageService implements OnModuleInit {
  private readonly logger = new Logger(OrbitMediaStorageService.name);
  private readonly client: Minio.Client;
  private readonly bucketName: string;

  constructor(private readonly config: ConfigService) {
    this.bucketName = this.config.get('MINIO_BUCKET', 'orbit-types');
    this.client = new Minio.Client({
      endPoint: this.config.get('MINIO_ENDPOINT', 'localhost'),
      port: Number(this.config.get('MINIO_PORT', 9000)),
      useSSL: this.config.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.config.get('MINIO_ACCESS_KEY', 'root'),
      secretKey: this.config.get('MINIO_SECRET_KEY', 'rootpassword'),
    });
  }

  async onModuleInit() {
    try {
      await this.ensureBucket();
    } catch (error) {
      this.logger.warn(`MinIO недоступен: ${error instanceof Error ? error.message : error}`);
    }
  }

  async uploadOrbitMedia(
    file: Express.Multer.File,
    orbitTypeId: number,
    mediaKind: 'image' | 'video',
  ): Promise<string> {
    try {
      await this.ensureBucket();
      const extension = this.getExtension(file, mediaKind);
      const objectName = `orbit-types/${orbitTypeId}/${mediaKind}-${randomUUID()}${extension}`;

      await this.client.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );

      return objectName;
    } catch (error) {
      throw new ServiceUnavailableException(
        `Не удалось сохранить ${mediaKind === 'image' ? 'изображение' : 'видео'} в MinIO`,
        { cause: error },
      );
    }
  }

  async getMediaUrl(value: string, fallback: string): Promise<string> {
    if (!value || value.startsWith('/media/')) return value || fallback;

    try {
      await this.ensureBucket();
      await this.client.statObject(this.bucketName, value);
      return await this.client.presignedGetObject(this.bucketName, value, 7 * 24 * 60 * 60);
    } catch {
      return fallback;
    }
  }

  private async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucketName);
    if (!exists) await this.client.makeBucket(this.bucketName, 'us-east-1');
  }

  private getExtension(file: Express.Multer.File, mediaKind: 'image' | 'video') {
    const extension = extname(file.originalname).toLowerCase();
    if (/^\.[a-z0-9]{1,8}$/.test(extension)) return extension;
    return mediaKind === 'image' ? '.jpg' : '.webm';
  }
}
