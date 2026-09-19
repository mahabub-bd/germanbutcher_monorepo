import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateDeliverySettingsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Turn the free delivery feature on or off',
  })
  @IsOptional()
  @IsBoolean()
  freeDeliveryEnabled?: boolean;

  @ApiPropertyOptional({
    example: 2000,
    description: 'Minimum payable order amount that qualifies for free delivery',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  freeDeliveryThreshold?: number;
}
