import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { BusinessSetting } from './entities/business-setting.entity';
import { BusinessSettingsService } from './business-settings.service';
import { UpdateBusinessSettingsDto } from './dto/update-business-settings.dto';

@ApiTags('Business Settings')
@Controller('business-settings')
export class BusinessSettingsController {
  constructor(
    private readonly businessSettingsService: BusinessSettingsService,
  ) {}

  /** Public: the storefront header, footer, live chat and invoices read
   * this without logging in. */
  @Get()
  async findOne(): Promise<ApiResponseDto<BusinessSetting>> {
    const data = await this.businessSettingsService.getSettings();
    return {
      message: 'Business settings retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @ApiBearerAuth('token')
  @Patch()
  async update(
    @Body() updateBusinessSettingsDto: UpdateBusinessSettingsDto,
  ): Promise<ApiResponseDto<BusinessSetting>> {
    const data = await this.businessSettingsService.updateSettings(
      updateBusinessSettingsDto,
    );
    return {
      message: 'Business settings updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
}
