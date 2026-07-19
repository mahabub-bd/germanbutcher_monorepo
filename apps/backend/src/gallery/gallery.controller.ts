// gallery.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Attachment } from '../attachment/entities/attachment.entity';

import { ApiResponseDto } from 'src/common/types';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { Gallery } from './entities/gallery.entity';
import { GalleryService } from './gallery.service';

@ApiTags('Galleries')
@Controller('galleries')
@ApiBearerAuth('token')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Create a new gallery with images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create gallery with images',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Summer Vacation Photos',
        },
        description: {
          type: 'string',
          example: 'Photos from our 2023 summer trip',
          nullable: true,
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async create(
    @Body() createGalleryDto: CreateGalleryDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const data = await this.galleryService.createGalleryWithImages(
      createGalleryDto,
      files,
    );

    return {
      message: 'Gallery created with images successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all galleries' })
  @ApiOkResponse({
    description: 'Galleries retrieved successfully',
    type: ApiResponseDto<[Gallery]>,
  })
  async findAll() {
    const data = await this.galleryService.findAllGalleries();
    return {
      message: 'Galleries retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a gallery by ID' })
  @ApiParam({ name: 'id', description: 'Gallery ID' })
  @ApiOkResponse({
    description: 'Gallery retrieved successfully',
    type: ApiResponseDto<Gallery>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Gallery not found',
  })
  async findOne(@Param('id') id: string) {
    const data = await this.galleryService.findGalleryById(id);
    return {
      message: 'Gallery retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Add attachment to a gallery' })
  @ApiParam({ name: 'id', description: 'Gallery ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Attachment added to gallery',
    type: ApiResponseDto<Attachment>,
  })
  async addAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.galleryService.addAttachmentToGallery(id, file);
    return {
      message: 'Attachment added to gallery',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @Delete(':id/attachments/:attachmentId')
  @ApiOperation({ summary: 'Remove attachment from gallery' })
  @ApiParam({ name: 'id', description: 'Gallery ID' })
  @ApiParam({ name: 'attachmentId', description: 'Attachment ID' })
  @ApiOkResponse({
    description: 'Attachment removed from gallery',
    type: ApiResponseDto<null>,
  })
  async removeAttachment(
    @Param('id') galleryId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    await this.galleryService.removeAttachmentFromGallery(
      galleryId,
      attachmentId,
    );
    return {
      message: 'Attachment removed from gallery',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a gallery' })
  @ApiParam({ name: 'id', description: 'Gallery ID' })
  @ApiOkResponse({
    description: 'Gallery deleted successfully',
    type: ApiResponseDto<null>,
  })
  async delete(@Param('id') id: string) {
    await this.galleryService.deleteGallery(id);
    return {
      message: 'Gallery deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
