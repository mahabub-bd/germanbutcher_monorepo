import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AttachmentService } from 'src/attachment/attachment.service';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { ILike, Repository } from 'typeorm';
import { CreateSalesPartnerDto } from './dto/create-sales-partner.dto';
import { UpdateSalesPartnerDto } from './dto/update-sales-partner.dto';
import { SalesPartner } from './entities/sales-partner.entity';

interface FindAllOptions {
  active?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class SalesPartnerService {
  constructor(
    @InjectRepository(SalesPartner)
    private salesPartnerRepository: Repository<SalesPartner>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    private readonly attachmentService: AttachmentService,
  ) {}

  async create(
    createSalesPartnerDto: CreateSalesPartnerDto,
  ): Promise<SalesPartner> {
    try {
      const image = await this.attachmentRepository.findOne({
        where: { id: createSalesPartnerDto.Image.toString() },
      });

      if (!image) {
        throw new NotFoundException('Attachment not found');
      }

      const existingSalesPartner = await this.salesPartnerRepository.findOne({
        where: { name: ILike(createSalesPartnerDto.name) },
      });

      if (existingSalesPartner) {
        throw new ConflictException(
          'Sales partner with this name already exists',
        );
      }

      const salesPartner = this.salesPartnerRepository.create({
        ...createSalesPartnerDto,
        Image: image,
      });

      const savedSalesPartner =
        await this.salesPartnerRepository.save(salesPartner);

      return savedSalesPartner;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Error creating sales partner:', error);

      throw new InternalServerErrorException('Failed to create sales partner');
    }
  }

  async update(
    id: number,
    updateSalesPartnerDto: UpdateSalesPartnerDto,
  ): Promise<SalesPartner> {
    const salesPartner = await this.salesPartnerRepository.findOne({
      where: { Id: id },
      relations: ['Image'],
    });

    if (!salesPartner) {
      throw new NotFoundException('Sales partner not found');
    }

    // Check if name already exists (excluding current record)
    if (updateSalesPartnerDto.name) {
      const existingSalesPartner = await this.salesPartnerRepository.findOne({
        where: { name: updateSalesPartnerDto.name },
      });

      if (existingSalesPartner && existingSalesPartner.Id !== id) {
        throw new BadRequestException(
          'Sales partner with this name already exists',
        );
      }
    }

    // Handle image update
    if (updateSalesPartnerDto.Image) {
      const image = await this.attachmentRepository.findOne({
        where: { id: String(updateSalesPartnerDto.Image) },
      });

      if (!image) {
        throw new NotFoundException('Attachment not found');
      }

      salesPartner.Image = image;
    }

    // Update other fields
    Object.assign(salesPartner, updateSalesPartnerDto);

    try {
      return await this.salesPartnerRepository.save(salesPartner);
    } catch (error) {
      throw new BadRequestException('Failed to update sales partner');
    }
  }

  async findAll(options: FindAllOptions = {}): Promise<SalesPartner[]> {
    const { active, limit, offset } = options;

    const queryBuilder = this.salesPartnerRepository
      .createQueryBuilder('salesPartner')
      .leftJoinAndSelect('salesPartner.Image', 'image')
      .orderBy('salesPartner.order', 'ASC')
      .addOrderBy('salesPartner.name', 'ASC');

    if (active !== undefined) {
      queryBuilder.where('salesPartner.isActive = :active', { active });
    }

    if (limit) {
      queryBuilder.limit(limit);
    }

    if (offset) {
      queryBuilder.offset(offset);
    }

    return await queryBuilder.getMany();
  }

  async findAllActive(): Promise<SalesPartner[]> {
    return await this.salesPartnerRepository.find({
      where: { isActive: true },
      relations: ['Image'],
      order: {
        order: 'ASC',
        name: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<SalesPartner> {
    const salesPartner = await this.salesPartnerRepository.findOne({
      where: { Id: id },
      relations: ['Image'],
    });

    if (!salesPartner) {
      throw new NotFoundException('Sales partner not found');
    }

    return salesPartner;
  }

  async toggleStatus(id: number): Promise<SalesPartner> {
    const salesPartner = await this.findOne(id);

    salesPartner.isActive = !salesPartner.isActive;

    return await this.salesPartnerRepository.save(salesPartner);
  }

  async remove(id: number): Promise<void> {
    const salesPartner = await this.findOne(id);

    if (!salesPartner) {
      throw new NotFoundException('Sales partner not found');
    }

    const attachmentId = salesPartner.Image?.id;

    try {
      await this.salesPartnerRepository.remove(salesPartner);

      if (attachmentId) {
        await this.attachmentService.deleteFile(attachmentId);
      }
    } catch (error) {
      console.error('Error deleting sales partner:', error);
      throw new BadRequestException('Failed to delete sales partner');
    }
  }

  async count(isActive?: boolean): Promise<number> {
    const where = isActive !== undefined ? { isActive } : {};
    return await this.salesPartnerRepository.count({ where });
  }

  async updateOrder(id: number, newOrder: number): Promise<SalesPartner> {
    const salesPartner = await this.findOne(id);
    salesPartner.order = newOrder;
    return await this.salesPartnerRepository.save(salesPartner);
  }

  async searchByName(name: string): Promise<SalesPartner[]> {
    return await this.salesPartnerRepository
      .createQueryBuilder('salesPartner')
      .leftJoinAndSelect('salesPartner.Image', 'image')
      .where('salesPartner.name ILIKE :name', { name: `%${name}%` })
      .orderBy('salesPartner.order', 'ASC')
      .getMany();
  }
}
