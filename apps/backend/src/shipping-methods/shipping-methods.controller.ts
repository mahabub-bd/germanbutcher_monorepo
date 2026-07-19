// src/shipping-methods/shipping-methods.controller.ts
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
  UseGuards,
} from '@nestjs/common';

import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';

import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { ShippingMethod } from './entities/shipping-method.entity';
import { ShippingMethodsService } from './shipping-methods.service';

@Controller('shipping-methods')
@ApiTags('Shipping Methods')
@ApiBearerAuth('token')
export class ShippingMethodsController {
  constructor(
    private readonly shippingMethodsService: ShippingMethodsService,
  ) {}
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Post()
  async create(
    @Body() createShippingMethodDto: CreateShippingMethodDto,
  ): Promise<ApiResponseDto<ShippingMethod>> {
    const data = await this.shippingMethodsService.create(
      createShippingMethodDto,
    );
    return {
      message: 'Shipping method created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @Get()
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: String,
    description: 'Filter by activation status (true/false)',
    example: 'true',
  })
  async findAll(
    @Query('isActive') isActive?: string,
  ): Promise<ApiResponseDto<ShippingMethod[]>> {
    const data = await this.shippingMethodsService.findAll(isActive);
    return {
      message: 'Shipping methods retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<ShippingMethod>> {
    const data = await this.shippingMethodsService.findOne(+id);
    return {
      message: 'Shipping method retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateShippingMethodDto: UpdateShippingMethodDto,
  ): Promise<ApiResponseDto<ShippingMethod>> {
    const data = await this.shippingMethodsService.update(
      +id,
      updateShippingMethodDto,
    );
    return {
      message: 'Shipping method updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponseDto<void>> {
    const data = await this.shippingMethodsService.remove(+id);
    return {
      message: 'Shipping method deleted successfully',
      statusCode: HttpStatus.OK,
      data: data,
    };
  }
}
