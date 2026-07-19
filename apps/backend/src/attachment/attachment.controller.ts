import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { AttachmentService } from './attachment.service';
import { AttachmentDto, AttachmentsDto } from './dto/attachment.dto';
import { Attachment } from './entities/attachment.entity';

@ApiTags('Attachment')
@Controller('attachment')
@ApiBearerAuth('token')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Upload a file to AWS S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: AttachmentDto,
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Optional folder path for the file',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<ApiResponseDto<Attachment>> {
    const data = await this.attachmentService.uploadFile(file, folder);
    return {
      message: 'Attachment created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload multiple files to AWS S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: AttachmentsDto,
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Optional folder path for the files',
  })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ): Promise<ApiResponseDto<Attachment[]>> {
    const data = await this.attachmentService.uploadMultipleFiles(
      files,
      folder,
    );

    return {
      message: 'Multiple Attchment created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }
  @Get()
  @ApiOperation({ summary: 'Get all files' })
  async getAllFiles() {
    return this.attachmentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  async getFile(@Param('id') id: string) {
    return this.attachmentService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file from AWS S3' })
  async deleteFile(@Param('id') id: string) {
    return this.attachmentService.deleteFile(id);
  }
}
