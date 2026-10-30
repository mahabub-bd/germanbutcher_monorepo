import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, SelectQueryBuilder } from 'typeorm';
import { ActionTaken, ContactStatus } from 'src/common/enums';
import { EmailService } from 'src/email/email.service';
import { NotificationService } from 'src/notification/notification.service';

import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';
import { ContactMessageQueryDto } from './dto/contact-message-query.dto';
import { ContactMessage } from './entities/contact-message.entity';
import {
  ContactMessageReply,
  ReplySenderType,
} from './entities/contact-message-reply.entity';

@Injectable()
export class ContactMessageService {
  constructor(
    @InjectRepository(ContactMessage)
    private contactMessageRepository: Repository<ContactMessage>,
    @InjectRepository(ContactMessageReply)
    private replyRepository: Repository<ContactMessageReply>,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) {}

  async create(
    createContactMessageDto: CreateContactMessageDto,
    userId?: number,
  ): Promise<ContactMessage> {
    const contactMessage = this.contactMessageRepository.create({
      ...createContactMessageDto,
      userId: userId ?? null,
    });
    const saved = await this.contactMessageRepository.save(contactMessage);

    // Same realtime alert path as new orders — admins get a toast + bell entry
    try {
      await this.notificationService.notifyNewMessage({
        id: saved.id,
        name: saved.name,
        email: saved.email,
        message: saved.message,
      });
    } catch {
      // Alerting must never fail the message creation
    }

    return saved;
  }

  /**
   * Joins the sender user and both users' profile photos. Both users are
   * partially selected — only the columns the inbox UI needs — so private
   * columns (password hash, OTP, ...) never leave the API.
   */
  private withAvatars(
    qb: SelectQueryBuilder<ContactMessage>,
  ): SelectQueryBuilder<ContactMessage> {
    return qb
      .leftJoinAndSelect('contact_message.handledBy', 'handledBy')
      .leftJoin('handledBy.profilePhoto', 'handlerPhoto')
      .addSelect(['handlerPhoto.id', 'handlerPhoto.url'])
      .leftJoin('contact_message.user', 'customer')
      .addSelect(['customer.id', 'customer.name', 'customer.profilePhotoId'])
      .leftJoin('customer.profilePhoto', 'customerPhoto')
      .addSelect(['customerPhoto.id', 'customerPhoto.url']);
  }

  /**
   * Paginated messages sent by a specific user (the authenticated customer).
   */
  async findForUser(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.withAvatars(
      this.contactMessageRepository.createQueryBuilder('contact_message'),
    )
      .where('contact_message.userId = :userId', { userId })
      .orderBy('contact_message.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      message: 'Contact messages retrieved successfully',
      statusCode: 200,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findAll(query: ContactMessageQueryDto) {
    const { page = 1, limit = 10, status, source, priority, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.withAvatars(
      this.contactMessageRepository.createQueryBuilder('contact_message'),
    ).orderBy('contact_message.createdAt', 'DESC');

    // Filter by status
    if (status) {
      queryBuilder.andWhere('contact_message.contactStatus = :status', { status });
    }

    // Filter by source channel (website, facebook, phone, ...)
    if (source) {
      queryBuilder.andWhere('contact_message.source = :source', { source });
    }

    // Filter by priority (low, medium, high)
    if (priority) {
      queryBuilder.andWhere('contact_message.priority = :priority', {
        priority,
      });
    }

    // Search by name or email
    if (search) {
      queryBuilder.andWhere(
        '(contact_message.name ILIKE :search OR contact_message.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Contact messages retrieved successfully',
      statusCode: 200,
      data,
      total,
      page: page.toString(),
      limit: limit.toString(),
      totalPages
    };
  }

  async findOne(id: number): Promise<ContactMessage> {
    const contactMessage = await this.withAvatars(
      this.contactMessageRepository.createQueryBuilder('contact_message'),
    )
      .where('contact_message.id = :id', { id })
      .getOne();

    if (!contactMessage) {
      throw new NotFoundException(`Contact message with ID ${id} not found`);
    }

    return contactMessage;
  }

  async update(id: number, updateContactMessageDto: UpdateContactMessageDto): Promise<ContactMessage> {
    const contactMessage = await this.findOne(id);

    Object.assign(contactMessage, updateContactMessageDto);
    return this.contactMessageRepository.save(contactMessage);
  }

  async sendReply(
    id: number,
    responseNotes: string,
    contactStatus?: ContactStatus,
    handledById?: number,
  ): Promise<ContactMessage> {
    const contactMessage = await this.findOne(id);

    await this.emailService.sendContactResponseEmailOrThrow({
      recipientName: contactMessage.name,
      recipientEmail: contactMessage.email,
      originalMessage: contactMessage.message,
      responseNotes,
      ticketId: contactMessage.id,
    });

    // Written through update() so the reply also records *who* answered —
    // save() would keep the previously joined handler relation and its FK.
    await this.contactMessageRepository.update(id, {
      actionTaken: ActionTaken.REPLIED_VIA_EMAIL,
      responseNotes,
      ...(contactStatus ? { contactStatus } : {}),
      ...(handledById ? { handledById } : {}),
    });

    // The reply is also appended to the in-app thread so the customer can
    // continue the conversation from their support page (not just email).
    await this.replyRepository.save(
      this.replyRepository.create({
        contactMessageId: id,
        message: responseNotes,
        senderType: 'admin' satisfies ReplySenderType,
        adminId: handledById ?? null,
      }),
    );

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const contactMessage = await this.findOne(id);
    await this.contactMessageRepository.remove(contactMessage);
  }

  /**
   * Customer follow-up on their own ticket. The ticket stays open for
   * conversation: pending/resolved/closed all move to in_progress so the
   * support team sees it again, and admins get the same realtime alert path
   * as a brand-new ticket.
   */
  async addCustomerReply(
    id: number,
    message: string,
    customerId: number,
  ): Promise<ContactMessageReply> {
    const contactMessage = await this.findOne(id);
    if (Number(contactMessage.userId) !== Number(customerId)) {
      throw new ForbiddenException(
        'You can only reply to your own support tickets',
      );
    }

    const reply = await this.replyRepository.save(
      this.replyRepository.create({
        contactMessageId: id,
        message,
        senderType: 'customer' satisfies ReplySenderType,
        customerId,
      }),
    );

    if (contactMessage.contactStatus !== ContactStatus.IN_PROGRESS) {
      await this.contactMessageRepository.update(id, {
        contactStatus: ContactStatus.IN_PROGRESS,
      });
    }

    try {
      await this.notificationService.notifyNewMessage({
        id: contactMessage.id,
        name: contactMessage.name,
        email: contactMessage.email,
        message,
      });
    } catch {
      // Alerting must never fail the reply
    }

    return reply;
  }

  /** Full conversation for one ticket, oldest first. */
  async getReplies(id: number): Promise<ContactMessageReply[]> {
    return this.replyRepository.find({
      where: { contactMessageId: id },
      order: { createdAt: 'ASC' },
    });
  }

  async getStatistics() {
    const stats = await this.contactMessageRepository
      .createQueryBuilder('contact_message')
      .select('contact_message.contactStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('contact_message.contactStatus')
      .getRawMany();

    const total = await this.contactMessageRepository.count();

    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {})
    };
  }
}
