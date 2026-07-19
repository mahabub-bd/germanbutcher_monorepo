import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { CreateSalesPointDto } from './dto/create-sales-point.dto';
import { QuerySalesPointDto } from './dto/query-sales-point.dto';
import { UpdateSalesPointDto } from './dto/update-sales-point.dto';
import { SalesPoint } from './entities/sales-point.entity';
import { SalesPointService } from './sales-point.service';

@ApiTags('Sales Points')
@Controller('sales-points')
@ApiBearerAuth('token')
export class SalesPointController {
  constructor(private readonly salesPointService: SalesPointService) {}
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new sales point company' })
  @ApiResponse({
    status: 201,
    description: 'Sales point created successfully',
  })
  async create(
    @Body() createSalesPointDto: CreateSalesPointDto,
  ): Promise<ApiResponseDto<SalesPoint>> {
    const data = await this.salesPointService.create(createSalesPointDto);
    return {
      message: 'Sales Point created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all sales points with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales points retrieved successfully',
  })
  async findAll(
    @Query() query: QuerySalesPointDto,
  ): Promise<ApiResponseDto<SalesPoint[]>> {
    const result = await this.salesPointService.findAll(query);
    return {
      message: 'Sales point retrieved successfully',
      statusCode: HttpStatus.OK,
      data: result.data,
      total: result.total,
      page: Number(result.page),
      limit: Number(result.limit),
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sales point by ID' })
  @ApiResponse({
    status: 200,
    description: 'Sales point found',
    type: SalesPoint,
  })
  @ApiResponse({ status: 404, description: 'Sales point not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<SalesPoint>> {
    const data = await this.salesPointService.findOne(id);
    return {
      message: 'Sales Point retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a sales point' })
  @ApiResponse({
    status: 200,
    description: 'Sales point updated successfully',
    type: SalesPoint,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSalesPointDto: UpdateSalesPointDto,
  ): Promise<ApiResponseDto<SalesPoint>> {
    const data = await this.salesPointService.update(id, updateSalesPointDto);
    return {
      message: 'Sales Point updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a sales point' })
  @ApiResponse({ status: 204, description: 'Sales point deleted successfully' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<null>> {
    await this.salesPointService.remove(id);
    return {
      message: 'Sales point deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
