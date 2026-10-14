import { PartialType } from '@nestjs/swagger';
import { CreateFlashSaleCampaignDto } from './create-flash-sale-campaign.dto';

export class UpdateFlashSaleCampaignDto extends PartialType(
  CreateFlashSaleCampaignDto,
) {}
