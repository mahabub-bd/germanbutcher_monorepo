import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Repository } from 'typeorm';
import { CreateSalesPointDto } from './dto/create-sales-point.dto';
import { QuerySalesPointDto } from './dto/query-sales-point.dto';
import { UpdateSalesPointDto } from './dto/update-sales-point.dto';
import { SalesPoint } from './entities/sales-point.entity';

@Injectable()
export class SalesPointService {
  constructor(
    @InjectRepository(SalesPoint)
    private readonly salesPointRepository: Repository<SalesPoint>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
  ) {}

  async create(createSalesPointDto: CreateSalesPointDto): Promise<SalesPoint> {
    try {
      if (createSalesPointDto.logoAttachmentId) {
        await this.validateLogoAttachment(createSalesPointDto.logoAttachmentId);
      }

      const salesPoint = this.salesPointRepository.create(createSalesPointDto);
      const savedSalesPoint = await this.salesPointRepository.save(salesPoint);

      return await this.findOne(savedSalesPoint.id);
    } catch (error) {
      const err = error as Error;
      throw new BadRequestException(
        'Failed to create sales point: ' + err.message,
      );
    }
  }

  async findAll(query: QuerySalesPointDto) {
    const {
      page = 1,
      limit = 10,
      shopSearch,
      division,
      district,
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.salesPointRepository
      .createQueryBuilder('sales_point')
      .leftJoinAndSelect('sales_point.logoAttachment', 'logoAttachment')
      .leftJoinAndSelect('sales_point.shops', 'shops');

    // Apply filters
    if (isActive !== undefined && isActive !== null) {
      queryBuilder.andWhere('sales_point.isActive = :isActive', { isActive });
    }

    // Global search across all sales point and shop fields
    if (shopSearch) {
      queryBuilder.andWhere(
        `(
        sales_point.name ILIKE :shopSearch OR 
        sales_point.description ILIKE :shopSearch OR 
        sales_point.email ILIKE :shopSearch OR 
        sales_point.website ILIKE :shopSearch OR 
        sales_point.contactNumber ILIKE :shopSearch OR
        shops.shopName ILIKE :shopSearch OR
        shops.division ILIKE :shopSearch OR
        shops.district ILIKE :shopSearch OR
        shops.address ILIKE :shopSearch
      )`,
        { shopSearch: `%${shopSearch}%` },
      );
    }

    // Location filters (specific filtering)
    if (division) {
      queryBuilder.andWhere('shops.division ILIKE :division', {
        division: `%${division}%`,
      });
    }

    if (district) {
      queryBuilder.andWhere('shops.district ILIKE :district', {
        district: `%${district}%`,
      });
    }

    // Order by sales point order, then by creation date as fallback
    queryBuilder
      .orderBy('sales_point.order', 'ASC')
      .addOrderBy('sales_point.createdAt', 'DESC');

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Sales points retrieved successfully',
      statusCode: 200,
      data,
      total,
      page: page.toString(),
      limit: limit.toString(),
      totalPages,
    };
  }

  async findOne(id: number): Promise<SalesPoint> {
    const salesPoint = await this.salesPointRepository.findOne({
      where: { id },
      relations: ['logoAttachment', 'shops'],
    });

    if (!salesPoint) {
      throw new NotFoundException(`Sales point with ID ${id} not found`);
    }

    return salesPoint;
  }

  async update(
    id: number,
    updateSalesPointDto: UpdateSalesPointDto,
  ): Promise<SalesPoint> {
    const salesPoint = await this.findOne(id);

    if (updateSalesPointDto.logoAttachmentId) {
      await this.validateLogoAttachment(updateSalesPointDto.logoAttachmentId);
    }

    Object.assign(salesPoint, updateSalesPointDto);
    await this.salesPointRepository.save(salesPoint);

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const salesPoint = await this.findOne(id);
    await this.salesPointRepository.remove(salesPoint);
  }

  private async validateLogoAttachment(attachmentId: number) {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId.toString() },
    });
    if (!attachment) {
      throw new BadRequestException(
        `Logo attachment with ID ${attachmentId} not found`,
      );
    }
  }
}
