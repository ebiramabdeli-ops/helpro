import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AIConfigService } from '../../config/ai-config.service';

export interface TrustScoreBreakdown {
  total: number;
  identity: number;
  completedJobs: number;
  reviews: number;
  onTime: number;
  disputes: number;
}

@Injectable()
export class TrustEngineService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly aiConfig: AIConfigService,
  ) {}

  /**
   * Calculate Trust Score (0-100)
   * Pure rule-based, no ML
   */
  async calculateTrustScore(userId: string): Promise<TrustScoreBreakdown> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const weights = this.aiConfig.getTrustWeights();

    // 1. Identity Score (0-100)
    const identityScore = this.calculateIdentityScore(user, weights.identity);

    // 2. Completed Jobs Score (0-100)
    const jobsScore = this.calculateJobsScore(user, weights.completedJobs);

    // 3. Reviews Score (0-100)
    const reviewsScore = this.calculateReviewsScore(user, weights.reviews);

    // 4. On-Time Score (0-100)
    const onTimeScore = this.calculateOnTimeScore(user);

    // 5. Disputes Penalty (negative)
    const disputePenalty = this.calculateDisputePenalty(user);

    // Weighted sum
    const totalScore = Math.max(
      0,
      Math.min(
        100,
        identityScore * weights.identity.weight +
          jobsScore * weights.completedJobs.weight +
          reviewsScore * weights.reviews.weight +
          onTimeScore * weights.onTime.weight -
          disputePenalty * weights.disputes.weight,
      ),
    );

    return {
      total: parseFloat(totalScore.toFixed(2)),
      identity: parseFloat(identityScore.toFixed(2)),
      completedJobs: parseFloat(jobsScore.toFixed(2)),
      reviews: parseFloat(reviewsScore.toFixed(2)),
      onTime: parseFloat(onTimeScore.toFixed(2)),
      disputes: parseFloat(disputePenalty.toFixed(2)),
    };
  }

  /**
   * Identity Verification Score
   */
  private calculateIdentityScore(user: User, identityWeights: any): number {
    let score = 0;

    if (user.emailVerified) score += identityWeights.emailVerified;
    if (user.phoneVerified) score += identityWeights.phoneVerified;
    if (user.identityVerified) score += identityWeights.idVerified;
    if (user.backgroundCheckPassed) score += identityWeights.backgroundCheck;

    return score; // Max 100
  }

  /**
   * Completed Jobs Score
   */
  private calculateJobsScore(user: User, jobsWeights: any): number {
    const score = Math.min(
      user.completedTasks * jobsWeights.pointsPerJob,
      jobsWeights.maxPoints,
    );
    return score;
  }

  /**
   * Reviews/Rating Score
   */
  private calculateReviewsScore(user: User, reviewsWeights: any): number {
    if (user.reviewCount === 0) return 0;
    return (user.rating / reviewsWeights.maxRating) * 100;
  }

  /**
   * On-Time Completion Score
   */
  private calculateOnTimeScore(user: User): number {
    if (user.completedTasks === 0) return 50; // Neutral for new users
    
    // Assume onTimeCompletions field exists (add to User entity if missing)
    const onTimeRatio = (user.completedTasks - user.disputeCount) / user.completedTasks;
    return Math.min(onTimeRatio * 100, 100);
  }

  /**
   * Dispute Penalty
   */
  private calculateDisputePenalty(user: User): number {
    if (user.completedTasks === 0) return 0;
    
    const weights = this.aiConfig.getTrustWeights();
    const disputeRatio = user.disputeCount / user.completedTasks;
    return disputeRatio * Math.abs(weights.disputes.penaltyPerDispute);
  }

  /**
   * Update user's stored trust score
   */
  async updateUserTrustScore(userId: string): Promise<number> {
    const breakdown = await this.calculateTrustScore(userId);
    
    await this.userRepository.update(userId, {
      trustScore: breakdown.total,
    });

    return breakdown.total;
  }

  /**
   * Bulk recalculate for all users (admin tool)
   */
  async recalculateAllTrustScores(): Promise<number> {
    const users = await this.userRepository.find();
    let updated = 0;

    for (const user of users) {
      try {
        await this.updateUserTrustScore(user.id);
        updated++;
      } catch (error) {
        console.error(`Failed to update trust score for user ${user.id}:`, error);
      }
    }

    return updated;
  }

  /**
   * Get trust level category
   */
  getTrustLevel(score: number): string {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    if (score >= 20) return 'LOW';
    return 'UNVERIFIED';
  }
}
