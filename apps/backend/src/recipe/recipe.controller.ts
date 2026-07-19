import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/user/entities/user.entity';
import { ApiResponseDto } from '../common/types';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { Recipe } from './entities/recipe.entity';
import { RecipeService } from './recipe.service';

@ApiTags('Recipes')
@Controller('recipes')
@ApiBearerAuth('token')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new recipe' })
  async create(
    @Body() createRecipeDto: CreateRecipeDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Recipe>> {
    const data = await this.recipeService.create(
      createRecipeDto,
      req.user as User,
    );
    return {
      message: 'Recipe created successfully',
      statusCode: HttpStatus.CREATED,
      data: data,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all recipes',
    description: 'Retrieve a paginated list of recipes with optional filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'isPublished',
    required: false,
    type: Boolean,
    description: 'Filter by published status',
  })
  @ApiQuery({
    name: 'recipesearch', // Changed from 'search' to 'recipesearch'
    required: false,
    type: String,
    description: 'Search in title, details, and nutrition details',
  })
  @ApiQuery({
    name: 'categorySlug',
    required: false,
    type: String,
    description: 'Filter by category slug',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('isPublished') isPublished?: boolean,
    @Query('recipesearch') recipesearch?: string, // Changed parameter name
    @Query('categorySlug') categorySlug?: string,
  ): Promise<ApiResponseDto<Recipe[]>> {
    const result = await this.recipeService.findAll(
      page,
      limit,
      isPublished,
      recipesearch,
      categorySlug,
    );

    return {
      message: 'Recipes fetched successfully',
      statusCode: HttpStatus.OK,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recipe by ID' })
  @ApiParam({ name: 'id', description: 'Recipe ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe retrieved successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recipe not found.',
  })
  async findOne(@Param('id') id: number): Promise<ApiResponseDto<Recipe>> {
    const data = await this.recipeService.findOne(id);
    return {
      message: 'Recipe fetched successfully',
      statusCode: HttpStatus.OK,
      data: data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recipe not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiBearerAuth('token')
  @ApiBody({ type: CreateRecipeDto })
  async update(
    @Param('id') id: number,
    @Body() updateRecipeDto: CreateRecipeDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Recipe>> {
    const data = await this.recipeService.update(
      id,
      updateRecipeDto,
      req.user as User,
    );
    return {
      message: 'Recipe updated successfully',
      statusCode: HttpStatus.OK,
      data: data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe deleted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recipe not found.',
  })
  @ApiBearerAuth('token')
  async remove(@Param('id') id: number): Promise<ApiResponseDto<void>> {
    await this.recipeService.remove(id);
    return {
      message: 'Recipe deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
