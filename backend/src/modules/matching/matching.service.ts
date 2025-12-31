import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getDistance } from 'geolib';
import * as _ from 'lodash';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { UserRole, TaskStatus } from '../../common/enums';
import { AIConfigService } from '../../config/ai-config.service';

export interface MatchScore {
  userId: string;
  user: User;
  totalScore: number;
  breakdown: {
    trustScore: number;
    distanceScore: number;
    availabilityScore: number;
    priceScore: number;
  };
  distance: number;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly aiConfig: AIConfigService,
  ) {}

  /**
   * CORE AI: Match helpers to a task
   * Pure algorithmic, NO ML
   */
  async findBestMatches(taskId: string): Promise<MatchScore[]> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['customer'],
    });

    if (!task) {
      throw new Error('Task not found');
    }

    this.logger.log(`Finding matches for task ${taskId}: ${task.title}`);

    // 1. Find available helpers
    const availableHelpers = await this.findAvailableHelpers(task);
    this.logger.log(`Found ${availableHelpers.length} available helpers`);

    if (availableHelpers.length === 0) {
      return [];
    }

    // 2. Calculate scores for each helper
    const matches = await Promise.all(
      availableHelpers.map((helper) => this.calculateMatchScore(helper, task)),
    );

    // 3. Filter by minimum trust score
    const config = this.aiConfig.getMatchingConfig();
    const qualifiedMatches = matches.filter(
      (m) => m.breakdown.trustScore >= config.minTrustScore,
    );

    // 4. Sort by total score (descending)
    const sortedMatches = _.orderBy(qualifiedMatches, ['totalScore'], ['desc']);

    // 5. Return top N candidates
    return sortedMatches.slice(0, config.topCandidates);
  }

  /**
   * Find helpers who could do this task
   */
  private async findAvailableHelpers(task: Task): Promise<User[]> {
    const config = this.aiConfig.getMatchingConfig();

    // Base query: Active helpers in the region
    const helpersQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', {
        roles: [UserRole.HELPER, UserRole.PRO],
      })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.bannedAt IS NULL');

    // TODO: Add skill matching when skills field is properly indexed
    // if (task.requiredSkills?.length > 0) {
    //   helpersQuery.andWhere('user.skills && :skills', { skills: task.requiredSkills });
    // }

    const helpers = await helpersQuery.getMany();

    // Filter by distance (in-memory for now, optimize with PostGIS later)
    const nearbyHelpers = helpers.filter((helper) => {
      if (!helper.latitude || !helper.longitude) return false;
      
      const distance = this.calculateDistance(
        task.latitude,
        task.longitude,
        helper.latitude,
        helper.longitude,
      );

      return distance <= config.maxDistanceKm;
    });

    return nearbyHelpers;
  }

  /**
   * Calculate match score for a helper-task pair
   */
  private async calculateMatchScore(
    helper: User,
    task: Task,
  ): Promise<MatchScore> {
    const weights = this.aiConfig.getMatchingWeights();

    // 1. Trust Score (0-100)
    const trustScore = helper.trustScore || 0;

    // 2. Distance Score (0-100) - closer is better
    const distance = this.calculateDistance(
      task.latitude,
      task.longitude,
      helper.latitude,
      helper.longitude,
    );
    const distanceScore = this.calculateDistanceScore(distance);

    // 3. Availability Score (0-100)
    const availabilityScore = await this.calculateAvailabilityScore(
      helper,
      task,
    );

    // 4. Price Score (0-100) - helper's rate vs task budget
    const priceScore = this.calculatePriceScore(helper, task);

    // Weighted sum
    const totalScore =
      trustScore * weights.trust +
      distanceScore * weights.distance +
      availabilityScore * weights.availability +
      priceScore * weights.price;

    return {
      userId: helper.id,
      user: helper,
      totalScore: parseFloat(totalScore.toFixed(2)),
      breakdown: {
        trustScore,
        distanceScore,
        availabilityScore,
        priceScore,
      },
      distance: parseFloat(distance.toFixed(2)),
    };
  }

  /**
   * Calculate distance between two points (haversine formula via geolib)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const distanceMeters = getDistance(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 },
    );
    return distanceMeters / 1000; // Convert to km
  }

  /**
   * Distance score: Closer = Higher score
   */
  private calculateDistanceScore(distanceKm: number): number {
    const maxDistance = this.aiConfig.getMatchingConfig().maxDistanceKm;
    
    // Linear decay: 0km = 100, maxDistance = 0
    const score = Math.max(0, 100 * (1 - distanceKm / maxDistance));
    return score;
  }

  /**
   * Availability score: Can they do it at the scheduled time?
   */
  private async calculateAvailabilityScore(
    helper: User,
    task: Task,
  ): Promise<number> {
    // TODO: Check helper.availability JSON field against task.scheduledStart
    // For now, simple heuristic: online = 100, offline = 50
    return helper.isOnline ? 100 : 50;
  }

  /**
   * Price score: Helper's rate vs task budget
   */
  private calculatePriceScore(helper: User, task: Task): number {
    if (!helper.hourlyRate || !task.budgetAmount) return 50; // Neutral

    // Calculate expected cost (simple: hourly rate * estimated hours)
    const estimatedHours = (task.estimatedDuration || 60) / 60;
    const helperCost = helper.hourlyRate * estimatedHours;

    // Score: Perfect match = 100, too expensive = 0
    if (helperCost <= task.budgetAmount) {
      // Under budget: prefer closer matches
      return 100 - (task.budgetAmount - helperCost) / task.budgetAmount * 20;
    } else {
      // Over budget: penalty
      return Math.max(0, 100 - ((helperCost - task.budgetAmount) / task.budgetAmount) * 100);
    }
  }

  /**
   * Auto-assign best helper to task
   */
  async autoAssignTask(taskId: string): Promise<Task> {
    const matches = await this.findBestMatches(taskId);

    if (matches.length === 0) {
      throw new Error('No suitable helpers found');
    }

    const bestMatch = matches[0];
    this.logger.log(
      `Auto-assigning task ${taskId} to helper ${bestMatch.userId} (score: ${bestMatch.totalScore})`,
    );

    // Update task
    await this.taskRepository.update(taskId, {
      helperId: bestMatch.userId,
      status: TaskStatus.ASSIGNED,
      matchingAttempts: () => 'matchingAttempts + 1',
    });

    return this.taskRepository.findOne({ where: { id: taskId } });
  }

  /**
   * Batch matching for multiple tasks (optimization opportunity)
   */
  async batchMatch(taskIds: string[]): Promise<Map<string, MatchScore[]>> {
    const results = new Map<string, MatchScore[]>();

    for (const taskId of taskIds) {
      try {
        const matches = await this.findBestMatches(taskId);
        results.set(taskId, matches);
      } catch (error) {
        this.logger.error(`Failed to match task ${taskId}:`, error);
        results.set(taskId, []);
      }
    }

    return results;
  }

  /**
   * Re-match a task (e.g., after cancellation)
   */
  async rematchTask(taskId: string): Promise<MatchScore[]> {
    this.logger.log(`Re-matching task ${taskId}`);

    // Reset matching attempts
    await this.taskRepository.update(taskId, {
      helperId: null,
      status: TaskStatus.MATCHING,
    });

    return this.findBestMatches(taskId);
  }
}
