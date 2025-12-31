import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

export enum PaymentStatus {
  PENDING = 'pending',         // Payment initiated
  AUTHORIZED = 'authorized',   // Card authorized, not charged
  ESCROWED = 'escrowed',       // Money held in escrow
  RELEASED = 'released',       // Released to provider
  REFUNDED = 'refunded',       // Refunded to customer
  FAILED = 'failed',           // Payment failed
  CANCELLED = 'cancelled',     // Payment cancelled
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relationships
  @ManyToOne(() => Order)
  @JoinColumn()
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => User)
  @JoinColumn()
  customer: User;

  @Column()
  customerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  provider: User;

  @Column({ nullable: true })
  providerId: string;

  // Payment Details
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  providerAmount: number; // Amount after platform fee

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  // Escrow Tracking
  @Column({ nullable: true })
  escrowedAt: Date;

  @Column({ nullable: true })
  releasedAt: Date;

  @Column({ nullable: true })
  releaseScheduledAt: Date; // Auto-release after X days

  // Payment Provider (Stripe, etc.)
  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @Column({ nullable: true })
  stripeChargeId: string;

  @Column({ nullable: true })
  stripeTransferId: string;

  @Column({ nullable: true })
  stripeRefundId: string;

  // Payment Method Details
  @Column({ nullable: true })
  cardLast4: string;

  @Column({ nullable: true })
  cardBrand: string; // 'visa', 'mastercard'

  // Status History
  @Column({ type: 'simple-json', nullable: true })
  statusHistory: {
    status: PaymentStatus;
    timestamp: Date;
    reason?: string;
  }[];

  // Refund
  @Column({ nullable: true })
  refundedAt: Date;

  @Column({ nullable: true })
  refundReason: string;

  @Column({ nullable: true })
  refundedBy: string; // User ID who initiated refund

  // Failure
  @Column({ nullable: true })
  failureCode: string;

  @Column({ nullable: true })
  failureMessage: string;

  // Metadata
  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
