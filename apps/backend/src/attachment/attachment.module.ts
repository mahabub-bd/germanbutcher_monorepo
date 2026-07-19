import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentController } from './attachment.controller';
import { AttachmentService } from './attachment.service';
import { Attachment } from './entities/attachment.entity';

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forFeature([Attachment])],
  controllers: [AttachmentController],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
