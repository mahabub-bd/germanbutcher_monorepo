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

@Entity('analytics')
@Index(['timestamp', 'endpoint'])
export class Analytics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 500 })
  endpoint: string;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'int' })
  responseTime: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Index()
  @CreateDateColumn({ type: 'timestamp' })
  timestamp: Date;

  @Column({ default: false })
  isAuthenticated: boolean;
}
