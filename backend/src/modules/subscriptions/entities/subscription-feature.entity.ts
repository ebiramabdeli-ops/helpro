import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionTier } from '../../../common/enums';

/**
 * SubscriptionFeature Entity
 * 
 * Config-driven feature gates. Backend decides which features each tier can access.
 * 
 * BASIC Features:
 * - basic_search (manual provider search)
 * - basic_booking (create orders)
 * - basic_support (email support)
 * 
 * PRO Features (BASIC + ):
 * - smart_matching (rule-based matching algorithm)
 * - auto_pricing (dynamic pricing suggestions)
 * - priority_support (faster response time)
 * - advanced_analytics (earnings reports)
 * 
 * PREMIUM Features (PRO + ):
 * - ai_assistant (LLM-powered chat, task planning)
 * - unlimited_jobs (no monthly limit)
 * - white_label (custom branding)
 * - api_access (REST API for integrations)
 */
@Entity('subscription_features')
export class SubscriptionFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  featureKey: string; // 'smart_matching', 'ai_assistant', etc.

  @Column()
  name: string; // Human-readable name

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
  })
  minimumTier: SubscriptionTier; // Minimum tier required

  @Column({ default: true })
  isActive: boolean; // Feature flag (can disable globally)

  // Usage limits (null = unlimited)
  @Column({ type: 'int', nullable: true })
  monthlyLimit: number; // e.g., ai_assistant: 100 queries/month

  @Column({ type: 'int', nullable: true })
  dailyLimit: number;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Custom config per feature

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
