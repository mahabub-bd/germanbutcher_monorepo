// src/subscribers/subscribers.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { Subscriber } from './entities/subscriber.entity';
import { SubscribersService } from './subscribers.service';

@ApiTags('Subscribers')
@Controller('subscribers')
@ApiBearerAuth('token')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 subscriptions per minute
  @ApiOperation({ summary: 'Add a new subscriber by email' })
  @ApiBody({
    description: 'Subscriber email to add',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscriber successfully added',
    type: Subscriber,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Email already exists or invalid data.',
  })
  async createSubscriber(
    @Body('email') email: string,
  ): Promise<ApiResponseDto<Subscriber>> {
    if (await this.subscribersService.emailExists(email)) {
      return {
        message: 'Email already exists',
        statusCode: HttpStatus.CONFLICT,
        data: null,
      };
    }
    const subscriber = await this.subscribersService.createSubscriber(email);
    return {
      message: 'Subscriber successfully added',
      statusCode: HttpStatus.CREATED,
      data: subscriber,
    };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin', 'admin')
  @Get()
  @ApiOperation({ summary: 'Get all subscribers with pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of all subscribers with pagination',
    type: Subscriber,
  })
  async getAllSubscribers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<ApiResponseDto<any>> {
    const subscribersData = await this.subscribersService.getAllSubscribers(
      page,
      limit,
    );

    return {
      message: 'List of all subscribers',
      statusCode: HttpStatus.OK,

      data: subscribersData.data,
      total: subscribersData.total,
      page: subscribersData.page,
      limit: subscribersData.limit,
      totalPages: subscribersData.totalPages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscriber by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID of the subscriber',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Subscriber found',
    type: Subscriber,
  })
  @ApiResponse({
    status: 404,
    description: 'Subscriber not found',
  })
  async getSubscriber(
    @Param('id') id: number,
  ): Promise<ApiResponseDto<Subscriber>> {
    const subscriber = await this.subscribersService.getSubscriberById(id);
    if (!subscriber) {
      return {
        message: 'Subscriber not found',
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      };
    }
    return {
      message: 'Subscriber found',
      statusCode: HttpStatus.OK,
      data: subscriber,
    };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin', 'admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subscriber by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID of the subscriber to delete',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Subscriber successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscriber not found',
  })
  async deleteSubscriber(
    @Param('id') id: number,
  ): Promise<ApiResponseDto<void>> {
    await this.subscribersService.deleteSubscriber(id);

    return {
      message: 'Subscriber successfully deleted',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
