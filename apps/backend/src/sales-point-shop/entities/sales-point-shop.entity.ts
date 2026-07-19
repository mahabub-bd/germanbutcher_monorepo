import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalesPoint } from 'src/sales-point/entities/sales-point.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sales_point_shops')
@Index(['salesPointId', 'division', 'district'])
export class SalesPointShop {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  @Index()
  salesPointId: number;

  @ApiProperty()
  @Column({ length: 255 })
  @Index()
  shopName: string;

  @ApiProperty()
  @Column({ length: 100 })
  @Index()
  division: string;

  @ApiProperty()
  @Column({ length: 100 })
  @Index()
  district: string;

  @ApiProperty()
  @Column({ type: 'text' })
  address: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => SalesPoint, (salesPoint) => salesPoint.shops, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'salesPointId' })
  @ApiPropertyOptional({ type: () => SalesPoint })
  salesPoint?: SalesPoint;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
