import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionTier } from '../../../common/enums';

/**
 * CommissionService
 * 
 * Calculates platform commission based on subscription tier.
 * 
 * Commission Structure:
 * - BASIC: 10-15% (user pays least upfront, we take more per job)
 * - PRO: 5-8% (user pays subscription, we take less per job)
 * - PREMIUM: 0-2% (user pays high subscription, we take almost nothing)
 * 
 * Philosophy:
 * - Low subscription = high commission (community mode)
 * - High subscription = low commission (professional mode)
 * 
 * Usage:
 * ```typescript
 * const commission = await commissionService.calculate(order, user);
 * ```
 */
@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
  ) {}

  /**
   * Commission rates per tier.
   */
  private readonly COMMISSION_RATES = {
    [SubscriptionTier.BASIC]: {
      min: 10, // 10%
      max: 15, // 15%
      default: 12, // 12% average
    },
    [SubscriptionTier.PRO]: {
      min: 5, // 5%
      max: 8, // 8%
      default: 6, // 6% average
    },
    [SubscriptionTier.PREMIUM]: {
      min: 0, // 0%
      max: 2, // 2%
      default: 1, // 1% average
    },
  };

  /**
   * Calculate commission for an order.
   * 
   * @param orderAmount - Total order amount in cents
   * @param userId - Provider user ID
   * @returns Commission amount in cents
   */
  async calculate(orderAmount: number, userId: string): Promise<number> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId },
    });

    const tier = subscription?.tier || SubscriptionTier.BASIC;
    const rate = this.COMMISSION_RATES[tier].default;

    const commission = Math.round((orderAmount * rate) / 100);

    return commission;
  }

  /**
   * Get commission percentage for a user.
   */
  async getCommissionPercentage(userId: string): Promise<number> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId },
    });

    const tier = subscription?.tier || SubscriptionTier.BASIC;

    return this.COMMISSION_RATES[tier].default;
  }

  /**
   * Get commission breakdown for display.
   */
  async getCommissionBreakdown(
    orderAmount: number,
    userId: string,
  ): Promise<{
    orderAmount: number;
    commissionPercentage: number;
    commissionAmount: number;
    providerEarnings: number;
    tier: SubscriptionTier;
  }> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId },
    });

    const tier = subscription?.tier || SubscriptionTier.BASIC;
    const commissionPercentage = this.COMMISSION_RATES[tier].default;
    const commissionAmount = Math.round((orderAmount * commissionPercentage) / 100);
    const providerEarnings = orderAmount - commissionAmount;

    return {
      orderAmount,
      commissionPercentage,
      commissionAmount,
      providerEarnings,
      tier,
    };
  }

  /**
   * Calculate potential savings if user upgrades tier.
   * Used for upsell messaging.
   */
  async calculateUpgradeSavings(
    userId: string,
    averageMonthlyEarnings: number,
  ): Promise<{
    currentTier: SubscriptionTier;
    currentCommission: number;
    upgradeTier: SubscriptionTier;
    upgradeCommission: number;
    monthlySavings: number;
    annualSavings: number;
  } | null> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId },
    });

    const currentTier = subscription?.tier || SubscriptionTier.BASIC;

    // Already on highest tier
    if (currentTier === SubscriptionTier.PREMIUM) {
      return null;
    }

    // Calculate savings
    const currentRate = this.COMMISSION_RATES[currentTier].default;
    const currentCommission = Math.round((averageMonthlyEarnings * currentRate) / 100);

    const upgradeTier =
      currentTier === SubscriptionTier.BASIC
        ? SubscriptionTier.PRO
        : SubscriptionTier.PREMIUM;

    const upgradeRate = this.COMMISSION_RATES[upgradeTier].default;
    const upgradeCommission = Math.round((averageMonthlyEarnings * upgradeRate) / 100);

    const monthlySavings = currentCommission - upgradeCommission;
    const annualSavings = monthlySavings * 12;

    return {
      currentTier,
      currentCommission,
      upgradeTier,
      upgradeCommission,
      monthlySavings,
      annualSavings,
    };
  }
}
