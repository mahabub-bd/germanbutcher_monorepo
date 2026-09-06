import { Module } from '@nestjs/common';
import { OnlineUsersController } from './online-users.controller';
import { OnlineUsersService } from './online-users.service';

@Module({
  controllers: [OnlineUsersController],
  providers: [OnlineUsersService],
  exports: [OnlineUsersService],
})
export class OnlineUsersModule {}
