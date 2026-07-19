import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AttachmentService } from 'src/attachment/attachment.service';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand } from './entities/brand.entity';
interface FindAllBrandsOptions {
  page?: number;
  limit?: number;
  search?: string;
  slug?: string;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}
@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    private readonly attachmentService: AttachmentService,
  ) {}

  async create(createBrandDto: CreateBrandDto, user: User): Promise<Brand> {
    const brand = this.brandRepository.create({
      ...createBrandDto,
      updatedBy: user?.userId,
      createdBy: user?.userId,
    });
    return this.brandRepository.save(brand);
  }

  async findAll(
    options: FindAllBrandsOptions = {},
  ): Promise<[Brand[], number]> {
    const {
      page = 1,
      limit = 50,
      search,
      slug,
      sort,
      minPrice,
      maxPrice,
      isActive,
    } = options;

    const skip = (page - 1) * limit;

    const queryBuilder = this.brandRepository
      .createQueryBuilder('brand')
      .leftJoinAndSelect('brand.products', 'products')
      .leftJoinAndSelect('brand.attachment', 'attachment')
      .leftJoinAndSelect('products.attachment', 'productAttachment');

    if (slug) {
      queryBuilder.andWhere('brand.slug = :slug', { slug });
    }

    if (search) {
      queryBuilder.andWhere('brand.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      queryBuilder.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('product.id')
          .from(Product, 'product')
          .where('product.brandId = brand.id');

        if (minPrice !== undefined) {
          subQuery.andWhere('product.sellingPrice >= :minPrice', { minPrice });
        }
        if (maxPrice !== undefined) {
          subQuery.andWhere('product.sellingPrice <= :maxPrice', { maxPrice });
        }

        return 'EXISTS ' + subQuery.getQuery();
      });
    }

    if (sort) {
      switch (sort) {
        case 'price_asc':
          queryBuilder.orderBy('products.sellingPrice', 'ASC');
          break;
        case 'price_desc':
          queryBuilder.orderBy('products.sellingPrice', 'DESC');
          break;
        case 'name_asc':
          queryBuilder.orderBy('products.name', 'ASC');
          break;
        case 'name_desc':
          queryBuilder.orderBy('products.name', 'DESC');
          break;
      }
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('brand.isActive = :isActive', { isActive });
    }

    queryBuilder.skip(skip).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.brandRepository.findOne({
      where: { id },
      relations: ['products', 'attachment', 'products.attachment'],
    });
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return brand;
  }

  async update(
    id: number,
    updateBrandDto: UpdateBrandDto,
    user: User,
  ): Promise<Brand> {
    const brand = await this.findOne(id);
    brand.updatedBy = user?.userId;
    Object.assign(brand, updateBrandDto);
    return this.brandRepository.save(brand);
  }

  async remove(id: number): Promise<void> {
    const brand = await this.findOne(id);

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const attachmentId = brand?.attachment?.id;

    try {
      await this.brandRepository.remove(brand);

      if (attachmentId) {
        await this.attachmentService.deleteFile(attachmentId);
      }
    } catch (error) {
      throw new BadRequestException('Failed to delete brand');
    }
  }
}
