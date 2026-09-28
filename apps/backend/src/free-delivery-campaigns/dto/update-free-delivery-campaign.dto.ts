import { PartialType } from '@nestjs/swagger';
import { CreateFreeDeliveryCampaignDto } from './create-free-delivery-campaign.dto';

export class UpdateFreeDeliveryCampaignDto extends PartialType(
  CreateFreeDeliveryCampaignDto,
) {}
