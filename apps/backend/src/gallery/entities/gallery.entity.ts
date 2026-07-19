// gallery.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Product } from 'src/product/entities/product.entity';
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('galleries')
export class Gallery {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToOne(() => Product, (product) => product.gallery)
  product: Product;

  @OneToMany(() => Attachment, (attachment) => attachment.gallery)
  attachments: Attachment[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
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
