import { PartialType } from '@nestjs/swagger';
import { CreateSalesPartnerDto } from './create-sales-partner.dto';

export class UpdateSalesPartnerDto extends PartialType(CreateSalesPartnerDto) {}
