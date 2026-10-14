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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ModulePermissions } from 'src/auth/decorators/module-permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { ApiResponseDto } from 'src/common/types';
import { CreateFlashSaleCampaignDto } from './dto/create-flash-sale-campaign.dto';
import { UpdateFlashSaleCampaignDto } from './dto/update-flash-sale-campaign.dto';
import {
  ActiveCampaignSummary,
  AdminCampaignSummary,
  FlashSaleCampaignsService,
} from './flash-sale-campaigns.service';

@ApiTags('Flash Sale Campaigns')
@Controller('flash-sale-campaigns')
export class FlashSaleCampaignsController {
  constructor(
    private readonly campaignsService: FlashSaleCampaignsService,
  ) {}

  /** Public: active campaigns for storefront display. */
  @Get('active')
  async findActive(): Promise<ApiResponseDto<ActiveCampaignSummary[]>> {
    const data = this.campaignsService.toActiveSummaries(
      await this.campaignsService.getActiveCampaigns(),
    );
    return {
      message: 'Active flash sale campaigns retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/marketing/flash-sales')
  @ApiBearerAuth('token')
  @Get()
  async findAll(): Promise<ApiResponseDto<AdminCampaignSummary[]>> {
    const data = await this.campaignsService.findAll();
    return {
      message: 'Flash sale campaigns retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/marketing/flash-sales')
  @ApiBearerAuth('token')
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<AdminCampaignSummary>> {
    const data = await this.campaignsService.findOne(id);
    return {
      message: 'Flash sale campaign retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/marketing/flash-sales')
  @ApiBearerAuth('token')
  @Post()
  async create(
    @Body() dto: CreateFlashSaleCampaignDto,
  ): Promise<ApiResponseDto<AdminCampaignSummary>> {
    const data = await this.campaignsService.create(dto);
    return {
      message: 'Flash sale campaign created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/marketing/flash-sales')
  @ApiBearerAuth('token')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFlashSaleCampaignDto,
  ): Promise<ApiResponseDto<AdminCampaignSummary>> {
    const data = await this.campaignsService.update(id, dto);
    return {
      message: 'Flash sale campaign updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/marketing/flash-sales')
  @ApiBearerAuth('token')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<null>> {
    await this.campaignsService.remove(id);
    return {
      message: 'Flash sale campaign deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
