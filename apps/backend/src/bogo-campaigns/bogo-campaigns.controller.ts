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

import { ModulePermissions } from 'src/auth/decorators/module-permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { ApiResponseDto } from 'src/common/types';
import { CreateBogoCampaignDto } from './dto/create-bogo-campaign.dto';
import { PreviewBogoDto } from './dto/preview-bogo.dto';
import { UpdateBogoCampaignDto } from './dto/update-bogo-campaign.dto';
import {
  ActiveBogoCampaignSummary,
  AdminBogoCampaignSummary,
  BogoCampaignsService,
} from './bogo-campaigns.service';

@ApiTags('BOGO Campaigns')
@Controller('bogo-campaigns')
export class BogoCampaignsController {
  constructor(
    private readonly campaignsService: BogoCampaignsService,
  ) {}

  /**
   * Public: estimate BOGO discount for a cart (display-only). When a valid
   * token is present, the caller's per-user lifetime caps are applied too,
   * so the cart shows exactly what checkout will charge.
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Post('preview')
  async preview(
    @Body() dto: PreviewBogoDto,
    @Req() req,
  ): Promise<ApiResponseDto<{
    eligible: boolean;
    totalDiscount: number;
    usages: {
      campaign: ActiveBogoCampaignSummary;
      discount: number;
      freeUnits: number;
      freeLines: {
        productId: number;
        productName: string;
        quantity: number;
        unitPrice: number;
      }[];
    }[];
  }>> {
    const data = await this.campaignsService.preview(
      dto.items,
      req?.user?.id,
    );
    return {
      message: 'BOGO preview retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/marketing/bogo/bogo-list')
  @ApiBearerAuth('token')
  @Get()
  async findAll(): Promise<ApiResponseDto<AdminBogoCampaignSummary[]>> {
    const data = await this.campaignsService.findAll();
    return {
      message: 'BOGO campaigns retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/marketing/bogo/bogo-list')
  @ApiBearerAuth('token')
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<AdminBogoCampaignSummary>> {
    const data = await this.campaignsService.findOne(id);
    return {
      message: 'BOGO campaign retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/marketing/bogo/bogo-list')
  @ApiBearerAuth('token')
  @Post()
  async create(
    @Body() dto: CreateBogoCampaignDto,
  ): Promise<ApiResponseDto<AdminBogoCampaignSummary>> {
    const data = await this.campaignsService.create(dto);
    return {
      message: 'BOGO campaign created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/marketing/bogo/bogo-list')
  @ApiBearerAuth('token')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBogoCampaignDto,
  ): Promise<ApiResponseDto<AdminBogoCampaignSummary>> {
    const data = await this.campaignsService.update(id, dto);
    return {
      message: 'BOGO campaign updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/marketing/bogo/bogo-list')
  @ApiBearerAuth('token')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<null>> {
    await this.campaignsService.remove(id);
    return {
      message: 'BOGO campaign deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
