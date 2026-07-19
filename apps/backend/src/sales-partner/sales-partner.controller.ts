import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { ApiResponseDto } from 'src/common/types';
import { CreateSalesPartnerDto } from './dto/create-sales-partner.dto';
import { UpdateSalesPartnerDto } from './dto/update-sales-partner.dto';
import { SalesPartner } from './entities/sales-partner.entity';
import { SalesPartnerService } from './sales-partner.service';

@ApiTags('Sales Partners')
@ApiBearerAuth('token')
@Controller('sales-partners')
export class SalesPartnerController {
  constructor(private readonly salesPartnerService: SalesPartnerService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new sales partner' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sales partner created successfully',
    type: ApiResponseDto<SalesPartner>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createSalesPartnerDto: CreateSalesPartnerDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<SalesPartner>> {
    const data = await this.salesPartnerService.create(createSalesPartnerDto);
    return {
      message: 'Sales partner created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales partners' })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit number of results',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset for pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales partners retrieved successfully',
    type: ApiResponseDto<SalesPartner[]>,
  })
  async findAll(
    @Query('active') active?: boolean,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ApiResponseDto<SalesPartner[]>> {
    const data = await this.salesPartnerService.findAll({
      active,
      limit,
      offset,
    });
    return {
      message: 'Sales partners retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active sales partners' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active sales partners retrieved successfully',
    type: ApiResponseDto<SalesPartner[]>,
  })
  async findAllActive(): Promise<ApiResponseDto<SalesPartner[]>> {
    const data = await this.salesPartnerService.findAllActive();
    return {
      message: 'Active sales partners retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales partner by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales partner retrieved successfully',
    type: ApiResponseDto<SalesPartner>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sales partner not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<SalesPartner>> {
    const data = await this.salesPartnerService.findOne(id);
    return {
      message: 'Sales partner retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update sales partner' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales partner updated successfully',
    type: ApiResponseDto<SalesPartner>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sales partner not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true }))
    updateSalesPartnerDto: UpdateSalesPartnerDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<SalesPartner>> {
    const data = await this.salesPartnerService.update(
      id,
      updateSalesPartnerDto,
    );
    return {
      message: 'Sales partner updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle sales partner active status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales partner status updated successfully',
    type: ApiResponseDto<SalesPartner>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sales partner not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<ApiResponseDto<SalesPartner>> {
    const data = await this.salesPartnerService.toggleStatus(id);
    return {
      message: 'Sales partner status updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete sales partner' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales partner deleted successfully',
    type: ApiResponseDto<null>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sales partner not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<ApiResponseDto<null>> {
    await this.salesPartnerService.remove(id);
    return {
      message: 'Sales partner deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
