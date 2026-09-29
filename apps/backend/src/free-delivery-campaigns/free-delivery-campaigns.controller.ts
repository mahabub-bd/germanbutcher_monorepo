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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { CheckFreeDeliveryDto } from './dto/check-free-delivery.dto';
import { CreateFreeDeliveryCampaignDto } from './dto/create-free-delivery-campaign.dto';
import { UpdateFreeDeliveryCampaignDto } from './dto/update-free-delivery-campaign.dto';
import { FreeDeliveryCampaign } from './entities/free-delivery-campaign.entity';
import { FreeDeliveryCampaignsService } from './free-delivery-campaigns.service';

@ApiTags('Free Delivery Campaigns')
@Controller('free-delivery-campaigns')
export class FreeDeliveryCampaignsController {
  constructor(
    private readonly campaignsService: FreeDeliveryCampaignsService,
  ) {}

  /** Public: active campaigns for storefront display. */
  @Get('active')
  async findActive(): Promise<
    ApiResponseDto<
      import('./free-delivery-campaigns.service').ActiveCampaignSummary[]
    >
  > {
    const data = this.campaignsService.toActiveSummaries(
      await this.campaignsService.getActiveCampaigns(),
    );
    return {
      message: 'Active free delivery campaigns retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  /** Public (optional auth): evaluate the cart against campaigns + legacy
   * threshold. Guests pass no token; newCustomersOnly campaigns need one. */
  @UseGuards(OptionalJwtAuthGuard)
  @Post('check')
  async check(
    @Req() request: Request & { user?: { userId?: number } },
    @Body() dto: CheckFreeDeliveryDto,
  ): Promise<ApiResponseDto<import('./free-delivery-campaigns.service').FreeDeliveryCheckResult>> {
    const data = await this.campaignsService.check(
      dto,
      request.user?.userId,
    );
    return {
      message: 'Free delivery check completed',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @ApiBearerAuth('token')
  @Get()
  async findAll(): Promise<ApiResponseDto<FreeDeliveryCampaign[]>> {
    const data = await this.campaignsService.findAll();
    return {
      message: 'Free delivery campaigns retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @ApiBearerAuth('token')
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<FreeDeliveryCampaign>> {
    const data = await this.campaignsService.findOne(id);
    return {
      message: 'Free delivery campaign retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @ApiBearerAuth('token')
  @Post()
  async create(
    @Body() dto: CreateFreeDeliveryCampaignDto,
  ): Promise<ApiResponseDto<FreeDeliveryCampaign>> {
    const data = await this.campaignsService.create(dto);
    return {
      message: 'Free delivery campaign created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @ApiBearerAuth('token')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFreeDeliveryCampaignDto,
  ): Promise<ApiResponseDto<FreeDeliveryCampaign>> {
    const data = await this.campaignsService.update(id, dto);
    return {
      message: 'Free delivery campaign updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @ApiBearerAuth('token')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<null>> {
    await this.campaignsService.remove(id);
    return {
      message: 'Free delivery campaign deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
