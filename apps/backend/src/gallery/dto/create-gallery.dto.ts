// create-gallery.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGalleryDto {
  @ApiPropertyOptional({
    example: 'Summer Vacation Photos',
    description: 'The name of the gallery',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'Photos from our 2023 summer trip',
    description: 'Optional description of the gallery'
  })
  description?: string;
}