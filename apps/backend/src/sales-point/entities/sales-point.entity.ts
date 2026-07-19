import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { SalesPointShop } from 'src/sales-point-shop/entities/sales-point-shop.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sales_points')
export class SalesPoint {
  @ApiProperty({
    description: 'Unique identifier for the sales point',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Name of the sales point/company',
    example: 'Shwapno',
    maxLength: 255,
  })
  @Column({ length: 255, unique: true })
  name: string;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Order of shop' })
  order: number;

  @ApiPropertyOptional({
    description: 'ID of the logo attachment',
    example: 1,
    nullable: true,
  })
  @Column({ nullable: true })
  logoAttachmentId?: number;

  @ApiPropertyOptional({
    description: 'Description of the sales point/company',
    example: 'Leading retail chain in Bangladesh',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({
    description: 'Official website URL',
    example: 'https://www.shwapno.com',
    maxLength: 255,
    nullable: true,
  })
  @Column({ length: 255, nullable: true })
  website?: string;

  @ApiPropertyOptional({
    description: 'Primary contact number',
    example: '+880-1234-567890',
    maxLength: 20,
    nullable: true,
  })
  @Column({ length: 20, nullable: true })
  contactNumber?: string;

  @ApiPropertyOptional({
    description: 'Primary email address',
    example: 'info@shwapno.com',
    maxLength: 255,
    nullable: true,
  })
  @Column({ length: 255, nullable: true })
  email?: string;

  @ApiProperty({
    description: 'Whether the sales point is active',
    example: true,
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Attachment, { eager: true })
  @JoinColumn({ name: 'logoAttachmentId' })
  @ApiPropertyOptional({
    type: () => Attachment,
    description: 'Logo attachment details',
  })
  logoAttachment?: Attachment;

  @OneToMany(() => SalesPointShop, (shop) => shop.salesPoint, {
    cascade: false,
    eager: true, // Prevent accidental cascading
  })
  @ApiPropertyOptional({
    type: () => [SalesPointShop],
    description: 'List of shops/branches under this sales point',
  })
  shops?: SalesPointShop[];

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2023-05-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Record last update timestamp',
    example: '2023-05-15T10:35:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
