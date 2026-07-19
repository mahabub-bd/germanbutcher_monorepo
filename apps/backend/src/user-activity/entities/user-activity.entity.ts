import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

export enum UserType {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  SYSTEM = 'system',
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

@Entity()
@Index(['userId', 'action'])
@Index(['entityType', 'entityId'])
@Index(['createdAt'])
export class UserActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.activities, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  userId: number;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.CUSTOMER,
  })
  userType: UserType;

  @Column()
  action: string;

  @Column({ nullable: true })
  entityType: string;

  @Column({ nullable: true })
  entityId: number;

  @Column({ type: 'jsonb', nullable: true })
  oldValue: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValue: Record<string, any>;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  requestId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.SUCCESS,
  })
  status: AuditStatus;

  @Column({ type: 'text', nullable: true })
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}
