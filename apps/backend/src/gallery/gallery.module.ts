// image-gallery.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentModule } from '../attachment/attachment.module';
import { Attachment } from '../attachment/entities/attachment.entity';
import { Gallery } from './entities/gallery.entity';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

@Module({
  imports: [TypeOrmModule.forFeature([Gallery, Attachment]), AttachmentModule],
  controllers: [GalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
