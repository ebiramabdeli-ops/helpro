import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { Service } from '../../services/entities/service.entity';
import { VerificationLevel } from '../../../common/enums';

/**
 * DecisionEngineService
 * 
 * Real AI for marketplaces - Business logic decisions.
 * 
 * This is where your business intelligence lives.
 * NO LLM - Pure rule-based decisions.
 * 
 * Example decisions:
 * - Can this user book this service? (verification check)
 * - Is provider available? (schedule check)
 * - Should we escalate to human support? (complexity check)
 * - Is this risky behavior? (fraud detection)
 * - What price should we suggest? (dynamic pricing)
 * 
 * Philosophy:
 * "Your competitive advantage is Trust, Safety, Reliability, Clear decisions"
 */
@Injectable()
export class DecisionEngineService {
  private readonly logger = new Logger(DecisionEngineService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
  ) {}

  /**
   * Decision: Can user book this service?
   */
  async canBookService(
    userId: string,
    serviceSlug: string,
  ): Promise<{
    allowed: boolean;
    reason?: string;
    requiredAction?: string;
  }> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['customerProfile', 'subscription'],
    });

    const service = await this.serviceRepo.findOne({
      where: { slug: serviceSlug, isActive: true },
    });

    if (!service) {
      return {
        allowed: false,
        reason: 'Service not available',
      };
    }

    // Check user verification level
    const userLevel = this.getUserVerificationLevel(user);
    const requiredLevel = service.minProviderLevel; // Actually for customers too

    if (userLevel < this.levelToNumber(requiredLevel)) {
      return {
        allowed: false,
        reason: `This service requires ${requiredLevel} verification`,
        requiredAction: 'verify_identity',
      };
    }

    // Check subscription tier (if service requires PRO+)
    // Example: Premium services might require PRO subscription
    // (Add logic here if needed)

    // Check if user has open disputes
    const openDisputes = await this.orderRepo.count({
      where: { customerId: userId, status: 'DISPUTED' },
    });

    if (openDisputes > 0) {
      return {
        allowed: false,
        reason: 'Please resolve open disputes before booking',
        requiredAction: 'contact_support',
      };
    }

    return { allowed: true };
  }

  /**
   * Decision: Should escalate to human support?
   */
  shouldEscalateToHuman(
    intent: string,
    confidence: number,
    context?: Record<string, any>,
  ): {
    escalate: boolean;
    reason?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  } {
    // Rule 1: Low confidence intent (user is confused)
    if (confidence < 0.4) {
      return {
        escalate: true,
        reason: 'Low intent confidence - user may need human help',
        priority: 'low',
      };
    }

    // Rule 2: Complaint intent (always escalate)
    if (intent === 'complaint') {
      return {
        escalate: true,
        reason: 'Complaint detected - human support required',
        priority: 'high',
      };
    }

    // Rule 3: Payment issues (escalate for complex cases)
    if (intent === 'payment_issue' && context?.amount > 100) {
      return {
        escalate: true,
        reason: 'High-value payment issue',
        priority: 'high',
      };
    }

    // Rule 4: Repeated unknown intents (user is stuck)
    if (intent === 'unknown' && context?.unknownCount >= 3) {
      return {
        escalate: true,
        reason: 'User stuck after 3 unknown intents',
        priority: 'medium',
      };
    }

    // Rule 5: Trust/safety concerns (always escalate)
    if (intent === 'trust_safety' && context?.concernLevel === 'high') {
      return {
        escalate: true,
        reason: 'Safety concern raised',
        priority: 'urgent',
      };
    }

    return { escalate: false };
  }

  /**
   * Decision: Is this risky behavior?
   */
  async detectRiskyBehavior(userId: string): Promise<{
    isRisky: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    recommendedAction?: string;
  }> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['customerProfile', 'providerProfile'],
    });

    const orders = await this.orderRepo.find({
      where: { customerId: userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const reasons: string[] = [];
    let riskScore = 0;

    // Rule 1: Too many cancellations
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
    if (cancelledOrders > 3) {
      reasons.push(`${cancelledOrders} cancelled orders in recent history`);
      riskScore += 30;
    }

    // Rule 2: Multiple disputes
    const disputes = orders.filter((o) => o.status === 'DISPUTED').length;
    if (disputes > 1) {
      reasons.push(`${disputes} disputed orders`);
      riskScore += 40;
    }

    // Rule 3: Very low rating
    if (user.rating < 2.5 && user.reviewCount > 5) {
      reasons.push(`Low rating: ${user.rating.toFixed(1)}⭐`);
      riskScore += 25;
    }

    // Rule 4: New account with high-value orders
    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    const isNewAccount = accountAge < 7 * 24 * 60 * 60 * 1000; // 7 days

    const highValueOrders = orders.filter((o) => o.totalPrice > 200).length;
    if (isNewAccount && highValueOrders > 2) {
      reasons.push('New account with multiple high-value orders');
      riskScore += 20;
    }

    // Rule 5: No verification but many bookings
    if (!user.identityVerified && orders.length > 5) {
      reasons.push('No identity verification but active user');
      riskScore += 15;
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 25) {
      riskLevel = 'medium';
    }

    // Recommended action
    let recommendedAction: string | undefined;
    if (riskLevel === 'high') {
      recommendedAction = 'Require identity verification before next booking';
    } else if (riskLevel === 'medium') {
      recommendedAction = 'Monitor closely, consider verification reminder';
    }

    return {
      isRisky: riskScore > 0,
      riskLevel,
      reasons,
      recommendedAction,
    };
  }

  /**
   * Decision: Suggest dynamic pricing.
   */
  async suggestPrice(
    serviceSlug: string,
    context: {
      city?: string;
      date?: Date;
      isUrgent?: boolean;
      size?: string; // 'small', 'medium', 'large'
    },
  ): Promise<{
    basePrice: number;
    adjustedPrice: number;
    breakdown: Array<{ factor: string; adjustment: number; reason: string }>;
  }> {
    const service = await this.serviceRepo.findOne({
      where: { slug: serviceSlug },
    });

    const basePrice = service?.basePrice || 50;
    const breakdown: Array<{ factor: string; adjustment: number; reason: string }> = [];

    let adjustedPrice = basePrice;

    // Factor 1: Urgency (same-day booking)
    if (context.isUrgent) {
      const urgencyFee = basePrice * 0.2; // +20%
      adjustedPrice += urgencyFee;
      breakdown.push({
        factor: 'urgency',
        adjustment: urgencyFee,
        reason: 'Same-day booking',
      });
    }

    // Factor 2: Size adjustment
    if (context.size === 'large') {
      const sizeFee = basePrice * 0.3; // +30%
      adjustedPrice += sizeFee;
      breakdown.push({
        factor: 'size',
        adjustment: sizeFee,
        reason: 'Large job requires more time',
      });
    } else if (context.size === 'small') {
      const discount = basePrice * 0.1; // -10%
      adjustedPrice -= discount;
      breakdown.push({
        factor: 'size',
        adjustment: -discount,
        reason: 'Small job discount',
      });
    }

    // Factor 3: Weekend premium
    if (context.date) {
      const dayOfWeek = context.date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const weekendFee = basePrice * 0.15; // +15%
        adjustedPrice += weekendFee;
        breakdown.push({
          factor: 'timing',
          adjustment: weekendFee,
          reason: 'Weekend premium',
        });
      }
    }

    // Round to nearest 5
    adjustedPrice = Math.round(adjustedPrice / 5) * 5;

    return {
      basePrice,
      adjustedPrice,
      breakdown,
    };
  }

  /**
   * Helper: Get user verification level as number.
   */
  private getUserVerificationLevel(user: User): number {
    if (user.backgroundCheckPassed) return 3; // L3
    if (user.identityVerified) return 2; // L2
    if (user.emailVerified) return 1; // L1
    return 0; // L0
  }

  /**
   * Helper: Convert verification level string to number.
   */
  private levelToNumber(level: string): number {
    const map = { L0: 0, L1: 1, L2: 2, L3: 3 };
    return map[level] || 0;
  }
}
