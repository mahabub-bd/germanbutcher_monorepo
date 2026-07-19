import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { Attachment } from 'src/attachment/entities/attachment.entity';

@Entity('sales_partner')
export class SalesPartner {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the sales partner' })
  Id: number;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: 'Name of the sales partner' })
  name: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: 'Description of the sales partner',
    required: false,
  })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({
    description: 'Website URL of the sales partner',
    required: false,
  })
  website?: string;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Order of client' })
  order: number;

  @ManyToOne(() => Attachment, { eager: true })
  @JoinColumn()
  @ApiProperty({
    type: () => Attachment,
    description: 'Image attachment for the sales partner',
  })
  Image: Attachment;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({ description: 'Indicates whether the sales partner is active' })
  isActive: boolean;

  @CreateDateColumn()
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Creation timestamp',
    readOnly: true,
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Last update timestamp',
    readOnly: true,
  })
  updatedAt: Date;
}
