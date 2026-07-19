import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AttachmentService } from 'src/attachment/attachment.service';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Repository } from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    private readonly attachmentService: AttachmentService,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    try {
      const image = await this.attachmentRepository.findOne({
        where: { id: createClientDto.Image.toString() },
      });

      if (!image) {
        throw new NotFoundException('Attachment not found');
      }

      const client = this.clientRepository.create({
        ...createClientDto,
        Image: image,
      });

      return await this.clientRepository.save(client);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create client');
    }
  }

  async update(id: number, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { Id: id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (updateClientDto.Image) {
      const image = await this.attachmentRepository.findOne({
        where: { id: updateClientDto.Image.toString() },
      });

      if (!image) {
        throw new NotFoundException('Attachment not found');
      }

      client.Image = image;
    }

    Object.assign(client, updateClientDto);

    return this.clientRepository.save(client);
  }

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find({
      order: {
        order: 'ASC',
      },
    });
  }

  async findOne(Id: number): Promise<Client> {
    return this.clientRepository.findOne({ where: { Id } });
  }

  async remove(id: number): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: { Id: id },
      relations: ['attachment'],
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.Image) {
      const attachmentId = client.Image.id;
      await this.attachmentService.deleteFile(attachmentId);
    }

    await this.clientRepository.remove(client);
  }
}
