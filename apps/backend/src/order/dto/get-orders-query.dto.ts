import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { OrderStatus } from 'src/common/enums';

export class GetOrdersQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit: number = 10;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    enum: ['date_asc', 'date_desc'],
    required: false,
    description: 'Sort by creation date',
  })
  @IsOptional()
  sort?: 'date_asc' | 'date_desc';

  @ApiProperty({ enum: OrderStatus, required: false })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}
