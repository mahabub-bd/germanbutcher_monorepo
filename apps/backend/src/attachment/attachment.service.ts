import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Attachment } from './entities/attachment.entity';

@Injectable()
export class AttachmentService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly baseUrl: string;
  private readonly logger = new Logger(AttachmentService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Attachment)
    private readonly fileRepository: Repository<Attachment>,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>(
          'AWS_S3_SECRET_KEY',
        ),
      },
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    this.baseUrl = this.configService.get<string>('AWS_S3_BASE_URL');
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = '',
    galleryId?: string,
  ) {
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFileName = `${uuid()}.${fileExtension}`;
    const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    // Upload to S3
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      }),
    );

    // Create attachment with gallery relation
    const fileEntity = this.fileRepository.create({
      fileName: uniqueFileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `${this.baseUrl}/${key}`,
      key: key,
      gallery: { id: galleryId },
    });

    const savedFile = await this.fileRepository.save(fileEntity);
    return savedFile;
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = '',
    galleryId?: string,
  ) {
    try {
      const uploadedFiles = [];

      for (const file of files) {
        const fileExtension = file.originalname.split('.').pop();
        const uniqueFileName = `${uuid()}.${fileExtension}`;
        const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
          }),
        );

        const fileEntity = this.fileRepository.create({
          fileName: uniqueFileName,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `${this.baseUrl}/${key}`,
          key: key,
          gallery: { id: galleryId },
        });

        const savedFile = await this.fileRepository.save(fileEntity);
        uploadedFiles.push(savedFile);
      }

      return uploadedFiles;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to upload files: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }
  async deleteFile(fileId: string) {
    const fileEntity = await this.fileRepository.findOne({
      where: { id: fileId },
    });

    if (!fileEntity) {
      return {
        message: `File with ID ${fileId} not found`,
        statusCode: 404,
        data: null,
      };
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileEntity.key,
      });

      await this.s3Client.send(command);

      await this.fileRepository.remove(fileEntity);

      this.logger.log(`File deleted successfully: ${fileEntity.key}`);

      return {
        message: 'File deleted successfully',
        statusCode: 200,
        data: null,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to delete file: ${err.message}`, err.stack);
      throw error;
    }
  }

  async findAll() {
    const files = await this.fileRepository.find({
      relations: ['gallery'],
      where: {},
    });

    return {
      message: 'Files retrieved successfully',
      statusCode: 200,
      data: files,
    };
  }

  async findOne(id: string) {
    const file = await this.fileRepository.findOne({
      relations: ['gallery'],
      where: { id },
    });

    if (!file) {
      return {
        message: `File with ID ${id} not found`,
        statusCode: 404,
        data: null,
      };
    }

    return {
      message: 'File retrieved successfully',
      statusCode: 200,
      data: file,
    };
  }

  async updateAttachment(id: string, updateData: Partial<Attachment>) {
    await this.fileRepository.update(id, updateData);
    return this.findOne(id);
  }
}
