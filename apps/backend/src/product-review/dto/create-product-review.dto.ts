import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateProductReviewDto {
  @ApiProperty({ example: 5, description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @ApiPropertyOptional({
    example: 'Excellent quality',
    description: 'Optional short review title',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  title?: string;

  @ApiProperty({
    example: 'The meat was fresh and delivery was on time. Highly recommended!',
    description: 'Review comment text',
    minLength: 5,
    maxLength: 2000,
  })
  @IsString()
  @Length(5, 2000)
  @IsNotEmpty()
  comment: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-...',
    description: 'ID of an uploaded attachment (review photo)',
  })
  @IsOptional()
  @IsString()
  attachmentId?: string;
}
