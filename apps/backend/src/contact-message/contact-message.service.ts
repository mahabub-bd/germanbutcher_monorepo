import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ActionTaken, ContactStatus } from 'src/common/enums';
import { EmailService } from 'src/email/email.service';
import { NotificationService } from 'src/notification/notification.service';

import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';
import { ContactMessageQueryDto } from './dto/contact-message-query.dto';
import { ContactMessage } from './entities/contact-message.entity';

@Injectable()
export class ContactMessageService {
  constructor(
    @InjectRepository(ContactMessage)
    private contactMessageRepository: Repository<ContactMessage>,
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
   * Paginated messages sent by a specific user (the authenticated customer).
   */
  async findForUser(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.contactMessageRepository
      .createQueryBuilder('contact_message')
      .leftJoinAndSelect('contact_message.handledBy', 'handledBy')
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
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.contactMessageRepository
      .createQueryBuilder('contact_message')
      .leftJoinAndSelect('contact_message.handledBy', 'handledBy')
      .orderBy('contact_message.createdAt', 'DESC');

    // Filter by status
    if (status) {
      queryBuilder.andWhere('contact_message.contactStatus = :status', { status });
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
    const contactMessage = await this.contactMessageRepository.findOne({
      where: { id },
      relations: ['handledBy']
    });

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
  ): Promise<ContactMessage> {
    const contactMessage = await this.findOne(id);

    await this.emailService.sendContactResponseEmailOrThrow({
      recipientName: contactMessage.name,
      recipientEmail: contactMessage.email,
      originalMessage: contactMessage.message,
      responseNotes,
      ticketId: contactMessage.id,
    });

    contactMessage.actionTaken = ActionTaken.REPLIED_VIA_EMAIL;
    contactMessage.responseNotes = responseNotes;
    if (contactStatus) contactMessage.contactStatus = contactStatus;
    return this.contactMessageRepository.save(contactMessage);
  }

  async remove(id: number): Promise<void> {
    const contactMessage = await this.findOne(id);
    await this.contactMessageRepository.remove(contactMessage);
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
