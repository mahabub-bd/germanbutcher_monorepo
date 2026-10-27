import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum StockMovementType {
  /** Stock added by a delivered purchase. */
  PURCHASE = 'purchase',
  /** Stock removed because a delivered purchase was reverted or deleted. */
  PURCHASE_REVERSAL = 'purchase_reversal',
  /** Stock taken out by a placed order. */
  ORDER_SALE = 'order_sale',
  /** Stock restored because an order was cancelled. */
  ORDER_CANCEL = 'order_cancel',
}

/** Per-product stock movement ledger: one row per stock change, with
 * before/after snapshots so the current stock can always be reconciled
 * against the history of how it got there. */
@Entity('stock_movements')
@Index(['productId', 'createdAt'])
@Index(['createdAt'])
@Index(['type'])
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  /** Not a FK on purpose: movements survive product deletion. Null when
   * the product row is gone. */
  @Column({ nullable: true })
  productId: number;

  /** Name snapshot so the entry stays readable after deletion/rename. */
  @Column()
  productName: string;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  /** Signed quantity change (+in / -out). */
  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  stockBefore: number;

  @Column({ type: 'int' })
  stockAfter: number;

  /** What caused the movement: 'purchase' | 'order'. */
  @Column({ length: 50, nullable: true })
  referenceType: string;

  @Column({ nullable: true })
  referenceId: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ nullable: true })
  userId: number;

  /** Who did it — snapshot, survives user deletion. */
  @Column({ nullable: true })
  userName: string;

  @CreateDateColumn()
  createdAt: Date;
}
