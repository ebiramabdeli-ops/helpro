import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionFeature } from '../entities/subscription-feature.entity';
import { SubscriptionUsage } from '../entities/subscription-usage.entity';
import { SubscriptionTier, SubscriptionStatus } from '../../../common/enums';

/**
 * FeatureGateService
 * 
 * Backend decides which features users can access based on their subscription tier.
 * 
 * Philosophy:
 * - BASIC: Manual everything (no automation)
 * - PRO: Smart automation (rule-based, no AI)
 * - PREMIUM: AI-powered (LLM allowed, limited usage)
 * 
 * Usage:
 * ```typescript
 * await featureGate.checkAccess(user, 'smart_matching');
 * const canUse = await featureGate.canUseFeature(user, 'ai_assistant');
 * ```
 */
@Injectable()
export class FeatureGateService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionFeature)
    private featureRepo: Repository<SubscriptionFeature>,
    @InjectRepository(SubscriptionUsage)
    private usageRepo: Repository<SubscriptionUsage>,
  ) {}

  /**
   * Check if user can access a feature. Throws ForbiddenException if not.
   */
  async checkAccess(user: User, featureKey: string): Promise<void> {
    const canUse = await this.canUseFeature(user, featureKey);
    if (!canUse) {
      const feature = await this.featureRepo.findOne({
        where: { featureKey, isActive: true },
      });

      throw new ForbiddenException({
        message: `This feature requires ${feature?.minimumTier.toUpperCase()} tier or higher`,
        featureKey,
        currentTier: user.subscription?.tier || 'none',
        requiredTier: feature?.minimumTier,
        upgradeUrl: '/pricing',
      });
    }
  }

  /**
   * Check if user can use a feature (non-throwing version).
   */
  async canUseFeature(user: User, featureKey: string): Promise<boolean> {
    // Get user's subscription
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId: user.id },
    });

    if (!subscription) {
      return false; // No subscription = BASIC tier (only free features)
    }

    // During trial, all features are unlocked
    if (subscription.status === SubscriptionStatus.TRIAL) {
      return true;
    }

    // Get feature config
    const feature = await this.featureRepo.findOne({
      where: { featureKey, isActive: true },
    });

    if (!feature) {
      return false; // Feature doesn't exist or is disabled
    }

    // Check tier access
    const tierOrder = [
      SubscriptionTier.BASIC,
      SubscriptionTier.PRO,
      SubscriptionTier.PREMIUM,
    ];

    const userTierIndex = tierOrder.indexOf(subscription.tier);
    const requiredTierIndex = tierOrder.indexOf(feature.minimumTier);

    if (userTierIndex < requiredTierIndex) {
      return false; // User's tier is too low
    }

    // Check usage limits
    if (feature.monthlyLimit || feature.dailyLimit) {
      const hasLimit = await this.checkUsageLimit(
        user.id,
        featureKey,
        feature.monthlyLimit,
        feature.dailyLimit,
      );

      if (!hasLimit) {
        return false; // Usage limit exceeded
      }
    }

    return true;
  }

  /**
   * Check if user has remaining usage quota for a feature.
   */
  private async checkUsageLimit(
    userId: string,
    featureKey: string,
    monthlyLimit: number | null,
    dailyLimit: number | null,
  ): Promise<boolean> {
    const now = new Date();

    // Check monthly limit
    if (monthlyLimit) {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthlyUsage = await this.usageRepo.findOne({
        where: {
          userId,
          featureKey,
          periodStart: monthStart,
          periodEnd: monthEnd,
        },
      });

      if (monthlyUsage && monthlyUsage.usageCount >= monthlyLimit) {
        return false;
      }
    }

    // Check daily limit
    if (dailyLimit) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const dailyUsage = await this.usageRepo.findOne({
        where: {
          userId,
          featureKey,
          periodStart: dayStart,
          periodEnd: dayEnd,
        },
      });

      if (dailyUsage && dailyUsage.usageCount >= dailyLimit) {
        return false;
      }
    }

    return true;
  }

  /**
   * Record feature usage (for analytics and limit enforcement).
   */
  async recordUsage(userId: string, featureKey: string, metadata?: Record<string, any>): Promise<void> {
    const now = new Date();

    // Record monthly usage
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await this.incrementUsage(userId, featureKey, monthStart, monthEnd, metadata);

    // Record daily usage
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    await this.incrementUsage(userId, featureKey, dayStart, dayEnd, metadata);
  }

  /**
   * Increment usage count for a period.
   */
  private async incrementUsage(
    userId: string,
    featureKey: string,
    periodStart: Date,
    periodEnd: Date,
    metadata?: Record<string, any>,
  ): Promise<void> {
    let usage = await this.usageRepo.findOne({
      where: { userId, featureKey, periodStart, periodEnd },
    });

    if (!usage) {
      usage = this.usageRepo.create({
        userId,
        featureKey,
        periodStart,
        periodEnd,
        usageCount: 0,
        metadata: metadata || {},
      });
    }

    usage.usageCount += 1;

    if (metadata) {
      usage.metadata = { ...usage.metadata, ...metadata };
    }

    await this.usageRepo.save(usage);
  }

  /**
   * Get user's tier with all features unlocked during trial.
   */
  async getUserTier(user: User): Promise<SubscriptionTier> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId: user.id },
    });

    if (!subscription) {
      return SubscriptionTier.BASIC;
    }

    return subscription.tier;
  }

  /**
   * Check if user is in trial period.
   */
  async isInTrial(user: User): Promise<boolean> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId: user.id },
    });

    if (!subscription) {
      return false;
    }

    return subscription.status === SubscriptionStatus.TRIAL;
  }
}
