import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from 'src/attachment/entities/attachment.entity';

import { AttachmentService } from 'src/attachment/attachment.service';
import { SalesPartner } from './entities/sales-partner.entity';
import { SalesPartnerController } from './sales-partner.controller';
import { SalesPartnerService } from './sales-partner.service';

@Module({
  imports: [TypeOrmModule.forFeature([SalesPartner, Attachment])],
  controllers: [SalesPartnerController],
  providers: [SalesPartnerService, AttachmentService],
  exports: [SalesPartnerService, AttachmentService],
})
export class SalesPartnerModule {}
