import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AddressModule } from 'src/address/address.module';
import { OtpService } from 'src/auth/otp.service';
import { SmsService } from 'src/auth/sms.service';
import { Role } from 'src/roles/entities/role.entity';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), AddressModule],
  providers: [UserService, SmsService, OtpService],
  controllers: [UserController],
  exports: [UserService, SmsService, OtpService],
})
export class UserModule {}
