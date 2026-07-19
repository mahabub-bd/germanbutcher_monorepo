// src/user-activity/user-activity.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityInterceptor } from 'src/interceptor/activity.interceptor';
import { UserActivity } from './entities/user-activity.entity';
import { UserActivityController } from './user-activity.controller';
import { UserActivityService } from './user-activity.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserActivity])],
  providers: [UserActivityService, ActivityInterceptor],
  controllers: [UserActivityController],
  exports: [UserActivityService],
})
export class UserActivityModule {}
