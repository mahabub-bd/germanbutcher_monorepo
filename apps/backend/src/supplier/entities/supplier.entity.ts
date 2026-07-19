import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Supplier extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the supplier',
  })
  id: number;

  @Column()
  @ApiProperty({
    example: 'Tech Distributors Inc.',
    description: 'Name of the supplier',
  })
  name: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'contact@techdist.com',
    description: 'Primary contact email',
  })
  email: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: '+1 (555) 123-4567',
    description: 'Primary contact phone',
  })
  phone: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: '123 Business Rd, Tech City',
    description: 'Physical address',
  })
  address: string;

  @OneToMany(() => Product, (product) => product.supplier)
  @ApiPropertyOptional({
    type: () => Product,
    isArray: true,
    description: 'Products supplied by this supplier',
  })
  products: Product[];

  @Column({ default: true })
  @ApiProperty({
    example: true,
    description: 'Whether the supplier is active',
    default: true,
  })
  isActive: boolean;
  @ManyToOne(() => Attachment, { nullable: true, eager: true })
  @JoinColumn()
  attachment?: Attachment;
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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who created this supplier',
  })
  createdBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who last updated this supplier',
  })
  updatedBy: User;
}
