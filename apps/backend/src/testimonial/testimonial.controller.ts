import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { Testimonial } from './entities/testimonial.entity';
import { TestimonialService } from './testimonial.service';

@ApiTags('Testimonials')
@Controller('testimonials')
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  @Get()
  @ApiOperation({
    summary: 'Get testimonials',
    description:
      'Retrieves testimonials with optional filtering by publication status',
  })
  @ApiQuery({
    name: 'isPublish',
    required: false,
    type: Boolean,
    description:
      'Filter by publication status. If not provided, returns all testimonials',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Testimonials retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Testimonials retrieved successfully',
        },
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Testimonial' },
        },
        total: { type: 'number', example: 25 },
      },
    },
  })
  findAll(
    @Query('isPublish', new ParseBoolPipe({ optional: true }))
    isPublish?: boolean,
  ): Promise<ApiResponseDto<Testimonial[]>> {
    return this.testimonialService.findAll(isPublish);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get testimonial by ID',
    description: 'Retrieves a specific testimonial by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique testimonial identifier',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Testimonial retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Testimonial retrieved successfully',
        },
        statusCode: { type: 'number', example: 200 },
        data: { $ref: '#/components/schemas/Testimonial' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Testimonial with specified ID does not exist',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<Testimonial>> {
    return this.testimonialService.findOne(id);
  }
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new testimonial',
    description:
      'Creates a new customer testimonial with rating and feedback text',
  })
  @ApiBody({ type: CreateTestimonialDto })
  @ApiResponse({
    status: 201,
    description: 'Testimonial created successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Testimonial created successfully',
        },
        statusCode: { type: 'number', example: 201 },
        data: { $ref: '#/components/schemas/Testimonial' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  create(
    @Body() createTestimonialDto: CreateTestimonialDto,
  ): Promise<ApiResponseDto<Testimonial>> {
    return this.testimonialService.create(createTestimonialDto);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update testimonial',
    description:
      'Updates an existing testimonial. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique testimonial identifier',
    example: 1,
  })
  @ApiBody({ type: UpdateTestimonialDto })
  @ApiResponse({
    status: 200,
    description: 'Testimonial updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Testimonial updated successfully',
        },
        statusCode: { type: 'number', example: 200 },
        data: { $ref: '#/components/schemas/Testimonial' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Testimonial not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTestimonialDto: UpdateTestimonialDto,
  ): Promise<ApiResponseDto<Testimonial>> {
    return this.testimonialService.update(id, updateTestimonialDto);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete testimonial',
    description: 'Permanently removes a testimonial from the system',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique testimonial identifier',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Testimonial deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Testimonial deleted successfully',
        },
        statusCode: { type: 'number', example: 200 },
        data: { type: 'null', example: null },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Testimonial not found',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    return this.testimonialService.remove(id);
  }
}
