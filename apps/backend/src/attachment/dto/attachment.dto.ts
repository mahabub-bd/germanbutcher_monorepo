import { ApiProperty } from '@nestjs/swagger';

export class AttachmentDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File;
}

export class AttachmentsDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files?: Express.Multer.File[];
}
