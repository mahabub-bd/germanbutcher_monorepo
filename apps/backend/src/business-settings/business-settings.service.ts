import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Attachment } from 'src/attachment/entities/attachment.entity';
import { DeliveryCoverageService } from 'src/delivery-coverage/delivery-coverage.service';
import { UpdateBusinessSettingsDto } from './dto/update-business-settings.dto';
import { BusinessSetting } from './entities/business-setting.entity';

@Injectable()
export class BusinessSettingsService {
  constructor(
    @InjectRepository(BusinessSetting)
    private readonly businessSettingsRepository: Repository<BusinessSetting>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    private readonly deliveryCoverageService: DeliveryCoverageService,
  ) {}

  /** The table holds a single row (id 1); seed it with defaults on first read
   * so the public storefront endpoints always return a usable payload. */
  async getSettings(): Promise<BusinessSetting> {
    try {
      const existing = await this.businessSettingsRepository.findOneBy({
        id: 1,
      });
      if (existing) return await this.withLiveCoverage(existing);

      return await this.withLiveCoverage(
        await this.businessSettingsRepository.save(
          this.businessSettingsRepository.create({ id: 1 }),
        ),
      );
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(
        'Failed to load business settings',
        err.message,
      );
    }
  }

  /** Delivery coverage now lives in its own tables — compose the tree into
   *  the payload so every existing reader of settings.deliveryCoverage keeps
   *  working unchanged. Falls back to the stored jsonb on failure. */
  private async withLiveCoverage(
    settings: BusinessSetting,
  ): Promise<BusinessSetting> {
    try {
      settings.deliveryCoverage =
        await this.deliveryCoverageService.getCoverage();
    } catch (error) {
      // Coverage is non-critical for the rest of the settings payload —
      // keep the legacy jsonb value rather than failing the request.
    }
    return settings;
  }

  async updateSettings(
    updateBusinessSettingsDto: UpdateBusinessSettingsDto,
  ): Promise<BusinessSetting> {
    try {
      const settings = await this.getSettings();
      const {
        logoId,
        invoiceLogoId,
        // Coverage goes to its own tables, not the jsonb column.
        deliveryCoverage,
        ...rest
      } = updateBusinessSettingsDto;

      if (deliveryCoverage !== undefined && deliveryCoverage !== null) {
        await this.deliveryCoverageService.saveCoverage(deliveryCoverage);
      }

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
      const saved = await this.businessSettingsRepository.save(settings);
      return await this.withLiveCoverage(saved);
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(
        'Failed to update business settings',
        err.message,
      );
    }
  }
}
