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
import { DeliverySetting } from './entities/delivery-setting.entity';
import { DeliverySettingsService } from './delivery-settings.service';
import { UpdateDeliverySettingsDto } from './dto/update-delivery-settings.dto';

@ApiTags('Delivery Settings')
@Controller('delivery-settings')
export class DeliverySettingsController {
  constructor(
    private readonly deliverySettingsService: DeliverySettingsService,
  ) {}

  /** Public: the cart and checkout pages read this without logging in. */
  @Get()
  async findOne(): Promise<ApiResponseDto<DeliverySetting>> {
    const data = await this.deliverySettingsService.getSettings();
    return {
      message: 'Delivery settings retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @ApiBearerAuth('token')
  @Patch()
  async update(
    @Body() updateDeliverySettingsDto: UpdateDeliverySettingsDto,
  ): Promise<ApiResponseDto<DeliverySetting>> {
    const data = await this.deliverySettingsService.updateSettings(
      updateDeliverySettingsDto,
    );
    return {
      message: 'Delivery settings updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
}
