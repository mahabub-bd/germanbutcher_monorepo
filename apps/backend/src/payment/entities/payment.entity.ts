import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from 'src/payment-method/entities/payment-method.entity';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { User } from 'src/user/entities/user.entity';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'The unique identifier for the payment',
  })
  id: number;

  @Column({ unique: true })
  @ApiProperty({
    example: 'PAY-2023-0001',
    description: 'Auto-generated payment reference number',
  })
  paymentNumber: string;

  @ManyToOne(() => Purchase, (purchase) => purchase.payments, { eager: true })
  @JoinColumn()
  @ApiProperty({
    type: () => Purchase,
    description: 'The purchase this payment is for',
  })
  purchase: Purchase;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  @ApiProperty({
    example: 5000.0,
    description: 'Amount paid',
    type: 'number',
    format: 'decimal',
    minimum: 0.01,
  })
  amount: number;

  @Column({ type: 'date' })
  @ApiProperty({
    example: '2023-05-15',
    description: 'Date when payment was made',
  })
  paymentDate: Date;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.payments, {
    eager: true,
  })
  @JoinColumn({ name: 'paymentMethodId' })
  @ApiProperty({
    type: () => PaymentMethod,
    description: 'The payment method used for this payment',
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'TRX123456789',
    description: 'Transaction reference or cheque number',
  })
  referenceNumber: string;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    example: 'Paid via bank transfer',
    description: 'Additional notes about the payment',
  })
  notes: string;

  @Column({ default: 'completed' })
  @ApiProperty({
    example: 'completed',
    description: 'Payment status',
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
  })
  status: string;

  @BeforeInsert()
  async generatePaymentNumber() {
    if (!this.paymentNumber) {
      const lastPayment = await Payment.find({
        order: { id: 'DESC' },
        take: 1,
      });

      const lastNumber = lastPayment[0]?.paymentNumber
        ? parseInt(lastPayment[0].paymentNumber.split('-').pop() || '0')
        : 0;

      this.paymentNumber = `PAY-${new Date().getFullYear()}-${(lastNumber + 1).toString().padStart(4, '0')}`;
    }
  }

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

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who recorded this payment',
  })
  createdBy: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who last updated this payment',
  })
  updatedBy: User;
}
