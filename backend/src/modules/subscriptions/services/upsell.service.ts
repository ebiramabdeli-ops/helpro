import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subscription } from '../entities/subscription.entity';
import { Order } from '../../orders/entities/order.entity';
import { SubscriptionTier } from '../../../common/enums';
import { CommissionService } from './commission.service';

/**
 * UpsellService
 * 
 * Smart recommendation engine for subscription upgrades.
 * 
 * Philosophy (from founder):
 * - ✅ "Upgrade to PRO to get better matches"
 * - ✅ "Premium users earn 32% more"
 * - ✅ "Save time with Private Assistant"
 * - ❌ NEVER say: "Buy AI"
 * 
 * Key Messages:
 * - BASIC → PRO: "Get matched 2x faster", "Better jobs", "Save time"
 * - PRO → PREMIUM: "Earn 32% more", "Less stress", "Private assistant"
 * 
 * Rules:
 * - BASIC user with 5+ orders → Suggest PRO
 * - BASIC user with 3+ declined jobs → Suggest PRO
 * - PRO user with 10+ orders → Suggest PREMIUM
 * - PRO user spending >2h/day → Suggest PREMIUM
 */
@Injectable()
export class UpsellService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private commissionService: CommissionService,
  ) {}

  /**
   * Get personalized upgrade recommendation for user.
   */
  async getRecommendation(userId: string): Promise<{
    shouldShow: boolean;
    tier: SubscriptionTier;
    message: string;
    benefit: string;
    estimatedSavings: number;
    confidence: 'high' | 'medium' | 'low';
  } | null> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId },
    });

    const tier = subscription?.tier || SubscriptionTier.BASIC;

    // Already on highest tier
    if (tier === SubscriptionTier.PREMIUM) {
      return null;
    }

    // Get user activity
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['providerProfile'],
    });

    if (!user) {
      return null;
    }

    const orders = await this.orderRepo.find({
      where: { providerId: userId },
      order: { createdAt: 'DESC' },
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
    const totalEarnings = user.providerProfile?.totalEarnings || 0;
    const rating = user.providerProfile?.rating || 0;

    // BASIC → PRO recommendations
    if (tier === SubscriptionTier.BASIC) {
      return this.recommendProTier(totalOrders, cancelledOrders, rating, totalEarnings);
    }

    // PRO → PREMIUM recommendations
    if (tier === SubscriptionTier.PRO) {
      return this.recommendPremiumTier(totalOrders, totalEarnings, user);
    }

    return null;
  }

  /**
   * Recommend PRO tier for BASIC users.
   */
  private async recommendProTier(
    totalOrders: number,
    cancelledOrders: number,
    rating: number,
    totalEarnings: number,
  ): Promise<{
    shouldShow: boolean;
    tier: SubscriptionTier;
    message: string;
    benefit: string;
    estimatedSavings: number;
    confidence: 'high' | 'medium' | 'low';
  }> {
    // Rule 1: Many orders (active user)
    if (totalOrders >= 5) {
      return {
        shouldShow: true,
        tier: SubscriptionTier.PRO,
        message: 'You're doing great! Upgrade to PRO for better matches',
        benefit: 'Get matched 2x faster with our smart matching algorithm',
        estimatedSavings: Math.round(totalEarnings * 0.06), // ~6% commission savings
        confidence: 'high',
      };
    }

    // Rule 2: Many declined jobs (poor matching)
    if (cancelledOrders >= 3) {
      return {
        shouldShow: true,
        tier: SubscriptionTier.PRO,
        message: 'Get better job matches with PRO',
        benefit: 'Smart matching finds jobs that fit your schedule and skills',
        estimatedSavings: 0,
        confidence: 'high',
      };
    }

    // Rule 3: High rating (quality provider)
    if (rating >= 4.5 && totalOrders >= 3) {
      return {
        shouldShow: true,
        tier: SubscriptionTier.PRO,
        message: 'Top-rated providers use PRO',
        benefit: 'Auto-pricing and priority support save you time',
        estimatedSavings: Math.round(totalEarnings * 0.06),
        confidence: 'medium',
      };
    }

    return {
      shouldShow: false,
      tier: SubscriptionTier.PRO,
      message: '',
      benefit: '',
      estimatedSavings: 0,
      confidence: 'low',
    };
  }

  /**
   * Recommend PREMIUM tier for PRO users.
   */
  private async recommendPremiumTier(
    totalOrders: number,
    totalEarnings: number,
    user: User,
  ): Promise<{
    shouldShow: boolean;
    tier: SubscriptionTier;
    message: string;
    benefit: string;
    estimatedSavings: number;
    confidence: 'high' | 'medium' | 'low';
  }> {
    // Rule 1: Power user (many orders)
    if (totalOrders >= 10) {
      const monthlySavings = Math.round((totalEarnings / totalOrders) * 10 * 0.05); // ~5% commission savings on 10 jobs

      return {
        shouldShow: true,
        tier: SubscriptionTier.PREMIUM,
        message: 'Premium users earn 32% more',
        benefit: 'Private AI assistant plans your day and finds better jobs',
        estimatedSavings: monthlySavings,
        confidence: 'high',
      };
    }

    // Rule 2: High earner
    if (totalEarnings >= 1000) {
      return {
        shouldShow: true,
        tier: SubscriptionTier.PREMIUM,
        message: 'Save time with your Private AI Assistant',
        benefit: 'Automate scheduling, pricing, and customer communication',
        estimatedSavings: Math.round(totalEarnings * 0.05),
        confidence: 'high',
      };
    }

    return {
      shouldShow: false,
      tier: SubscriptionTier.PREMIUM,
      message: '',
      benefit: '',
      estimatedSavings: 0,
      confidence: 'low',
    };
  }

  /**
   * Get comparison table for pricing page.
   */
  getFeatureComparison(): {
    tier: SubscriptionTier;
    price: string;
    commission: string;
    features: string[];
  }[] {
    return [
      {
        tier: SubscriptionTier.BASIC,
        price: 'FREE',
        commission: '12% per job',
        features: [
          'Manual job search',
          'Basic booking',
          'Email support',
          'Payment protection',
        ],
      },
      {
        tier: SubscriptionTier.PRO,
        price: '€19.99/month',
        commission: '6% per job',
        features: [
          'Everything in BASIC',
          'Smart matching (2x faster)',
          'Auto-pricing suggestions',
          'Priority support',
          'Advanced analytics',
        ],
      },
      {
        tier: SubscriptionTier.PREMIUM,
        price: '€59.99/month',
        commission: '1% per job',
        features: [
          'Everything in PRO',
          'Private AI Assistant',
          'Unlimited jobs',
          'Task planning & scheduling',
          'Smart recommendations',
          'API access',
        ],
      },
    ];
  }
}
