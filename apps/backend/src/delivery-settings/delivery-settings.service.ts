import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpdateDeliverySettingsDto } from './dto/update-delivery-settings.dto';
import { DeliverySetting } from './entities/delivery-setting.entity';

@Injectable()
export class DeliverySettingsService {
  constructor(
    @InjectRepository(DeliverySetting)
    private readonly deliverySettingsRepository: Repository<DeliverySetting>,
  ) {}

  /** The table holds a single row (id 1); seed it with defaults on first read
   * so the public checkout/cart endpoints always return a usable payload. */
  async getSettings(): Promise<DeliverySetting> {
    try {
      const existing = await this.deliverySettingsRepository.findOneBy({
        id: 1,
      });
      if (existing) return existing;

      return await this.deliverySettingsRepository.save(
        this.deliverySettingsRepository.create({ id: 1 }),
      );
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(
        'Failed to load delivery settings',
        err.message,
      );
    }
  }

  async updateSettings(
    updateDeliverySettingsDto: UpdateDeliverySettingsDto,
  ): Promise<DeliverySetting> {
    try {
      const settings = await this.getSettings();
      Object.assign(settings, updateDeliverySettingsDto);
      return await this.deliverySettingsRepository.save(settings);
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(
        'Failed to update delivery settings',
        err.message,
      );
    }
  }
}
