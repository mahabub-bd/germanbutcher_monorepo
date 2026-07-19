import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SSLPayment {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  tran_id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total_amount: number;

  @Column()
  currency: string;

  @Column()
  status: 'pending' | 'success' | 'failed' | 'cancelled';

  @Column({ type: 'json', nullable: true })
  payment_details: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}
