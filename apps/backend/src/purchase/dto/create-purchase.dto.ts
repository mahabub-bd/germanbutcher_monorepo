import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class PurchaseItemDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsNumber()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 10, description: 'Quantity purchased' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({
    example: 99.99,
    description: 'Unit price (defaults to product purchase price)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class CreatePurchaseDto {
  @ApiProperty({ example: 1, description: 'Supplier ID' })
  @IsNumber()
  @IsPositive()
  supplierId: number;

  @ApiProperty({
    example: [{ productId: 1, quantity: 5, unitPrice: 49.99 }],
    description: 'Array of purchase items',
    type: [PurchaseItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];

  @ApiPropertyOptional({
    example: '2023-05-20',
    description: 'Expected delivery date',
  })
  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional({
    example: 'Ordered via portal',
    description: 'Purchase notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 'due',
    description: 'Payment status',
    enum: ['due', 'partial', 'paid'],
  })
  @IsOptional()
  @IsIn(['due', 'partial', 'paid'])
  paymentStatus?: string;

  @ApiPropertyOptional({
    example: 500,
    description: 'Amount already paid',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @ApiPropertyOptional({
    example: '2023-06-15',
    description: 'Due date for payment',
  })
  @IsOptional()
  @IsDateString()
  paymentDueDate?: Date;

  @ApiPropertyOptional({
    example: 1499.95,
    description:
      'Total value override (calculated automatically if not provided)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalValue?: number;
}
