import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Attachment } from 'src/attachment/entities/attachment.entity';
import { UpdateBusinessSettingsDto } from './dto/update-business-settings.dto';
import { BusinessSetting } from './entities/business-setting.entity';

@Injectable()
export class BusinessSettingsService {
  constructor(
    @InjectRepository(BusinessSetting)
    private readonly businessSettingsRepository: Repository<BusinessSetting>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
  ) {}

  /** The table holds a single row (id 1); seed it with defaults on first read
   * so the public storefront endpoints always return a usable payload. */
  async getSettings(): Promise<BusinessSetting> {
    try {
      const existing = await this.businessSettingsRepository.findOneBy({
        id: 1,
      });
      if (existing) return existing;

      return await this.businessSettingsRepository.save(
        this.businessSettingsRepository.create({ id: 1 }),
      );
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(
        'Failed to load business settings',
        err.message,
      );
    }
  }

  async updateSettings(
    updateBusinessSettingsDto: UpdateBusinessSettingsDto,
  ): Promise<BusinessSetting> {
    try {
      const settings = await this.getSettings();
      const { logoId, invoiceLogoId, ...rest } = updateBusinessSettingsDto;

      if (logoId !== undefined) {
        if (logoId === '') {
          settings.logo = null;
        } else {
          const logo = await this.attachmentRepository.findOne({
            where: { id: logoId },
          });
          if (!logo) {
            settings.logo = null;
          } else {
            settings.logo = logo;
          }
        }
      }

      if (invoiceLogoId !== undefined) {
        if (invoiceLogoId === '') {
          settings.invoiceLogo = null;
        } else {
          const invoiceLogo = await this.attachmentRepository.findOne({
            where: { id: invoiceLogoId },
          });
          settings.invoiceLogo = invoiceLogo ?? null;
        }
      }

      Object.assign(settings, rest);
      return await this.businessSettingsRepository.save(settings);
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(
        'Failed to update business settings',
        err.message,
      );
    }
  }
}
