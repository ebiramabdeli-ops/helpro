import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { AIConfigService } from '../../config/ai-config.service';

export interface PriceBreakdown {
  basePrice: number;
  distanceFee: number;
  timeFee: number;
  difficultyMultiplier: number;
  subtotal: number;
  platformFee: number;
  total: number;
}

export interface PricingInput {
  basePrice: number;
  distanceKm: number;
  durationHours: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  isUrgent?: boolean;
  country?: string;
}

@Injectable()
export class PricingService {
  constructor(private readonly aiConfig: AIConfigService) {}

  /**
   * Calculate fair price for a task
   * Formula-based, NO ML
   */
  calculatePrice(input: PricingInput): PriceBreakdown {
    const rules = this.aiConfig.getPricingRules();

    // Use Decimal.js for precise money calculations
    let basePrice = new Decimal(input.basePrice);

    // 1. Distance fee
    let distanceFee = new Decimal(0);
    if (rules.distanceFee.enabled) {
      distanceFee = new Decimal(input.distanceKm).times(rules.distanceFee.perKm);
      distanceFee = Decimal.min(distanceFee, rules.distanceFee.maxFee);
    }

    // 2. Time fee
    let timeFee = new Decimal(0);
    if (rules.timeFee.enabled) {
      timeFee = new Decimal(input.durationHours).times(rules.timeFee.perHour);
      if (input.isUrgent) {
        timeFee = timeFee.times(rules.timeFee.urgentMultiplier);
      }
    }

    // 3. Difficulty multiplier
    const difficultyMultiplier = rules.difficultyMultipliers[input.difficulty] || 1.0;
    
    // Calculate subtotal
    const subtotal = basePrice
      .plus(distanceFee)
      .plus(timeFee)
      .times(difficultyMultiplier);

    // 4. Platform fee (percentage)
    const platformFee = subtotal.times(rules.baseFeePercentage / 100);

    // 5. Total
    const total = subtotal.plus(platformFee);

    // Check minimum wage (if country specified)
    if (input.country) {
      const minWage = rules.minimumWages[input.country];
      if (minWage) {
        const minTotal = new Decimal(input.durationHours).times(minWage);
        if (total.lessThan(minTotal)) {
          // Adjust to meet minimum wage
          return this.adjustToMinimumWage(input, minTotal.toNumber());
        }
      }
    }

    return {
      basePrice: basePrice.toNumber(),
      distanceFee: distanceFee.toNumber(),
      timeFee: timeFee.toNumber(),
      difficultyMultiplier,
      subtotal: subtotal.toNumber(),
      platformFee: platformFee.toNumber(),
      total: total.toNumber(),
    };
  }

  /**
   * Adjust price to meet minimum wage requirements
   */
  private adjustToMinimumWage(
    input: PricingInput,
    minTotal: number,
  ): PriceBreakdown {
    const rules = this.aiConfig.getPricingRules();
    
    // Back-calculate: Remove platform fee first
    const minSubtotal = minTotal / (1 + rules.baseFeePercentage / 100);
    const platformFee = minTotal - minSubtotal;

    return {
      basePrice: input.basePrice,
      distanceFee: 0,
      timeFee: 0,
      difficultyMultiplier: 1.0,
      subtotal: minSubtotal,
      platformFee,
      total: minTotal,
    };
  }

  /**
   * Estimate helper's earnings (after platform fee)
   */
  calculateHelperEarnings(totalPrice: number): number {
    const rules = this.aiConfig.getPricingRules();
    const helperShare = 100 - rules.baseFeePercentage;
    return new Decimal(totalPrice).times(helperShare / 100).toNumber();
  }

  /**
   * Suggest price range for a task
   */
  suggestPriceRange(input: Omit<PricingInput, 'basePrice'>): {
    min: number;
    max: number;
    recommended: number;
  } {
    // Calculate for different difficulty levels
    const easy = this.calculatePrice({ ...input, basePrice: 100, difficulty: 'easy' });
    const medium = this.calculatePrice({ ...input, basePrice: 150, difficulty: 'medium' });
    const hard = this.calculatePrice({ ...input, basePrice: 200, difficulty: 'hard' });

    return {
      min: easy.total,
      max: hard.total,
      recommended: medium.total,
    };
  }

  /**
   * Validate if a price is fair
   */
  isFairPrice(input: PricingInput): { isFair: boolean; reason?: string } {
    const calculated = this.calculatePrice(input);
    
    // Price should be within 20% of calculated
    const lowerBound = calculated.total * 0.8;
    const upperBound = calculated.total * 1.2;

    if (input.basePrice < lowerBound) {
      return { isFair: false, reason: 'Price too low, below minimum wage standards' };
    }

    if (input.basePrice > upperBound) {
      return { isFair: false, reason: 'Price too high, significantly above market rate' };
    }

    return { isFair: true };
  }
}
