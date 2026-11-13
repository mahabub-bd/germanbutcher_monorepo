import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AttachmentService } from 'src/attachment/attachment.service';
import { Category } from 'src/category/entities/category.entity';
import { SwrCache } from 'src/common/utils/swr-cache';
import { User } from 'src/user/entities/user.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { Recipe } from './entities/recipe.entity';

@Injectable()
export class RecipeService {
  /**
   * Storefront recipe list + detail: fresh 60s / 30s, stale 10min / 5min.
   * Recipes change rarely but the pages render on every storefront request.
   * Mutations invalidate via invalidateCaches().
   */
  private readonly listCache = new SwrCache<{
    data: Recipe[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(60_000, 600_000);

  private readonly detailCache = new SwrCache<Recipe | null>(
    30_000,
    300_000,
  );

  private invalidateCaches(): void {
    this.listCache.invalidate();
    this.detailCache.invalidate();
  }

  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly attachmentService: AttachmentService,
  ) {}

  async create(createRecipeDto: CreateRecipeDto, user: User): Promise<Recipe> {
    const { categoryId, ...rest } = createRecipeDto;

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const recipe = this.recipeRepository.create({
      ...rest,
      category,
      updatedBy: user?.userId,
      createdBy: user?.userId,
    });

    const saved = await this.recipeRepository.save(recipe);
    this.invalidateCaches();
    return saved;
  }

  async findAll(
    page = 1,
    limit = 10,
    isPublished?: boolean,
    recipesearch?: string, // Changed parameter name
    categorySlug?: string,
  ): Promise<{
    data: Recipe[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.attachment', 'attachment')
      .leftJoinAndSelect('recipe.category', 'category')
      .leftJoinAndSelect('category.attachment', 'categoryAttachment')
      .leftJoinAndSelect('recipe.createdBy', 'createdBy')
      .leftJoinAndSelect('createdBy.profilePhoto', 'createdByProfilePhoto')
      .leftJoinAndSelect('recipe.updatedBy', 'updatedBy')
      .leftJoinAndSelect('updatedBy.profilePhoto', 'updatedByProfilePhoto')
      .select([
        'recipe.id',
        'recipe.title',
        'recipe.details',
        'recipe.nutrition_details',
        'recipe.isPublished',
        'recipe.createdAt',
        'recipe.updatedAt',
        'attachment.id',
        'attachment.fileName',
        'attachment.url',
        'category.id',
        'category.name',
        'category.slug',
        'category.description',
        'categoryAttachment.id',
        'categoryAttachment.fileName',
        'categoryAttachment.url',
        'createdBy.id',
        'createdBy.name',
        'updatedBy.id',
        'updatedBy.name',
      ])
      .skip((page - 1) * limit)
      .take(limit);

    if (isPublished !== undefined) {
      query.andWhere('recipe.isPublished = :isPublished', { isPublished });
    }

    if (recipesearch && recipesearch.trim()) {
      query.andWhere(
        '(LOWER(recipe.title) LIKE LOWER(:recipesearch) OR ' +
          'LOWER(recipe.details) LIKE LOWER(:recipesearch) OR ' +
          'LOWER(recipe.nutrition_details) LIKE LOWER(:recipesearch))',
        { recipesearch: `%${recipesearch.trim()}%` }, // Changed
      );
    }

    if (categorySlug && categorySlug.trim()) {
      query.andWhere('LOWER(category.slug) = LOWER(:categorySlug)', {
        categorySlug: categorySlug.trim(),
      });
    }

    query.orderBy('recipe.createdAt', 'DESC');

    return this.listCache.get(
      `recipes_${page}_${limit}_${isPublished ?? 'all'}_${recipesearch ?? ''}_${
        categorySlug ?? ''
      }`,
      async () => {
        const [data, total] = await query.getManyAndCount();
        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      },
    );
  }

  /** Storefront detail page fetch — cached via detailCache (nulls included:
   * a missing id stays missing). */
  async findOne(id: number): Promise<Recipe | null> {
    return this.detailCache.get(`id:${id}`, () => this.findEntity(id));
  }

  private findEntity(id: number): Promise<Recipe | null> {
    return this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.attachment', 'attachment')
      .leftJoinAndSelect('recipe.category', 'category')
      .leftJoinAndSelect('category.attachment', 'categoryAttachment')
      .leftJoinAndSelect('recipe.createdBy', 'createdBy')
      .leftJoinAndSelect('createdBy.profilePhoto', 'createdByProfilePhoto')
      .leftJoinAndSelect('recipe.updatedBy', 'updatedBy')
      .leftJoinAndSelect('updatedBy.profilePhoto', 'updatedByProfilePhoto')
      .where('recipe.id = :id', { id })
      .select([
        'recipe.id',
        'recipe.title',
        'recipe.details',
        'recipe.nutrition_details',
        'recipe.isPublished',
        'recipe.createdAt',
        'recipe.updatedAt',
        'attachment.id',
        'attachment.fileName',
        'attachment.url',
        'category.id',
        'category.name',
        'category.slug',
        'category.description',
        'categoryAttachment.id',
        'categoryAttachment.fileName',
        'categoryAttachment.url',
        'createdBy.id',
        'createdBy.name',
        'updatedBy.id',
        'updatedBy.name',
      ])
      .getOne();
  }

  async update(
    id: number,
    updateRecipeDto: UpdateRecipeDto,
    user: User,
  ): Promise<Recipe> {
    const recipe = await this.findEntity(id);

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    if (updateRecipeDto.categoryId) {
      await this.validateCategory(updateRecipeDto.categoryId);
    }

    Object.assign(recipe, updateRecipeDto);

    const saved = await this.recipeRepository.save(recipe);
    this.invalidateCaches();
    return saved;
  }
  private async validateCategory(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category)
      throw new NotFoundException(`Category with ID ${id} not found`);
    return category;
  }
  async remove(id: number): Promise<void> {
    const recipe = await this.findEntity(id);
    const attachmentId = recipe?.attachment?.id;
    await this.recipeRepository.remove(recipe);
    await this.attachmentService.deleteFile(attachmentId);
    this.invalidateCaches();
  }
}
