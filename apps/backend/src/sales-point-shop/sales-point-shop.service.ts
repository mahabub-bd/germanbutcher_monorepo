import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SalesPoint } from 'src/sales-point/entities/sales-point.entity';
import { Repository } from 'typeorm';
import { CreateSalesPointShopDto } from './dto/create-sales-point-shop.dto';

import { HttpStatus } from '@nestjs/common';
import { UpdateSalesPointShopDto } from './dto/update-sales-point-shop.dto';
import { SalesPointShop } from './entities/sales-point-shop.entity';

@Injectable()
export class SalesPointShopService {
  constructor(
    @InjectRepository(SalesPointShop)
    private readonly salesPointShopRepository: Repository<SalesPointShop>,
    @InjectRepository(SalesPoint)
    private readonly salesPointRepository: Repository<SalesPoint>,
  ) {}

  async create(
    createSalesPointShopDto: CreateSalesPointShopDto,
  ): Promise<SalesPointShop> {
    try {
      await this.validateSalesPoint(createSalesPointShopDto.salesPointId);

      const salesPointShop = this.salesPointShopRepository.create(
        createSalesPointShopDto,
      );
      const savedShop =
        await this.salesPointShopRepository.save(salesPointShop);

      return {
        message: 'Sales point shop created successfully',
        statusCode: HttpStatus.CREATED,
        data: savedShop,
      } as any;
    } catch (error) {
      const err = error as Error;
      throw new BadRequestException(
        'Failed to create sales point shop: ' + err.message,
      );
    }
  }

  async findAll(salesPointId?: number, page: number = 1, limit: number = 20) {
    const whereCondition: any = {};

    if (salesPointId) {
      whereCondition.salesPointId = salesPointId;
      // Or if the relationship is nested: whereCondition.salesPoint = { id: salesPointId };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count and paginated data
    const [data, total] = await this.salesPointShopRepository.findAndCount({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Sales point shops retrieved successfully',
      statusCode: HttpStatus.ACCEPTED,
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
    };
  }

  async findOne(id: number, includeSalesPoint: boolean = false): Promise<any> {
    const relations = includeSalesPoint
      ? ['salesPoint', 'salesPoint.logoAttachment']
      : [];

    const salesPointShop = await this.salesPointShopRepository.findOne({
      where: { id },
      relations,
    });

    if (!salesPointShop) {
      throw new NotFoundException(`Sales point shop with ID ${id} not found`);
    }

    return {
      message: 'Sales point shop retrieved successfully',
      statusCode: 200,
      data: salesPointShop,
    };
  }

  async update(
    id: number,
    updateSalesPointShopDto: UpdateSalesPointShopDto,
  ): Promise<any> {
    const shopResult = await this.findOne(id);
    const salesPointShop = shopResult.data;

    Object.assign(salesPointShop, updateSalesPointShopDto);

    const updatedShop =
      await this.salesPointShopRepository.save(salesPointShop);

    return {
      message: 'Sales point shop updated successfully',
      statusCode: 200,
      data: updatedShop,
    };
  }

  async remove(id: number): Promise<any> {
    const shopResult = await this.findOne(id);
    const salesPointShop = shopResult.data;

    await this.salesPointShopRepository.remove(salesPointShop);

    return {
      message: 'Sales point shop deleted successfully',
      statusCode: 200,
    };
  }

  async getStatistics() {
    const total = await this.salesPointShopRepository.count();
    const totalActive = await this.salesPointShopRepository.count({
      where: { isActive: true },
    });

    const byDivision = await this.salesPointShopRepository
      .createQueryBuilder('shop')
      .select('shop.division', 'division')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        'COUNT(CASE WHEN shop.isActive = true THEN 1 END)',
        'activeCount',
      )
      .groupBy('shop.division')
      .getRawMany();

    const byDistrict = await this.salesPointShopRepository
      .createQueryBuilder('shop')
      .select('shop.district', 'district')
      .addSelect('shop.division', 'division')
      .addSelect('COUNT(*)', 'count')
      .groupBy('shop.district, shop.division')
      .orderBy('shop.division')
      .addOrderBy('COUNT(*)', 'DESC')
      .getRawMany();

    const bySalesPoint = await this.salesPointShopRepository
      .createQueryBuilder('shop')
      .leftJoin('shop.salesPoint', 'sp')
      .select('sp.name', 'salesPointName')
      .addSelect('sp.id', 'salesPointId')
      .addSelect('COUNT(shop.id)', 'shopsCount')
      .addSelect(
        'COUNT(CASE WHEN shop.isActive = true THEN 1 END)',
        'activeShopsCount',
      )
      .groupBy('sp.id, sp.name')
      .orderBy('COUNT(shop.id)', 'DESC')
      .getRawMany();

    const topDistricts = await this.salesPointShopRepository
      .createQueryBuilder('shop')
      .select('shop.district', 'district')
      .addSelect('shop.division', 'division')
      .addSelect('COUNT(*)', 'count')
      .groupBy('shop.district, shop.division')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      message: 'Shop statistics retrieved successfully',
      statusCode: 200,
      data: {
        overview: {
          total,
          totalActive,
          totalInactive: total - totalActive,
        },
        byDivision: byDivision.map((item) => ({
          division: item.division,
          total: parseInt(item.count),
          active: parseInt(item.activeCount),
        })),
        byDistrict: byDistrict.map((item) => ({
          district: item.district,
          division: item.division,
          count: parseInt(item.count),
        })),
        bySalesPoint: bySalesPoint.map((item) => ({
          salesPointId: parseInt(item.salesPointId),
          salesPointName: item.salesPointName,
          totalShops: parseInt(item.shopsCount),
          activeShops: parseInt(item.activeShopsCount),
        })),
        topDistricts: topDistricts.map((item) => ({
          district: item.district,
          division: item.division,
          count: parseInt(item.count),
        })),
      },
    };
  }

  async toggleStatus(id: number): Promise<any> {
    const shopResult = await this.findOne(id);
    const salesPointShop = shopResult.data;

    salesPointShop.isActive = !salesPointShop.isActive;
    const updatedShop =
      await this.salesPointShopRepository.save(salesPointShop);

    return {
      message: `Sales point shop ${updatedShop.isActive ? 'activated' : 'deactivated'} successfully`,
      statusCode: 200,
      data: updatedShop,
    };
  }

  private async validateSalesPoint(salesPointId: number): Promise<SalesPoint> {
    const salesPoint = await this.salesPointRepository.findOne({
      where: { id: salesPointId },
    });
    if (!salesPoint) {
      throw new BadRequestException(
        `Sales point with ID ${salesPointId} not found`,
      );
    }
    return salesPoint;
  }
}
