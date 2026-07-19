import { PartialType } from '@nestjs/swagger';
import { CreateSalesPointShopDto } from './create-sales-point-shop.dto';

export class UpdateSalesPointShopDto extends PartialType(CreateSalesPointShopDto) {}
