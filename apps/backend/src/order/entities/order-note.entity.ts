import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from 'src/common/enums';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

/**
 * Free-form internal notes attached to an order over time. Unlike the note
 * on OrderStatusTrack (one per status change), an order can accumulate any
 * number of these without touching its status.
 */
@Entity()
export class OrderNote {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.notes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  order: Order;

  @Column({ type: 'text' })
  note: string;

  /** Order status when the note was written — a snapshot, not a live link. */
  @ApiProperty({ enum: OrderStatus })
  @Column({ type: 'enum', enum: OrderStatus })
  orderStatus: OrderStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  createdBy?: User;

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
