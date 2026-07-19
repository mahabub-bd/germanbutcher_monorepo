import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRecipeDto {
  @ApiProperty({
    example: 'Spaghetti Carbonara',
    description: 'Title of the recipe',
  })
  title: string;

  @ApiProperty({
    example: 'Cook pasta, fry bacon, mix with eggs and cheese...',
    description: 'Detailed instructions for the recipe',
  })
  details: string;

  @ApiPropertyOptional({
    example: 'Calories: 500, Protein: 20g',
    description: 'Nutritional information about the recipe',
  })
  nutrition_details?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID of the attachment/image for the recipe',
  })
  attachmentId?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the recipe is published or not',
    default: true,
  })
  isPublished?: boolean;

  @ApiProperty({
    example: 1,
    description: 'ID of the category this product belongs to',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;
}
