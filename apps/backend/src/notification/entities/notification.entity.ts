import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  /** Recipient user. Null = broadcast, visible to all users. */
  @Column({ name: 'user_id', type: 'int', nullable: true })
  @Index()
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Feed the notification belongs to: 'user' (customer feed, including
   * broadcasts) or 'admin' (admin dashboard, e.g. new-order alerts).
   */
  @Column({ type: 'varchar', length: 10, default: 'user' })
  @Index()
  audience: 'user' | 'admin';

  /**
   * Event kind, matching the socket event names:
   * newOrder | orderConfirmation | orderStatusUpdate | paymentStatusUpdate | notification | broadcast
   */
  @Column({ type: 'varchar', length: 50 })
  @Index()
  type: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  /** Optional payload (order snapshot, broadcast offer data, ...). */
  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any> | null;

  @Column({ type: 'boolean', default: false })
  @Index()
  isRead: boolean;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
