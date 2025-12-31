import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../../users/entities/user.entity';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionTier, SubscriptionStatus } from '../../../common/enums';

/**
 * TrialService
 * 
 * Manages 3-day free trial for new users.
 * 
 * Flow:
 * 1. User registers → Trial starts (all features unlocked)
 * 2. Trial lasts 3 days
 * 3. After 3 days:
 *    - If user chose paid plan → Activate subscription
 *    - If no plan chosen → Auto-downgrade to BASIC
 * 
 * Cron job runs daily at midnight to expire trials.
 */
@Injectable()
export class TrialService {
  private readonly logger = new Logger(TrialService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Start 3-day trial for new user.
   */
  async startTrial(userId: string): Promise<Subscription> {
    const now = new Date();
    const trialEnds = new Date(now);
    trialEnds.setDate(trialEnds.getDate() + 3); // 3 days from now

    const subscription = this.subscriptionRepo.create({
      userId,
      tier: SubscriptionTier.PRO, // Trial = PRO features (smart matching)
      status: SubscriptionStatus.TRIAL,
      trialStartedAt: now,
      trialEndsAt: trialEnds,
      autoRenew: false, // No auto-renew until user chooses plan
      monthlyPrice: 0, // Free during trial
    });

    await this.subscriptionRepo.save(subscription);

    this.logger.log(`Trial started for user ${userId}, expires at ${trialEnds}`);

    return subscription;
  }

  /**
   * Check if trial has expired.
   */
  async checkTrialExpired(subscriptionId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.TRIAL) {
      return false;
    }

    return new Date() >= subscription.trialEndsAt;
  }

  /**
   * Handle trial expiration.
   * - If user chose paid plan → Activate subscription
   * - If no plan chosen → Downgrade to BASIC
   */
  async handleTrialExpiration(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: ['user'],
    });

    if (!subscription) {
      return;
    }

    // Check if user has Stripe subscription (paid plan chosen)
    if (subscription.stripeSubscriptionId) {
      // User chose paid plan → Activate
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = new Date();
      subscription.currentPeriodEnd.setMonth(subscription.currentPeriodEnd.getMonth() + 1);

      await this.subscriptionRepo.save(subscription);

      this.logger.log(`Trial expired for user ${subscription.userId}, activated ${subscription.tier} plan`);

      // TODO: Send email "Welcome to [TIER] plan!"
    } else {
      // User didn't choose paid plan → Downgrade to BASIC
      subscription.status = SubscriptionStatus.EXPIRED;
      subscription.tier = SubscriptionTier.BASIC;

      await this.subscriptionRepo.save(subscription);

      this.logger.log(`Trial expired for user ${subscription.userId}, downgraded to BASIC`);

      // TODO: Send email "Your trial has ended. Upgrade to unlock features!"
    }
  }

  /**
   * Cron job: Expire trials daily at midnight.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireTrials(): Promise<void> {
    this.logger.log('Running trial expiration job...');

    const now = new Date();

    // Find all expired trials
    const expiredTrials = await this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.TRIAL,
        trialEndsAt: LessThanOrEqual(now),
      },
    });

    this.logger.log(`Found ${expiredTrials.length} expired trials`);

    for (const subscription of expiredTrials) {
      try {
        await this.handleTrialExpiration(subscription.id);
      } catch (error) {
        this.logger.error(`Failed to expire trial ${subscription.id}:`, error);
      }
    }

    this.logger.log('Trial expiration job complete');
  }

  /**
   * Get days remaining in trial.
   */
  async getDaysRemaining(userId: string): Promise<number | null> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.TRIAL },
    });

    if (!subscription) {
      return null;
    }

    const now = new Date();
    const diff = subscription.trialEndsAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return Math.max(0, daysRemaining);
  }

  /**
   * Upgrade from trial to paid plan.
   */
  async upgradeFromTrial(
    userId: string,
    tier: SubscriptionTier,
    stripeSubscriptionId: string,
    monthlyPrice: number,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.TRIAL },
    });

    if (!subscription) {
      throw new Error('No active trial found');
    }

    // Update subscription
    subscription.tier = tier;
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.stripeSubscriptionId = stripeSubscriptionId;
    subscription.monthlyPrice = monthlyPrice;
    subscription.autoRenew = true;
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date();
    subscription.currentPeriodEnd.setMonth(subscription.currentPeriodEnd.getMonth() + 1);

    await this.subscriptionRepo.save(subscription);

    this.logger.log(`User ${userId} upgraded from trial to ${tier}`);

    return subscription;
  }
}
