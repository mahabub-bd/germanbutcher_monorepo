import { PartialType } from '@nestjs/swagger';
import { CreateDeliveryManDto } from './create-delivery-man.dto';

export class UpdateDeliveryManDto extends PartialType(CreateDeliveryManDto) {}
