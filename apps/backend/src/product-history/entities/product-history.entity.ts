import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ProductHistoryAction {
  CREATED = 'created',
  UPDATED = 'updated',
  ACTIVATED = 'activated',
  DEACTIVATED = 'deactivated',
  DELETED = 'deleted',
}

/** Dedicated audit table for product lifecycle events. Kept separately
 * from the shared user_activities audit log so product history never
 * expires with the general 90-day retention. Retention: the last
 * PRODUCT_HISTORY_KEEP records per product (see the service). */
@Entity('product_history')
@Index(['productId', 'createdAt'])
@Index(['createdAt'])
export class ProductHistory {
  @PrimaryGeneratedColumn()
  id: number;

  /** Not a FK on purpose: history survives product deletion. Null when
   * the product row is gone. */
  @Column({ nullable: true })
  productId: number;

  /** Name snapshot so the entry stays readable after deletion/rename. */
  @Column()
  productName: string;

  @Column({ type: 'enum', enum: ProductHistoryAction })
  action: ProductHistoryAction;

  /** Field-level diff for updates: { field: { from, to } }. */
  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, { from: unknown; to: unknown }> | null;

  /** Full field snapshot for created/deleted events. */
  @Column({ type: 'jsonb', nullable: true })
  snapshot: Record<string, unknown> | null;

  @Column({ nullable: true })
  userId: number;

  /** Who did it — snapshot, survives user deletion. */
  @Column({ nullable: true })
  userName: string;

  @CreateDateColumn()
  createdAt: Date;
}
