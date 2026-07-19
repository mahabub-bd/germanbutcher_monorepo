import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
}
