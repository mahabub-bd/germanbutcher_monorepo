import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeliveryManDto {
  @ApiProperty({
    description: 'Delivery man name',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Delivery man mobile number',
    example: '+880171234567',
  })
  @IsNotEmpty()
  @IsString()
  mobileNumber: string;

  @ApiProperty({
    description: 'Whether the delivery man is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
