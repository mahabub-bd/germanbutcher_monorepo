import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { User } from 'src/user/entities/user.entity';
import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';
import { Banner } from './entities/banner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Banner, Attachment, User])],
  controllers: [BannerController],
  providers: [BannerService],
})
export class BannerModule {}
