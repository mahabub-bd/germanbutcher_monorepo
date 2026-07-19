import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentModule } from 'src/attachment/attachment.module';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { Brand } from './entities/brand.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Brand]), AttachmentModule],
  controllers: [BrandController],
  providers: [BrandService],
})
export class BrandModule {}
