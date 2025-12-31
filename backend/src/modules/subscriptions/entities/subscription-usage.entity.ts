import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * SubscriptionUsage Entity
 * 
 * Tracks feature usage to enforce limits and provide analytics.
 * 
 * Examples:
 * - ai_assistant: Count queries per month
 * - smart_matching: Count matches per day
 * - auto_pricing: Count pricing calculations
 */
@Entity('subscription_usage')
@Index(['userId', 'featureKey', 'periodStart'])
export class SubscriptionUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  featureKey: string; // 'ai_assistant', 'smart_matching', etc.

  // Usage tracking
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  // Billing period
  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Per-usage details

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
