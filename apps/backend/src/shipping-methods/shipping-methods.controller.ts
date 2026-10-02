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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';

import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ModulePermissions } from 'src/auth/decorators/module-permissions.decorator';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
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
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/settings/shipping-method')
  @Post()
  async create(
    @Req() request: Request & { user?: { userId?: number } },
    @Body() createShippingMethodDto: CreateShippingMethodDto,
  ): Promise<ApiResponseDto<ShippingMethod>> {
    const data = await this.shippingMethodsService.create(
      createShippingMethodDto,
      request.user?.userId,
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
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/settings/shipping-method')
  @Patch(':id')
  async update(
    @Req() request: Request & { user?: { userId?: number } },
    @Param('id') id: string,
    @Body() updateShippingMethodDto: UpdateShippingMethodDto,
  ): Promise<ApiResponseDto<ShippingMethod>> {
    const data = await this.shippingMethodsService.update(
      +id,
      updateShippingMethodDto,
      request.user?.userId,
    );
    return {
      message: 'Shipping method updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/settings/shipping-method')
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
