import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Payment } from 'src/payment/entities/payment.entity';
import { Supplier } from 'src/supplier/entities/supplier.entity';
import { User } from 'src/user/entities/user.entity';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PurchaseItem } from './purchase-item.entity';

@Entity()
export class Purchase extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the purchase',
  })
  id: number;

  @Column({ unique: true })
  @ApiProperty({
    example: 'PUR-2023-0001',
    description: 'Auto-generated purchase number',
  })
  purchaseNumber: string;

  @OneToMany(() => PurchaseItem, (item) => item.purchase, {
    cascade: true,
    eager: true,
  })
  @ApiProperty({
    type: () => [PurchaseItem],
    description: 'Items included in this purchase',
  })
  items: PurchaseItem[];

  @ManyToOne(() => Supplier, { eager: true })
  @JoinColumn()
  @ApiProperty({
    type: () => Supplier,
    description: 'The supplier for this purchase',
  })
  supplier: Supplier;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'Total value of the purchase (sum of all items total)',
  })
  @ApiProperty({
    example: 14999.0,
    description: 'Total purchase value (sum of all items total)',
    type: 'number',
    format: 'decimal',
    minimum: 0.01,
  })
  totalValue: number;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'purchase_date',
  })
  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Automatic purchase timestamp',
    readOnly: true,
  })
  purchaseDate: Date;

  @Column({ default: 'pending' })
  @ApiProperty({
    example: 'delivered',
    description: 'Purchase status',
    enum: ['pending', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    example: 'Ordered via online portal',
    description: 'Additional notes about the purchase',
  })
  notes: string;

  @Column({ default: 'due' })
  @ApiProperty({
    example: 'due',
    description: 'Payment status',
    enum: ['due', 'partial', 'paid'],
    default: 'due',
  })
  paymentStatus: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  @ApiProperty({
    example: 5000.0,
    description: 'Amount paid so far',
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  amountPaid: number;

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

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who created this purchase',
  })
  createdBy: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedBy' })
  @ApiProperty({
    type: () => User,
    description: 'User who last updated this purchase',
  })
  updatedBy: User;

  @OneToMany(() => Payment, (payment) => payment.purchase)
  @ApiProperty({
    type: () => [Payment],
    description: 'Payments made for this purchase',
  })
  payments: Payment[];

  @BeforeInsert()

  // Make generatePurchaseNumber async
  async generatePurchaseNumber() {
    if (!this.purchaseNumber) {
      const lastPurchase = await Purchase.findOne({
        where: {},
        order: { id: 'DESC' },
      });

      const lastNumber = lastPurchase?.purchaseNumber
        ? parseInt(lastPurchase.purchaseNumber.split('-').pop() || '0', 10)
        : 0;

      this.purchaseNumber = `PUR-${new Date().getFullYear()}-${(lastNumber + 1)
        .toString()
        .padStart(4, '0')}`;
    }
  }

  calculateTotalValue() {
    this.totalValue = this.items.reduce((sum, item) => sum + item.total, 0);
  }

  recalculateTotalValue() {
    this.totalValue =
      this.items?.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ) || 0;
    this.totalValue = Number(this.totalValue.toFixed(2));
  }

  updatePaymentStatus() {
    if (this.amountPaid >= this.totalValue) {
      this.paymentStatus = 'paid';
    } else if (this.amountPaid > 0) {
      this.paymentStatus = 'partial';
    } else {
      this.paymentStatus = 'due';
    }
  }

  @BeforeInsert()
  handleBeforeInsert() {
    this.generatePurchaseNumber();
    this.calculateTotalValue();
    this.updatePaymentStatus();
  }

  @BeforeUpdate()
  handleBeforeUpdate() {
    this.recalculateTotalValue();
    this.updatePaymentStatus();
  }

  @BeforeInsert()
  setPurchaseDate() {
    if (!this.purchaseDate) {
      this.purchaseDate = new Date();
    }
  }
}
