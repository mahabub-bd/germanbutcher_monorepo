import { PartialType } from '@nestjs/swagger';
import { CreateSalesPointDto } from './create-sales-point.dto';

export class UpdateSalesPointDto extends PartialType(CreateSalesPointDto) {}
