import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class CreateSalesPointShopDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  salesPointId: number;

  @ApiProperty({ example: 'Dhanmondi Branch' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  shopName: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  division: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  district: string;

  @ApiProperty({ example: 'Dhanmondi Branch, Road 15, House 25' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  address: string;
}
