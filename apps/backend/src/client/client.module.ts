import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentService } from 'src/attachment/attachment.service';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { Client } from './entities/client.entity';

@Module({
  controllers: [ClientController],
  providers: [ClientService, AttachmentService],
  imports: [TypeOrmModule.forFeature([Client, Attachment])],
  exports: [AttachmentService],
})
export class ClientModule {}
