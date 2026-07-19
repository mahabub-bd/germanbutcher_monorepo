import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty({
    example: 'Sarah Johnson',
    description: 'Customer name',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Loyal Customer',
    description: 'Customer role or title',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Attachment ID for customer avatar image',
  })
  @IsOptional()
  @IsString()
  attachmentId?: string;

  @ApiProperty({
    example: 5,
    description: 'Rating from 1 to 5',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example:
      "I've been shopping here for years and the quality never disappoints. The customer service is exceptional and delivery is always on time!",
    description: 'Customer testimonial text',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Whether the testimonial should be published/visible to public (default: false)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublish?: boolean;
}
