import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { AttachmentService } from 'src/attachment/attachment.service';
import { Brand } from 'src/brand/entities/brand.entity';
import { Category } from 'src/category/entities/category.entity';
import { Gallery } from 'src/gallery/entities/gallery.entity';
import { Unit } from 'src/unit/entities/unit.entity';
import { User } from 'src/user/entities/user.entity';
import { Brackets, Repository } from 'typeorm';
import { Supplier } from '../supplier/entities/supplier.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

interface FindAllOptions {
  page?: number;
  limit?: number;
  categoryId?: number;
  brandId?: number;
  supplierId?: number;
  featured?: boolean;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  hasDiscount?: boolean;
  tags?: string;
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,

    @InjectRepository(Gallery)
    private galleryRepository: Repository<Gallery>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(Unit)
    private unitRepository: Repository<Unit>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    private attachmentService: AttachmentService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    user: User,
  ): Promise<Product> {
    const existingProduct = await this.productRepository.findOne({
      where: { name: createProductDto.name },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this name already exists');
    }

    const brand = await this.validateBrand(createProductDto.brandId);
    const category = await this.validateCategory(createProductDto.categoryId);
    const unit = await this.validateUnit(createProductDto.unitId);
    const supplier = await this.validateSupplier(createProductDto.supplierId);
    const gallery = await this.validateGallery(createProductDto.galleryId);

    // Create product without attachment field
    const { attachment, ...productData } = createProductDto;
    const product = this.productRepository.create({
      ...productData,
      brand,
      category,
      unit,
      supplier,
      gallery,
      createdBy: user?.userId,
      updatedBy: user?.userId,
    });

    // Handle attachment separately if provided
    if (attachment) {
      product.attachment = await this.validateAttachment(attachment);
    }

    return this.productRepository.save(product);
  }

  async findAll(options: FindAllOptions = {}): Promise<[Product[], number]> {
    const {
      page = 1,
      limit = 50,
      categoryId,
      brandId,
      supplierId,
      featured,
      search,
      sort,
      minPrice,
      maxPrice,
      isActive,
      hasDiscount,
      tags,
    } = options;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('category.parent', 'parentCategory')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .leftJoinAndSelect('product.unit', 'unit')
      .leftJoinAndSelect('product.attachment', 'attachment')
      .leftJoinAndSelect('product.gallery', 'gallery')
      .leftJoinAndSelect('gallery.attachments', 'attachments')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.updatedBy', 'updatedBy')

      .select([
        'product',
        'brand.id',
        'brand.name',
        'brand.slug',
        'category.id',
        'category.name',
        'category.slug',
        'parentCategory.id',
        'parentCategory.name',
        'parentCategory.slug',
        'supplier.id',
        'supplier.name',
        'unit.id',
        'unit.name',
        'gallery.id',
        'gallery.name',

        'attachments.id',
        'attachments.url',

        'attachment.id',
        'attachment.url',

        'createdBy.id',
        'createdBy.name',
        'updatedBy.id',
        'updatedBy.name',
      ]);

    if (categoryId) {
      query.andWhere(
        `(category.id = :categoryId OR category.parentId = :categoryId)`,
        { categoryId },
      );
    }

    if (brandId) query.andWhere('brand.id = :brandId', { brandId });
    if (supplierId) query.andWhere('supplier.id = :supplierId', { supplierId });
    if (featured !== undefined)
      query.andWhere('product.isFeatured = :featured', { featured });
    if (isActive !== undefined)
      query.andWhere('product.isActive = :isActive', { isActive });
    if (hasDiscount) query.andWhere('product.discountType IS NOT NULL');

    if (search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (minPrice !== undefined && Number.isFinite(minPrice))
      query.andWhere('product.sellingPrice >= :minPrice', { minPrice });
    if (maxPrice !== undefined && Number.isFinite(maxPrice))
      query.andWhere('product.sellingPrice <= :maxPrice', { maxPrice });

    // Filter by tags - tags is a comma-separated string
    if (tags) {
      const tagArray = tags.split(',').map((tag) => tag.trim());
      query.andWhere('product.tags && :tags', { tags: tagArray });
    }

    // Sorting with default
    if (sort) {
      switch (sort) {
        case 'price_asc':
          query.orderBy('product.sellingPrice', 'ASC');
          break;
        case 'price_desc':
          query.orderBy('product.sellingPrice', 'DESC');
          break;
        case 'name_asc':
          query.orderBy('product.name', 'ASC');
          break;
        case 'name_desc':
          query.orderBy('product.name', 'DESC');
          break;
      }
    } else {
      // Default sort: product name ascending
      query.orderBy('product.name', 'ASC');
    }

    return query
      .skip((page - 1) * limit)
      .take(limit)
      .cache(`products_page_${page}_${limit}`, 30000)
      .getManyAndCount();
  }

  async getBestsellingProducts(
    limit: number = 10,
    isActive?: boolean,
  ): Promise<Product[]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.attachment', 'attachment')
      .leftJoinAndSelect(
        'product.brand',
        'brand',
        'brand.isActive = :isActive',
        {
          isActive: true,
        },
      )
      .leftJoinAndSelect(
        'product.category',
        'category',
        'category.isActive = :isActive',
        {
          isActive: true,
        },
      )
      .leftJoinAndSelect('category.parent', 'parentCategory')
      .leftJoinAndSelect('product.unit', 'unit', 'unit.isActive = :isActive', {
        isActive: true,
      })
      .select([
        'product.id',
        'product.name',
        'unit.id',
        'unit.name',
        'product.slug',
        'product.weight',
        'product.sellingPrice',
        'product.stock',
        'product.saleCount',
        'product.isActive',
        'product.isFeatured',
        'product.discountType',
        'product.discountValue',
        'product.discountStartDate',
        'product.discountEndDate',
        'product.tags',
        'attachment.id',
        'attachment.url',
        'attachment.fileName',
        'brand.id',
        'brand.name',
        'brand.slug',
        'category.id',
        'category.name',
        'category.slug',
        'parentCategory.id',
        'parentCategory.name',
        'parentCategory.slug',
        'unit.id',
        'unit.name',
      ])
      .where('product.saleCount > 0');

    if (isActive !== undefined) {
      query.andWhere('product.isActive = :isActive', { isActive });
    }

    return await query
      .orderBy('product.saleCount', 'DESC')
      .addOrderBy('product.name', 'ASC')
      .take(limit)
      .cache(
        `bestselling_products_${limit}_${isActive ?? 'all'}`,
        30000,
      )
      .getMany();
  }

  async findActiveDiscounted(options: {
    page: number;
    limit: number;
    isActive?: boolean;
  }): Promise<[Product[], number]> {
    const { page = 1, limit = 50, isActive } = options;
    const now = new Date();

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect(
        'product.brand',
        'brand',
        'brand.isActive = :isActive',
        {
          isActive: true,
        },
      )
      .leftJoinAndSelect(
        'product.category',
        'category',
        'category.isActive = :isActive',
        {
          isActive: true,
        },
      )
      .leftJoinAndSelect('category.parent', 'parentCategory')
      .leftJoinAndSelect('product.unit', 'unit', 'unit.isActive = :isActive', {
        isActive: true,
      })
      .leftJoinAndSelect('product.attachment', 'attachment')
      .select([
        'product',
        'brand.id',
        'brand.name',
        'brand.slug',
        'category.id',
        'category.name',
        'category.slug',
        'parentCategory.id',
        'parentCategory.name',
        'parentCategory.slug',
        'unit.id',
        'unit.name',
        'attachment.id',
        'attachment.url',
        'attachment.fileName',
      ])
      .where('product.discountType IS NOT NULL')
      .andWhere('product.discountValue > 0')
      .andWhere(
        '(product.discountStartDate <= :now OR product.discountStartDate IS NULL)',
        { now },
      )
      .andWhere(
        '(product.discountEndDate >= :now OR product.discountEndDate IS NULL)',
        { now },
      );

    if (isActive !== undefined) {
      query.andWhere('product.isActive = :isActive', { isActive });
    }

    return query
      .orderBy('product.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .cache(
        `discounted_products_page_${page}_${limit}_${isActive ?? 'all'}`,
        30000,
      )
      .getManyAndCount();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect(
        'product.brand',
        'brand',
        'brand.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect(
        'product.category',
        'category',
        'category.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect('category.parent', 'parentCategory')
      .leftJoinAndSelect(
        'product.supplier',
        'supplier',
        'supplier.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect('product.unit', 'unit', 'unit.isActive = :isActive', {
        isActive: true,
      })
      .leftJoinAndSelect('product.attachment', 'attachment')
      .leftJoinAndSelect('product.gallery', 'gallery')
      .leftJoinAndSelect('gallery.attachments', 'attachments')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.updatedBy', 'updatedBy')
      .where('product.id = :id', { id })
      .select([
        'product.id',
        'product.name',
        'product.slug',
        'product.description',
        'product.productDetails',
        'product.sellingPrice',
        'product.purchasePrice',
        'product.stock',
        'product.saleCount',
        'product.productSku',
        'product.isActive',
        'product.isFeatured',
        'product.totalValueBySalePrice',
        'product.totalValueByPurchasePrice',
        'product.createdAt',
        'product.updatedAt',
        'product.discountType',
        'product.weight',
        'product.discountValue',
        'product.discountStartDate',
        'product.discountEndDate',
        'product.tags',

        'brand.id',
        'brand.name',
        'brand.slug',

        'category.id',
        'category.name',
        'category.slug',

        'parentCategory.id',
        'parentCategory.name',
        'parentCategory.slug',

        'supplier.id',
        'supplier.name',

        'unit.id',
        'unit.name',

        'gallery.id',
        'gallery.name',
        'gallery.description',

        'attachments.id',
        'attachments.url',
        'attachments.fileName',

        'attachment.id',
        'attachment.url',
        'attachment.fileName',

        'createdBy.id',
        'createdBy.name',
        'updatedBy.id',
        'updatedBy.name',
      ])
      .cache(`product_id_${id}`, 30000)
      .getOne();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }
  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect(
        'product.brand',
        'brand',
        'brand.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect(
        'product.category',
        'category',
        'category.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect('category.parent', 'parentCategory')
      .leftJoinAndSelect(
        'product.supplier',
        'supplier',
        'supplier.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect('product.unit', 'unit', 'unit.isActive = :isActive', {
        isActive: true,
      })
      .leftJoinAndSelect('product.attachment', 'attachment')
      .leftJoinAndSelect('product.gallery', 'gallery')
      .leftJoinAndSelect('gallery.attachments', 'attachments')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.updatedBy', 'updatedBy')
      .where('product.slug = :slug', { slug })
      .select([
        'product.id',
        'product.name',
        'product.slug',
        'product.description',
        'product.productDetails',
        'product.sellingPrice',
        'product.purchasePrice',
        'product.stock',
        'product.saleCount',
        'product.productSku',
        'product.isActive',
        'product.isFeatured',
        'product.totalValueBySalePrice',
        'product.totalValueByPurchasePrice',
        'product.createdAt',
        'product.updatedAt',
        'product.discountType',
        'product.weight',
        'product.discountValue',
        'product.discountStartDate',
        'product.discountEndDate',
        'product.tags',

        'brand.id',
        'brand.name',
        'brand.slug',

        'category.id',
        'category.name',
        'category.slug',

        'parentCategory.id',
        'parentCategory.name',
        'parentCategory.slug',

        'supplier.id',
        'supplier.name',

        'unit.id',
        'unit.name',

        'gallery.id',
        'gallery.name',
        'gallery.description',

        'attachments.id',
        'attachments.url',
        'attachments.fileName',

        'attachment.id',
        'attachment.url',
        'attachment.fileName',

        'createdBy.id',
        'createdBy.name',
        'updatedBy.id',
        'updatedBy.name',
      ])
      .cache(`product_slug_${slug}`, 30000)
      .getOne();

    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }

    return product;
  }
  async findSimilarBestSelling(options: {
    productId: number;
    limit?: number;
    includeChildren?: boolean;
  }): Promise<[Product[], Product]> {
    const { productId, limit = 8, includeChildren = true } = options;

    // Get the base product with its category
    const baseProduct = await this.productRepository.findOne({
      where: { id: productId, isActive: true },
      relations: ['category'],
      select: {
        id: true,
        name: true,
        category: { id: true, name: true, parentId: true },
      },
    });

    if (!baseProduct) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Build query for similar best-selling products
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect(
        'product.brand',
        'brand',
        'brand.isActive = :isActive',
        {
          isActive: true,
        },
      )
      .leftJoinAndSelect(
        'product.category',
        'category',
        'category.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect('category.parent', 'parentCategory')
      .leftJoinAndSelect('product.unit', 'unit', 'unit.isActive = :isActive', {
        isActive: true,
      })
      .leftJoinAndSelect('product.attachment', 'attachment')
      .leftJoinAndSelect('product.gallery', 'gallery')
      .leftJoinAndSelect('gallery.attachments', 'attachments')
      .select([
        'product.id',
        'product.name',
        'product.slug',
        'product.description',
        'product.sellingPrice',
        'product.isFeatured',
        'product.stock',
        'product.weight',
        'product.tags',
        'category.id',
        'category.name',
        'category.slug',
        'parentCategory.id',
        'parentCategory.name',
        'parentCategory.slug',
        'unit.id',
        'unit.name',
        'gallery.id',
        'gallery.name',
        'attachments.id',
        'attachments.url',

        'attachment.id',
        'attachment.url',
      ])
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.id != :productId', { productId });

    if (includeChildren) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('category.id = :categoryId', {
            categoryId: baseProduct.category.id,
          })
            .orWhere('category.parentId = :categoryId', {
              categoryId: baseProduct.category.id,
            })
            .orWhere('category.id = :parentId AND :parentId IS NOT NULL', {
              parentId: baseProduct.category.parentId,
            });
        }),
      );
    } else {
      query.andWhere('category.id = :categoryId', {
        categoryId: baseProduct.category.id,
      });
    }

    const products = await query
      .orderBy('product.saleCount', 'DESC')
      .addOrderBy('product.id', 'ASC')
      .limit(limit)
      .getMany();

    return [products, baseProduct];
  }
  async update(
    id: number,
    updateDto: UpdateProductDto,
    user: User,
  ): Promise<Product> {
    const product = await this.findOne(id);

    if (updateDto.brandId)
      product.brand = await this.validateBrand(updateDto.brandId);
    if (updateDto.categoryId)
      product.category = await this.validateCategory(updateDto.categoryId);
    if (updateDto.supplierId)
      product.supplier = await this.validateSupplier(updateDto.supplierId);
    if (updateDto.unitId)
      product.unit = await this.validateUnit(updateDto.unitId);

    if (updateDto.galleryId)
      product.gallery = await this.validateGallery(updateDto.galleryId);

    if (updateDto.attachment) {
      product.attachment = await this.validateAttachment(updateDto.attachment);
    } else if (updateDto.attachment === null || updateDto.attachment === undefined) {
      // Handle explicit removal of attachment
      product.attachment = null;
    }

    if (updateDto.discountType !== undefined)
      product.discountType = updateDto.discountType;
    if (updateDto.discountValue !== undefined)
      product.discountValue = updateDto.discountValue;
    if (updateDto.discountStartDate !== undefined)
      product.discountStartDate = updateDto.discountStartDate;
    if (updateDto.discountEndDate !== undefined)
      product.discountEndDate = updateDto.discountEndDate;

    // Exclude attachment and relationship fields from Object.assign
    const { attachment, brandId, categoryId, supplierId, unitId, galleryId, ...updateData } = updateDto;
    Object.assign(product, updateData);
    product.updatedBy = user?.userId;

    const savedProduct = await this.productRepository.save(product);

    // Clear relevant caches
    await this.cacheManager.del(`product_id_${id}`);
    await this.cacheManager.del(`product_slug_${savedProduct.slug}`);

    return savedProduct;
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);

    if (product.attachment) {
      await this.attachmentService.deleteFile(product.attachment.id);
    }
  }

  private async validateBrand(id: number): Promise<Brand> {
    const brand = await this.brandRepository.findOneBy({ id });
    if (!brand) throw new NotFoundException(`Brand with ID ${id} not found`);
    return brand;
  }

  private async validateCategory(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category)
      throw new NotFoundException(`Category with ID ${id} not found`);
    return category;
  }

  private async validateSupplier(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOneBy({
      id: Number(id),
    });
    if (!supplier)
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    return supplier;
  }

  private async validateUnit(id: string): Promise<Unit> {
    const unit = await this.unitRepository.findOneBy({ id });
    if (!unit) throw new NotFoundException(`Unit with ID ${id} not found`);
    return unit;
  }

  private async validateGallery(id: string): Promise<Gallery> {
    const gallery = await this.galleryRepository.findOneBy({ id });

    if (!gallery)
      throw new NotFoundException(`Gallery with ID ${id} not found`);
    return gallery;
  }

  private async validateAttachment(id: string): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOneBy({ id });
    if (!attachment)
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    return attachment;
  }

  async getLowStockReport(
    threshold: number = 10,
    page: number = 1,
    limit: number = 10,
  ): Promise<[Product[], number]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('category.parent', 'parentCategory')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .leftJoinAndSelect('product.unit', 'unit')
      .leftJoinAndSelect('product.attachment', 'attachment')
      .select([
        'product.id',
        'product.name',
        'product.productSku',
        'product.stock',
        'product.sellingPrice',
        'product.purchasePrice',
        'product.saleCount',
        'product.isActive',
        'product.tags',
        'brand.id',
        'brand.name',
        'category.id',
        'category.name',
        'parentCategory.id',
        'parentCategory.name',
        'supplier.id',
        'supplier.name',

        'supplier.phone',
        'supplier.email',
        'unit.id',
        'unit.name',
        'attachment.id',
        'attachment.url',
      ])
      .where('product.stock > 0')
      .andWhere('product.stock <= :threshold', { threshold })
      .orderBy('product.stock', 'ASC')
      .addOrderBy('product.name', 'ASC');

    const [products, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return [products, total];
  }

  async getOutOfStockReport(): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('category.parent', 'parentCategory')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .leftJoinAndSelect('product.unit', 'unit')
      .leftJoinAndSelect('product.attachment', 'attachment')
      .select([
        'product.id',
        'product.name',
        'product.productSku',
        'product.stock',
        'product.sellingPrice',
        'product.purchasePrice',
        'product.saleCount',
        'product.isActive',
        'product.tags',
        'brand.id',
        'brand.name',
        'category.id',
        'category.name',
        'parentCategory.id',
        'parentCategory.name',
        'supplier.id',
        'supplier.name',

        'supplier.phone',
        'supplier.email',
        'unit.id',
        'unit.name',
        'attachment.id',
        'attachment.url',
      ])
      .where('product.stock = 0')
      .orderBy('product.saleCount', 'DESC')
      .addOrderBy('product.name', 'ASC')
      .getMany();
  }

  async getAllTags(): Promise<string[]> {
    // Use PostgreSQL's unnest to get all unique tags from the products table
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT UNNEST(product.tags)', 'tag')
      .where('product.tags IS NOT NULL')
      .andWhere("array_length(product.tags, 1) > 0")
      .orderBy('tag', 'ASC')
      .getRawMany();

    return result.map((row) => row.tag);
  }
}
