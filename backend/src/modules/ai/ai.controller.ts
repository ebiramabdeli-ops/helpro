import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

/**
 * AI Controller
 * Exposes AI capabilities to frontend
 */
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  /**
   * POST /ai/analyze
   * Analyze user text
   */
  @Post('analyze')
  async analyzeText(
    @Body() body: { text: string; language?: string; context?: any },
    @GetUser() user: User,
  ) {
    return this.aiService.analyzeText(
      body.text,
      body.language || user.preferredLanguage || 'en-GB',
      user.id,
      body.context,
    );
  }

  /**
   * POST /ai/decide
   * Make decision
   */
  @Post('decide')
  async makeDecision(
    @Body() body: { intent: string; entities: any; context?: any },
    @GetUser() user: User,
  ) {
    const userData = {
      user_id: user.id,
      trust_score: user.trustScore || 3.0,
      verification_level: user.verificationLevel || 0,
      subscription_tier: user.subscriptionTier || 'BASIC',
    };

    return this.aiService.makeDecision(
      body.intent,
      body.entities,
      userData,
      body.context,
    );
  }

  /**
   * GET /ai/my-score
   * Get user's trust score
   */
  @Get('my-score')
  async getMyScore(@GetUser() user: User) {
    // Gather user data for scoring
    const userData = {
      completed_jobs: 0, // TODO: Query from orders
      verification_level: user.verificationLevel || 0,
      average_review: 0, // TODO: Query from reviews
      complaints: 0, // TODO: Query from complaints
      cancellation_rate: 0, // TODO: Calculate from orders
      months_on_platform: this._calculateMonthsOnPlatform(user.createdAt),
    };

    return this.aiService.calculateScore(user.id, 'trust', userData);
  }

  /**
   * POST /ai/match
   * Find matching helpers (for customers)
   */
  @Post('match')
  async matchHelpers(
    @Body()
    body: {
      service_category: string;
      location: { lat: number; lng: number };
      budget?: number;
      urgency?: string;
      preferences?: any;
    },
    @GetUser() user: User,
  ) {
    // TODO: Query available helpers from database
    const availableHelpers = [];

    return this.aiService.matchHelpers(
      {
        service_category: body.service_category,
        location: body.location,
        budget: body.budget,
        urgency: body.urgency || 'medium',
      },
      availableHelpers,
      body.preferences,
    );
  }

  /**
   * GET /ai/health
   * Check AI service health
   */
  @Get('health')
  async healthCheck() {
    const isHealthy = await this.aiService.healthCheck();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'Python AI Service',
    };
  }

  /**
   * GET /ai/stats (Admin only)
   * Get AI statistics
   */
  @Get('stats')
  // @Roles(UserRole.ADMIN) // TODO: Add admin guard
  async getStats() {
    return this.aiService.getStatistics();
  }

  private _calculateMonthsOnPlatform(createdAt: Date): number {
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  }
}
