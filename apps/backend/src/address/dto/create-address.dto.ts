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

  @ApiProperty({ example: 'Badda', required: true })
  @IsString({ message: 'Area must be a string' })
  @IsNotEmpty({ message: 'Area cannot be empty' })
  area: string;

  @ApiProperty({ example: 'Dhaka', required: true })
  @IsString({ message: 'Division must be a string' })
  @IsNotEmpty({ message: 'Division cannot be empty' })
  division: string;

  @ApiProperty({ example: 'Dhaka', required: true })
  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City cannot be empty' })
  city: string;

  @ApiProperty({ enum: AddressType, example: AddressType.BILLING })
  @IsEnum(AddressType, { message: 'Type must be a valid address type' })
  @IsNotEmpty({ message: 'Type cannot be empty' })
  type: AddressType;

  @ApiProperty({ example: true, default: false })
  @IsBoolean({ message: 'isDefault must be a boolean' })
  @IsOptional()
  isDefault?: boolean;
}
