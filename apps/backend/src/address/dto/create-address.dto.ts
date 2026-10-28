import { ApiProperty } from '@nestjs/swagger';
import { AddressType } from 'src/common/enums';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: '542,East Badda', required: true })
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address cannot be empty' })
  address: string;

  // Area/Division/City are optional: the admin can turn any of these
  // fields off in Business Settings, and then the storefront never
  // sends them. The DB columns are nullable.
  @ApiProperty({ example: 'Badda', required: false })
  @IsOptional()
  @IsString({ message: 'Area must be a string' })
  area?: string;

  @ApiProperty({ example: 'Dhaka', required: false })
  @IsOptional()
  @IsString({ message: 'Division must be a string' })
  division?: string;

  @ApiProperty({ example: 'Dhaka', required: false })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  city?: string;

  @ApiProperty({ enum: AddressType, example: AddressType.BILLING })
  @IsEnum(AddressType, { message: 'Type must be a valid address type' })
  @IsNotEmpty({ message: 'Type cannot be empty' })
  type: AddressType;

  @ApiProperty({ example: true, default: false })
  @IsBoolean({ message: 'isDefault must be a boolean' })
  @IsOptional()
  isDefault?: boolean;
}
