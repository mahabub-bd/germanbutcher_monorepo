import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ActionTaken } from 'src/common/enums';
import { EmailService } from 'src/email/email.service';

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
  ) {}

  async create(createContactMessageDto: CreateContactMessageDto): Promise<ContactMessage> {
    const contactMessage = this.contactMessageRepository.create(createContactMessageDto);
    return await this.contactMessageRepository.save(contactMessage);
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
    const updatedMessage = await this.contactMessageRepository.save(contactMessage);

    // Send email if action taken is replied_via_email
    if (updateContactMessageDto.actionTaken === ActionTaken.REPLIED_VIA_EMAIL) {
      await this.emailService.sendContactResponseEmail({
        recipientName: contactMessage.name,
        recipientEmail: contactMessage.email,
        originalMessage: contactMessage.message,
        responseNotes: updateContactMessageDto.responseNotes || 'Thank you for your inquiry. We have responded to your message.',
        ticketId: contactMessage.id,
      });
    }

    return updatedMessage;
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
