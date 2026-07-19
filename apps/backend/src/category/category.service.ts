import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AttachmentService } from 'src/attachment/attachment.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

interface FindAllOptions {
  page?: number;
  limit?: number;
  search?: string;
  slug?: string;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  parentId?: number;
  isMainCategory?: boolean;
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private attachmentService: AttachmentService,
  ) {}

  async create(dto: CreateCategoryDto, user: User): Promise<Category> {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: dto.name },
    });
    if (existingCategory) {
      throw new ConflictException(
        `Category with name ${dto.name} already exists`,
      );
    }
    const category = this.categoryRepository.create({
      ...dto,
      updatedBy: user?.userId,
      createdBy: user?.userId,
    });

    if (dto.parentId) {
      category.parent = await this.getParentCategory(dto.parentId);
    }

    return this.categoryRepository.save(category);
  }

  async findAll(options: FindAllOptions): Promise<[Category[], number]> {
    const { page = 1, limit = 50, ...filters } = options;
    const skip = (page - 1) * limit;

    const query = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'products')
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.attachment', 'attachment')
      .leftJoinAndSelect('products.attachment', 'productAttachment')
      .skip(skip)
      .take(limit);

    if (filters.search) {
      query.andWhere('category.name ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.slug)
      query.andWhere('category.slug = :slug', { slug: filters.slug });
    if (filters.parentId !== undefined) {
      query.andWhere('category.parentId = :parentId', {
        parentId: filters.parentId,
      });
    }
    if (filters.isActive !== undefined) {
      query.andWhere('category.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }
    if (filters.isMainCategory !== undefined) {
      query.andWhere('category.isMainCategory = :isMainCategory', {
        isMainCategory: filters.isMainCategory,
      });
    }
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          query.orderBy('products.sellingPrice', 'ASC');
          break;
        case 'price_desc':
          query.orderBy('products.sellingPrice', 'DESC');
          break;
        case 'name_asc':
          query.orderBy('products.name', 'ASC');
          break;
        case 'name_desc':
          query.orderBy('products.name', 'DESC');
          break;
      }
    }

    return query.getManyAndCount();
  }

  // async findAllWithMergedProducts(
  //   options: FindAllOptions,
  // ): Promise<[Category[], number]> {
  //   const {
  //     page = 1,
  //     limit = 200,
  //     search,
  //     slug,
  //     parentId,
  //     isActive,
  //     isMainCategory,
  //     sort,
  //   } = options;
  //   const skip = (page - 1) * limit;

  //   const countQuery = this.categoryRepository.createQueryBuilder('category');

  //   if (search) {
  //     countQuery.andWhere('category.name ILIKE :search', {
  //       search: `%${search}%`,
  //     });
  //   }
  //   if (slug) {
  //     countQuery.andWhere('category.slug = :slug', { slug });
  //   }
  //   if (parentId !== undefined) {
  //     countQuery.andWhere('category.parentId = :parentId', { parentId });
  //   }
  //   if (isActive !== undefined) {
  //     countQuery.andWhere('category.isActive = :isActive', { isActive });
  //   }
  //   if (isMainCategory !== undefined) {
  //     countQuery.andWhere('category.isMainCategory = :isMainCategory', {
  //       isMainCategory,
  //     });
  //   }

  //   const total = await countQuery.getCount();

  //   const query = this.categoryRepository
  //     .createQueryBuilder('category')
  //     .leftJoinAndSelect('category.parent', 'parent')
  //     .leftJoinAndSelect('category.attachment', 'attachment')
  //     .leftJoinAndSelect('category.children', 'children')
  //     .leftJoinAndSelect(
  //       'category.products',
  //       'products',
  //       'products.isActive = :productIsActive',
  //       { productIsActive: true },
  //     )
  //     .leftJoinAndSelect('products.unit', 'unit')
  //     .leftJoinAndSelect('products.attachment', 'productAttachment')

  //     .leftJoinAndSelect(
  //       'children.products',
  //       'childrenProducts',
  //       'childrenProducts.isActive = :childProductIsActive',
  //       { childProductIsActive: true },
  //     )
  //     .leftJoinAndSelect('childrenProducts.unit', 'childrenProductsUnit')
  //     .leftJoinAndSelect(
  //       'childrenProducts.attachment',
  //       'childrenProductAttachment',
  //     )

  //     .leftJoinAndSelect('category.recipes', 'recipes')
  //     .leftJoinAndSelect('recipes.attachment', 'recipeAttachment')
  //     .leftJoinAndSelect('children.recipes', 'childrenRecipes')

  //     .skip(skip)
  //     .take(limit);

  //   if (search) {
  //     query.andWhere('category.name ILIKE :search', { search: `%${search}%` });
  //   }
  //   if (slug) {
  //     query.andWhere('category.slug = :slug', { slug });
  //   }
  //   if (parentId !== undefined) {
  //     query.andWhere('category.parentId = :parentId', { parentId });
  //   }
  //   if (isActive !== undefined) {
  //     query.andWhere('category.isActive = :isActive', { isActive });
  //   }
  //   if (isMainCategory !== undefined) {
  //     query.andWhere('category.isMainCategory = :isMainCategory', {
  //       isMainCategory,
  //     });
  //   }

  //   // Updated sorting logic with order-based default
  //   switch (sort) {
  //     case 'price_asc':
  //       query.orderBy('products.sellingPrice', 'ASC');
  //       break;
  //     case 'price_desc':
  //       query.orderBy('products.sellingPrice', 'DESC');
  //       break;
  //     case 'name_asc':
  //       query.orderBy('products.name', 'ASC');
  //       break;
  //     case 'name_desc':
  //       query.orderBy('products.name', 'DESC');
  //       break;
  //     default:
  //       // Default sort by category order, then by product name
  //       query
  //         .orderBy('category.order', 'ASC')
  //         .addOrderBy('products.name', 'ASC');
  //   }

  //   const categories = await query.getMany();

  //   for (const category of categories) {
  //     if (category.children && category.children.length > 0) {
  //       const childrenProducts = category.children
  //         .map((child) => child.products || [])
  //         .flat();
  //       category.products = (category.products || []).concat(childrenProducts);

  //       // Sort merged products based on the sort parameter
  //       if (sort) {
  //         category.products.sort((a, b) => {
  //           if (sort === 'price_asc') return a.sellingPrice - b.sellingPrice;
  //           if (sort === 'price_desc') return b.sellingPrice - a.sellingPrice;
  //           if (sort === 'name_asc') return a.name.localeCompare(b.name);
  //           if (sort === 'name_desc') return b.name.localeCompare(a.name);
  //           return 0;
  //         });
  //       } else {
  //         category.products.sort((a, b) => a.name.localeCompare(b.name));
  //       }
  //     }
  //   }

  //   return [categories, total];
  // }
  async findAllWithMergedProducts(
    options: FindAllOptions,
  ): Promise<[Category[], number]> {
    const {
      page = 1,
      limit = 200,
      search,
      slug,
      parentId,
      isActive,
      isMainCategory,
      sort,
    } = options;
    const skip = (page - 1) * limit;

    const countQuery = this.categoryRepository.createQueryBuilder('category');

    if (search) {
      countQuery.andWhere('category.name ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (slug) {
      countQuery.andWhere('category.slug = :slug', { slug });
    }
    if (parentId !== undefined) {
      countQuery.andWhere('category.parentId = :parentId', { parentId });
    }
    if (isActive !== undefined) {
      countQuery.andWhere('category.isActive = :isActive', { isActive });
    }
    if (isMainCategory !== undefined) {
      countQuery.andWhere('category.isMainCategory = :isMainCategory', {
        isMainCategory,
      });
    }

    const total = await countQuery.getCount();

    const query = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.attachment', 'attachment')
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect(
        'category.products',
        'products',
        'products.isActive = :productIsActive',
        { productIsActive: true },
      )
      .leftJoinAndSelect('products.unit', 'unit')
      .leftJoinAndSelect('products.attachment', 'productAttachment')
      .leftJoinAndSelect(
        'children.products',
        'childrenProducts',
        'childrenProducts.isActive = :childProductIsActive',
        { childProductIsActive: true },
      )
      .leftJoinAndSelect('childrenProducts.unit', 'childrenProductsUnit')
      .leftJoinAndSelect(
        'childrenProducts.attachment',
        'childrenProductAttachment',
      )
      .leftJoinAndSelect('category.recipes', 'recipes')
      .leftJoinAndSelect('recipes.attachment', 'recipeAttachment')
      .leftJoinAndSelect('children.recipes', 'childrenRecipes')
      .skip(skip)
      .take(limit);

    if (search) {
      query.andWhere('category.name ILIKE :search', { search: `%${search}%` });
    }
    if (slug) {
      query.andWhere('category.slug = :slug', { slug });
    }
    if (parentId !== undefined) {
      query.andWhere('category.parentId = :parentId', { parentId });
    }
    if (isActive !== undefined) {
      query.andWhere('category.isActive = :isActive', { isActive });
    }
    if (isMainCategory !== undefined) {
      query.andWhere('category.isMainCategory = :isMainCategory', {
        isMainCategory,
      });
    }

    switch (sort) {
      case 'name_asc':
        query.orderBy('category.name', 'ASC').addOrderBy('category.id', 'ASC');
        break;
      case 'name_desc':
        query.orderBy('category.name', 'DESC').addOrderBy('category.id', 'ASC');
        break;
      case 'price_asc':
      case 'price_desc':
        query.orderBy('category.order', 'ASC').addOrderBy('category.id', 'ASC');
        break;
      default:
        query.orderBy('category.order', 'ASC').addOrderBy('category.id', 'ASC');
    }

    const categories = await query.getMany();

    for (const category of categories) {
      if (category.children && category.children.length > 0) {
        const childrenProducts = category.children
          .map((child) => child.products || [])
          .flat();
        category.products = (category.products || []).concat(childrenProducts);

        if (sort) {
          category.products.sort((a, b) => {
            if (sort === 'price_asc') return a.sellingPrice - b.sellingPrice;
            if (sort === 'price_desc') return b.sellingPrice - a.sellingPrice;
            if (sort === 'name_asc') return a.name.localeCompare(b.name);
            if (sort === 'name_desc') return b.name.localeCompare(a.name);
            return 0;
          });
        } else {
          category.products.sort((a, b) => a.name.localeCompare(b.name));
        }
      }
    }

    return [categories, total];
  }
  async getTree(): Promise<any[]> {
    const categories = await this.categoryRepository.find({
      relations: ['children', 'parent'],
      order: { order: 'ASC' },
    });

    const buildTree = (parentId: number | null): any[] => {
      return categories
        .filter((c) => c.parentId === parentId)
        .map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          order: c.order,
          description: c.description,
          isActive: c.isActive,
          parentId: c.parentId,
          isMainCategory: c.isMainCategory,
          children: buildTree(c.id),
        }));
    };

    return buildTree(null);
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: [
        'children',
        'parent',
        'attachment',
        'products',
        'recipes',
        'products.attachment',
        'children.products',
        'children.recipes',
        'children.products.attachment',
        'products.unit',
        'recipes.attachment',
      ],
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return category;
  }

  async update(
    id: number,
    dto: UpdateCategoryDto,
    @GetUser() user: User,
  ): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    category.updatedBy = user?.userId;

    if (dto.parentId !== undefined) {
      category.parent = dto.parentId
        ? await this.getParentCategory(dto.parentId)
        : null;
    }

    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);

    if (category.attachment?.id) {
      await this.attachmentService.deleteFile(category.attachment.id);
    }
  }

  private async getParentCategory(parentId: number): Promise<Category> {
    const parent = await this.categoryRepository.findOneBy({ id: parentId });
    if (!parent) {
      throw new NotFoundException(`Parent category ${parentId} not found`);
    }
    return parent;
  }
}
