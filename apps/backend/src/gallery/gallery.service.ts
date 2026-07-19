// gallery.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttachmentService } from '../attachment/attachment.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { Gallery } from './entities/gallery.entity';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(Gallery)
    private galleryRepository: Repository<Gallery>,
    private attachmentService: AttachmentService,
  ) {}

  async createGalleryWithImages(
    createGalleryDto: CreateGalleryDto,
    files: Express.Multer.File[],
  ) {
    const gallery = this.galleryRepository.create(createGalleryDto);

    await this.galleryRepository.save(gallery);

    if (files?.length) {
      await this.attachmentService.uploadMultipleFiles(
        files,
        `productgalleries/${gallery.id}`,
        gallery.id,
      );
    }

    const data = this.galleryRepository.findOne({
      where: { id: gallery.id },
      relations: ['attachments'],
    });

    return data;
  }
  async findAllGalleries() {
    return await this.galleryRepository.find({
      relations: ['attachments'],
    });
  }

  async findGalleryById(id: string) {
    const gallery = await this.galleryRepository.findOne({
      where: { id },
      relations: ['attachments'],
    });
    if (!gallery) throw new NotFoundException('Gallery not found');
    return gallery;
  }

  async updateGallery(id: string, updateGalleryDto: UpdateGalleryDto) {
    const gallery = await this.findGalleryById(id);
    Object.assign(gallery, updateGalleryDto);
    return await this.galleryRepository.save(gallery);
  }

  async deleteGallery(id: string) {
    const gallery = await this.findGalleryById(id);
    for (const attachment of gallery.attachments) {
      await this.attachmentService.deleteFile(attachment.id);
    }
    await this.galleryRepository.remove(gallery);
    return { message: 'Gallery deleted successfully' };
  }

  async addAttachmentToGallery(galleryId: string, file: Express.Multer.File) {
    const gallery = await this.findGalleryById(galleryId);

    const uploadResult = await this.attachmentService.uploadFile(
      file,
      `galleries/${galleryId}`,
      gallery.id,
    );

    return this.attachmentService.updateAttachment(
      uploadResult?.id,
      uploadResult,
    );
  }

  async removeAttachmentFromGallery(galleryId: string, attachmentId: string) {
    const gallery = await this.findGalleryById(galleryId);
    const attachment = await this.attachmentService.findOne(attachmentId);
    if (!gallery) throw new NotFoundException('Gallery not found');
    if (!attachment) throw new NotFoundException('Attachment not found');

    if (attachment.data.gallery.id !== gallery.id)
      throw new BadRequestException('Attachment not in gallery');

    await this.attachmentService.deleteFile(attachmentId);
    return { message: 'Attachment removed from gallery' };
  }
}
