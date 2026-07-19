import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { DeliveryManService } from './delivery-man.service';
import { CreateDeliveryManDto } from './dto/create-delivery-man.dto';
import { GetDeliveryMenQueryDto } from './dto/get-delivery-men-query.dto';
import { UpdateDeliveryManDto } from './dto/update-delivery-man.dto';
import { DeliveryMan } from './entities/delivery-man.entity';

@ApiTags('Delivery Man')
@Controller('delivery-man')
export class DeliveryManController {
  constructor(private readonly deliveryManService: DeliveryManService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new delivery man',
    description: 'Creates a new delivery man with the provided information',
  })
  @ApiResponse({
    status: 201,
    description: 'Delivery man created successfully',
    schema: {
      example: {
        message: 'Delivery man created successfully',
        statusCode: 201,
        data: {
          id: 1,
          name: 'John Doe',
          mobileNumber: '+880171234567',
          email: 'john.doe@example.com',
          address: 'Dhaka, Bangladesh',
          nationalId: '1234567890123',
          isActive: true,
          totalDeliveries: 0,
          totalEarnings: 0,
          vehicleType: 'Motorcycle',
          vehicleNumber: 'DHAKA-METRO-1234',
          licenseNumber: 'LIC-123456',
          createdAt: '2026-02-04T12:00:00.000Z',
          updatedAt: '2026-02-04T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Delivery man with same name or mobile number already exists',
  })
  async create(
    @Body() createDeliveryManDto: CreateDeliveryManDto,
  ): Promise<ApiResponseDto<DeliveryMan>> {
    const data = await this.deliveryManService.create(createDeliveryManDto);

    return {
      message: 'Delivery man created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all delivery men',
    description: 'Retrieves a paginated list of delivery men with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery men retrieved successfully',
    schema: {
      example: {
        message: 'Delivery men retrieved successfully',
        statusCode: 200,
        data: [
          {
            id: 1,
            name: 'John Doe',
            mobileNumber: '+880171234567',
            isActive: true,
            totalDeliveries: 25,
            totalEarnings: 5000,
          },
        ],
        total: 50,
        page: 1,
        limit: 10,
        totalPages: 5,
      },
    },
  })
  async findAll(
    @Query() query: GetDeliveryMenQueryDto,
  ): Promise<ApiResponseDto<DeliveryMan[]>> {
    const { data, total } = await this.deliveryManService.findAll(query);
    const page = query.page || 1;
    const limit = query.limit || 10;

    return {
      message: 'Delivery men retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all active delivery men',
    description: 'Retrieves a list of all active delivery men',
  })
  @ApiResponse({
    status: 200,
    description: 'Active delivery men retrieved successfully',
  })
  async getActiveDeliveryMen(): Promise<
    ApiResponseDto<DeliveryMan[]>
  > {
    const data = await this.deliveryManService.getActiveDeliveryMen();

    return {
      message: 'Active delivery men retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get delivery man by ID',
    description: 'Retrieves a specific delivery man by their ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery man retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Delivery man not found',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<DeliveryMan>> {
    const data = await this.deliveryManService.findOne(+id);

    return {
      message: 'Delivery man retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update delivery man',
    description: 'Updates a delivery man with the provided information',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery man updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Delivery man not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Delivery man with same name or mobile number already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDeliveryManDto: UpdateDeliveryManDto,
  ): Promise<ApiResponseDto<DeliveryMan>> {
    const data = await this.deliveryManService.update(+id, updateDeliveryManDto);

    return {
      message: 'Delivery man updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Patch(':id/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update delivery man statistics',
    description: 'Updates the delivery count and earnings for a delivery man',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Delivery man not found',
  })
  async updateStatistics(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<DeliveryMan>> {
    const data = await this.deliveryManService.updateStatistics(+id);

    return {
      message: 'Statistics updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete delivery man',
    description: 'Deletes a delivery man by their ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Delivery man deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Delivery man not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deliveryManService.remove(+id);
  }
}
