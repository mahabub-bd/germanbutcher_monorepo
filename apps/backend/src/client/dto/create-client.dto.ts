import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ description: 'Name of the client' })
  Name: string;

  @ApiProperty({ description: 'Image of the client' })
  Image: number;

  @ApiProperty({ description: 'Order of the client' })
  order: number;

  @ApiProperty({ description: 'Is the client active' })
  isActive: boolean;
}
