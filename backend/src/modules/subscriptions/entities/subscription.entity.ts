import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SubscriptionTier, SubscriptionStatus } from '../../../common/enums';

/**
 * Subscription Entity
 * 
 * Tracks user subscription tier and billing status.
 * 
 * 3 Tiers:
 * - BASIC: FREE or €4.99/month, 10-15% commission
 * - PRO: €14.99-24.99/month, 5-8% commission
 * - PREMIUM: €39.99-79.99/month, ~0% commission
 * 
 * Trial: 3 days free with all features unlocked.
 * After trial: User chooses plan or auto-downgrades to BASIC.
 */
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.BASIC,
  })
  tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  status: SubscriptionStatus;

  // Trial period (3 days)
  @Column({ type: 'timestamp', nullable: true })
  trialStartedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  // Billing period
  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  // Stripe integration
  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripePriceId: string; // which price variant (monthly/annual)

  // Billing
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPrice: number; // Actual price paid (can vary)

  @Column({ default: true })
  autoRenew: boolean;

  // Cancellation
  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelledBy: 'user' | 'admin' | 'system';

  @Column({ nullable: true })
  cancellationReason: string;

  // Suspension (payment failure)
  @Column({ type: 'timestamp', nullable: true })
  suspendedAt: Date;

  @Column({ nullable: true })
  suspensionReason: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Analytics, promo codes, etc.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
