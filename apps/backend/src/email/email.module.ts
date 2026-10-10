import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessSetting } from 'src/business-settings/entities/business-setting.entity';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([BusinessSetting])],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
