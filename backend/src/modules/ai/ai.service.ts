import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

/**
 * AI Service Integration
 * Connects NestJS backend to Python AI microservice
 */
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  /**
   * Analyze user text (NLP + Intent Detection)
   */
  async analyzeText(
    text: string,
    language: string,
    userId?: string,
    context?: Record<string, any>,
  ): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    urgency: string;
    service_category?: string;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/analyze`, {
          text,
          language,
          user_id: userId,
          context,
        }),
      );

      this.logger.log(`Analyzed text: intent=${response.data.intent}, confidence=${response.data.confidence}`);
      return response.data;
    } catch (error) {
      this.logger.error('AI analyze failed', error);
      throw error;
    }
  }

  /**
   * Make decision based on intent
   */
  async makeDecision(
    intent: string,
    entities: Record<string, any>,
    userData: Record<string, any>,
    context?: Record<string, any>,
  ): Promise<{
    action: string;
    suggested_response: string;
    next_steps: string[];
    auto_actions: string[];
    warnings: string[];
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/decide`, {
          intent,
          entities,
          user_data: userData,
          context,
        }),
      );

      this.logger.log(`Decision made: action=${response.data.action}`);
      return response.data;
    } catch (error) {
      this.logger.error('AI decision failed', error);
      throw error;
    }
  }

  /**
   * Calculate score (trust, quality, priority)
   */
  async calculateScore(
    userId: string,
    scoreType: 'trust' | 'quality' | 'priority',
    data: Record<string, any>,
  ): Promise<{
    score: number;
    breakdown: Record<string, number>;
    level: string;
    recommendations: string[];
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/score`, {
          user_id: userId,
          score_type: scoreType,
          data,
        }),
      );

      this.logger.log(`Score calculated: type=${scoreType}, score=${response.data.score}`);
      return response.data;
    } catch (error) {
      this.logger.error('AI score calculation failed', error);
      throw error;
    }
  }

  /**
   * Match helpers to task
   */
  async matchHelpers(
    taskData: Record<string, any>,
    availableHelpers: any[],
    preferences?: Record<string, any>,
  ): Promise<{
    matches: any[];
    algorithm: string;
    execution_time_ms: number;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/match`, {
          task_data: taskData,
          available_helpers: availableHelpers,
          preferences,
        }),
      );

      this.logger.log(`Matched ${response.data.matches.length} helpers in ${response.data.execution_time_ms}ms`);
      return response.data;
    } catch (error) {
      this.logger.error('AI matching failed', error);
      throw error;
    }
  }

  /**
   * Record feedback for learning
   */
  async recordFeedback(
    actionId: string,
    actionType: string,
    outcome: 'accepted' | 'rejected' | 'completed' | 'complained' | 'cancelled',
    data: Record<string, any>,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/feedback`, {
          action_id: actionId,
          action_type: actionType,
          outcome,
          data,
        }),
      );

      this.logger.log(`Feedback recorded: action=${actionId}, outcome=${outcome}`);
    } catch (error) {
      this.logger.error('AI feedback recording failed', error);
      // Don't throw - feedback is non-critical
    }
  }

  /**
   * Get AI statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/stats`),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get AI stats', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/`),
      );

      return response.data.status === 'running';
    } catch (error) {
      this.logger.error('AI service health check failed', error);
      return false;
    }
  }
}
