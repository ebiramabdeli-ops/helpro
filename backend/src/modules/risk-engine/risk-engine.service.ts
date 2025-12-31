import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import * as dayjs from 'dayjs';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskStatus } from '../../common/enums';
import { AIConfigService } from '../../config/ai-config.service';

export interface RiskAssessment {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  recommendations: string[];
}

@Injectable()
export class RiskEngineService {
  private readonly logger = new Logger(RiskEngineService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly aiConfig: AIConfigService,
  ) {}

  /**
   * Assess risk for a task creation
   */
  async assessTaskRisk(
    userId: string,
    taskValue: number,
  ): Promise<RiskAssessment> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    let riskScore = 0;
    const flags: string[] = [];
    const recommendations: string[] = [];
    const thresholds = this.aiConfig.getRiskThresholds();

    // Rule 1: New user with high-value task
    if (user.completedTasks === 0 && taskValue > thresholds.newUserHighValueTask.taskValueLimit) {
      riskScore += thresholds.newUserHighValueTask.riskPoints;
      flags.push('NEW_USER_HIGH_VALUE');
      recommendations.push('Require identity verification before task approval');
    }

    // Rule 2: Recent cancellations
    const recentCancellations = await this.getRecentCancellations(
      userId,
      thresholds.recentCancellations.timeWindowDays,
    );
    if (recentCancellations > thresholds.recentCancellations.maxCancellations) {
      riskScore += thresholds.recentCancellations.riskPoints;
      flags.push('FREQUENT_CANCELLATIONS');
      recommendations.push('Monitor task closely, may cancel again');
    }

    // Rule 3: High dispute ratio
    if (user.completedTasks > 0) {
      const disputeRatio = user.disputeCount / user.completedTasks;
      if (disputeRatio > thresholds.disputeRatio.maxRatio) {
        riskScore += thresholds.disputeRatio.riskPoints;
        flags.push('HIGH_DISPUTE_RATIO');
        recommendations.push('Manual review required before task approval');
      }
    }

    // Rule 4: Low trust score
    if (user.trustScore < 30) {
      riskScore += 15;
      flags.push('LOW_TRUST_SCORE');
      recommendations.push('Require additional verification');
    }

    // Rule 5: Banned before (check bannedAt history)
    // TODO: Add banHistory field to User entity
    
    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (riskScore >= thresholds.highRiskThreshold) {
      riskLevel = 'HIGH';
    } else if (riskScore >= thresholds.mediumRiskThreshold) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    this.logger.log(`Risk assessment for user ${userId}: ${riskLevel} (${riskScore})`);

    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      flags,
      recommendations,
    };
  }

  /**
   * Get recent cancellations count
   */
  private async getRecentCancellations(
    userId: string,
    days: number,
  ): Promise<number> {
    const since = dayjs().subtract(days, 'days').toDate();

    const count = await this.taskRepository.count({
      where: {
        customerId: userId,
        status: TaskStatus.CANCELLED,
        createdAt: MoreThanOrEqual(since),
      },
    });

    return count;
  }

  /**
   * Fraud detection: Suspicious patterns
   */
  async detectFraud(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // Pattern 1: Multiple accounts (same IP, device)
    // TODO: Implement device fingerprinting

    // Pattern 2: Too many tasks in short time
    const last24hTasks = await this.taskRepository.count({
      where: {
        customerId: userId,
        createdAt: MoreThanOrEqual(dayjs().subtract(24, 'hours').toDate()),
      },
    });

    if (last24hTasks > 10) {
      this.logger.warn(`Potential fraud: User ${userId} created ${last24hTasks} tasks in 24h`);
      return true;
    }

    // Pattern 3: Immediate cancellation pattern
    const tasks = await this.taskRepository.find({
      where: { customerId: userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const immediateCancels = tasks.filter((t) => {
      if (t.status !== TaskStatus.CANCELLED) return false;
      const duration = dayjs(t.updatedAt).diff(t.createdAt, 'minutes');
      return duration < 5;
    });

    if (immediateCancels.length >= 3) {
      this.logger.warn(`Potential fraud: User ${userId} has ${immediateCancels.length} immediate cancellations`);
      return true;
    }

    return false;
  }

  /**
   * Should this transaction require manual review?
   */
  async requiresManualReview(userId: string, taskValue: number): Promise<boolean> {
    const assessment = await this.assessTaskRisk(userId, taskValue);
    return assessment.riskLevel === 'HIGH';
  }
}
