import { PartialType } from '@nestjs/swagger';
import { CreateBogoCampaignDto } from './create-bogo-campaign.dto';

export class UpdateBogoCampaignDto extends PartialType(CreateBogoCampaignDto) {}
