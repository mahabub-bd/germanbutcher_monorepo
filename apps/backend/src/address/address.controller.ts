// src/addresses/addresses.controller.ts
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
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AddressType } from 'src/common/enums';

import { Request } from 'express';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { ApiResponseDto } from 'src/common/types';
import { User } from 'src/user/entities/user.entity';
import { AddressesService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';

@ApiTags('Addresses')
@ApiBearerAuth('token')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Address created',
    type: ApiResponseDto<Address>,
  })
  async create(
    @Body() createAddressDto: CreateAddressDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Address>> {
    const data = await this.addressesService.create(
      createAddressDto,
      req.user as User,
    );
    return {
      message: 'Address created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }
  @UseGuards(AdminGuard, JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Get all addresses (all for admins, own for users)',
  })
  @ApiQuery({ name: 'type', enum: AddressType, required: false })
  @ApiResponse({
    status: 200,
    description: 'List of addresses',
    type: [Address],
  })
  async findAll(
    @GetUser() user: User,
    @Query('type') type?: AddressType,
  ): Promise<ApiResponseDto<Address[]>> {
    const isAdmin = user.roleId === 1;
    const userId = isAdmin ? undefined : user.id;

    const data = await this.addressesService.findAllByUser(userId, type);
    return {
      message: 'Addresses retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get('default')
  @ApiOperation({ summary: 'Get default address by type' })
  @ApiQuery({ name: 'type', enum: AddressType })
  @ApiResponse({ status: 200, description: 'Default address', type: Address })
  @ApiResponse({ status: 404, description: 'No default address found' })
  async getDefault(
    @GetUser() user: User,
    @Query('type') type: AddressType,
  ): Promise<ApiResponseDto<Address>> {
    const isAdmin = user.roleId === 1;
    const userId = isAdmin ? undefined : user.id;

    const data = await this.addressesService.getDefaultAddress(userId, type);
    return {
      message: 'Default address retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Address details', type: Address })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async findOne(
    @GetUser() user: User,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<Address>> {
    const isAdmin = user.roleId === 1;
    const userId = isAdmin ? undefined : user.id;

    const data = await this.addressesService.findOne(+id, userId);
    return {
      message: 'Address retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update address by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateAddressDto })
  @ApiResponse({ status: 200, description: 'Updated address', type: Address })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<ApiResponseDto<Address>> {
    const isAdmin = user.roleId === 1;
    const userId = isAdmin ? undefined : user.id;

    const data = await this.addressesService.update(
      +id,
      updateAddressDto,
      userId,
    );
    return {
      message: 'Address updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete address by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 204, description: 'Address deleted' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async remove(
    @GetUser() user: User,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    const isAdmin = user.roleId === 1;
    const userId = isAdmin ? undefined : user.id;

    await this.addressesService.remove(+id, userId);
    return {
      message: 'Address deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get addresses by user ID' })
  @ApiParam({
    name: 'userId',
    type: Number,
    example: 1,
    description: 'ID of the user to fetch addresses for',
  })
  @ApiQuery({
    name: 'type',
    enum: AddressType,
    required: false,
    description: 'Filter by address type',
  })
  @ApiResponse({
    status: 200,
    description: 'List of addresses',
    type: [Address],
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or no addresses exist',
  })
  async findAddressesByUserId(
    @Param('userId') userId: number,
    @Query('type') type?: AddressType,
  ): Promise<ApiResponseDto<Address[]>> {
    const data = await this.addressesService.findByUserId(userId, type);
    return {
      message: 'Addresses retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
}
