import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from '../notification/notification.module';
import { ContactMessageController } from './contact-message.controller';
import { ContactMessageService } from './contact-message.service';
import { ContactMessage } from './entities/contact-message.entity';
import { ContactMessageReply } from './entities/contact-message-reply.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactMessage, ContactMessageReply]),
    NotificationModule,
  ],
  controllers: [ContactMessageController],
  providers: [ContactMessageService],
  exports: [ContactMessageService],
})
export class ContactMessageModule {}
