import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { User } from '../../users/entities/user.entity';
import { CustomerProfile } from '../../users/entities/customer-profile.entity';
import { ProviderProfile } from '../../users/entities/provider-profile.entity';
import { VerificationLevel } from '@/common/enums';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CustomerProfile)
    private customerProfileRepository: Repository<CustomerProfile>,
    @InjectRepository(ProviderProfile)
    private providerProfileRepository: Repository<ProviderProfile>,
  ) {}

  /**
   * Create review with trust weight calculation
   */
  async createReview(data: {
    orderId: string;
    reviewerId: string;
    revieweeId: string;
    reviewerRole: 'customer' | 'provider';
    rating: number;
    comment?: string;
    qualityRating?: number;
    communicationRating?: number;
    punctualityRating?: number;
    professionalismRating?: number;
  }): Promise<Review> {
    const reviewer = await this.userRepository.findOne({
      where: { id: data.reviewerId },
    });

    if (!reviewer) {
      throw new Error('Reviewer not found');
    }

    // Calculate trust weight based on verification level
    const trustWeight = this.calculateTrustWeight(reviewer);

    const review = this.reviewRepository.create({
      ...data,
      trustWeight,
      reviewerVerificationLevel: this.getUserVerificationLevel(reviewer),
    });

    await this.reviewRepository.save(review);

    // Update reviewee's rating
    await this.updateUserRating(data.revieweeId, data.reviewerRole === 'customer' ? 'provider' : 'customer');

    return review;
  }

  /**
   * Calculate trust weight based on user verification
   * L3 (background check) reviews count 2x
   * L2 (license verified) count 1.5x
   * L1 (identity verified) count 1.2x
   * L0 (email only) count 1x
   * Unverified count 0.5x
   */
  private calculateTrustWeight(user: User): number {
    if (user.backgroundCheckPassed) {
      return 2.0; // L3
    }

    if (user.identityVerified) {
      // Check if has professional license (L2)
      // This would require checking provider profile
      return 1.5; // Assume L2 for now
    }

    if (user.identityVerified) {
      return 1.2; // L1
    }

    if (user.emailVerified || user.phoneVerified) {
      return 1.0; // L0
    }

    return 0.5; // Unverified (shouldn't happen, but safety)
  }

  /**
   * Get user verification level for display
   */
  private getUserVerificationLevel(user: User): string {
    if (user.backgroundCheckPassed) return VerificationLevel.L3;
    if (user.identityVerified) return VerificationLevel.L1; // Simplified
    if (user.emailVerified || user.phoneVerified) return VerificationLevel.L0;
    return VerificationLevel.L0;
  }

  /**
   * Update user's overall rating (weighted average)
   */
  private async updateUserRating(
    userId: string,
    role: 'customer' | 'provider',
  ): Promise<void> {
    const reviews = await this.reviewRepository.find({
      where: { revieweeId: userId },
    });

    if (reviews.length === 0) return;

    // Calculate weighted average
    let totalWeightedRating = 0;
    let totalWeight = 0;

    for (const review of reviews) {
      totalWeightedRating += review.rating * review.trustWeight;
      totalWeight += review.trustWeight;
    }

    const averageRating = totalWeightedRating / totalWeight;

    // Update user entity
    await this.userRepository.update(userId, {
      rating: averageRating,
      reviewCount: reviews.length,
    });

    // Update profile (customer or provider)
    if (role === 'customer') {
      await this.customerProfileRepository.update(
        { userId },
        {
          rating: averageRating,
          reviewCount: reviews.length,
        },
      );
    } else {
      await this.providerProfileRepository.update(
        { userId },
        {
          rating: averageRating,
          reviewCount: reviews.length,
        },
      );
    }
  }

  /**
   * Detect suspicious review patterns
   * Rule-based abuse detection (NO AI)
   */
  async detectAbusePatterns(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Get all reviews BY this user
    const reviewsByUser = await this.reviewRepository.find({
      where: { reviewerId: userId },
    });

    // Rule 1: Too many 1-star reviews in short time
    const recentReviews = reviewsByUser.filter(
      (r) => r.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );

    const lowRatings = recentReviews.filter((r) => r.rating <= 2);
    if (lowRatings.length > 5) {
      reasons.push('Too many low ratings in 7 days');
    }

    // Rule 2: All reviews are extreme (all 1 or all 5)
    const allExtreme =
      reviewsByUser.every((r) => r.rating === 1 || r.rating === 5);
    if (reviewsByUser.length > 3 && allExtreme) {
      reasons.push('All reviews are extreme ratings');
    }

    // Rule 3: Very short comments repeatedly
    const shortComments = reviewsByUser.filter(
      (r) => r.comment && r.comment.length < 20,
    );
    if (shortComments.length > reviewsByUser.length * 0.8) {
      reasons.push('Most reviews have very short comments');
    }

    // Rule 4: Get reviews OF this user
    const reviewsOfUser = await this.reviewRepository.find({
      where: { revieweeId: userId },
    });

    const complaints = reviewsOfUser.filter((r) => r.rating <= 2);
    if (reviewsOfUser.length > 5 && complaints.length > reviewsOfUser.length * 0.6) {
      reasons.push('More than 60% negative reviews received');
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Calculate trust score (0-100)
   * Based on multiple factors (NO AI)
   */
  async calculateTrustScore(userId: string): Promise<number> {
    let score = 50; // Start at neutral

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) return 0;

    // Verification bonuses
    if (user.emailVerified) score += 5;
    if (user.phoneVerified) score += 5;
    if (user.identityVerified) score += 15;
    if (user.backgroundCheckPassed) score += 25;

    // Rating bonus
    if (user.reviewCount > 0) {
      score += (user.rating / 5) * 20; // Max +20 for 5-star rating
    }

    // Completion rate (for providers)
    if (user.completedTasks > 0) {
      const completionRate = user.completedTasks / (user.completedTasks + user.disputeCount);
      score += completionRate * 15; // Max +15
    }

    // Dispute penalty
    if (user.disputeCount > 0) {
      score -= user.disputeCount * 5; // -5 per dispute
    }

    // Account age bonus (older = more trusted)
    const accountAgeMonths = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000),
    );
    score += Math.min(accountAgeMonths * 0.5, 10); // Max +10

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
