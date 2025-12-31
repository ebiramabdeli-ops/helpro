import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { User } from '../../users/entities/user.entity';

/**
 * ContextMemoryService
 * 
 * Makes chat feel intelligent by remembering user context.
 * 
 * What we remember:
 * - User role (customer / provider)
 * - Last service used
 * - Location (city, postal code)
 * - Language preference
 * - Current flow (booking, payment, support)
 * - Open issues
 * - Conversation history (last 10 messages)
 * 
 * Storage:
 * - Active sessions: Redis (fast, future)
 * - Historical data: PostgreSQL (this implementation)
 * 
 * Philosophy:
 * "Users feel AI is smart when it remembers"
 */
@Injectable()
export class ContextMemoryService {
  private readonly logger = new Logger(ContextMemoryService.name);

  constructor(
    @InjectRepository(ChatSession)
    private sessionRepo: Repository<ChatSession>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Get or create chat session for user.
   */
  async getSession(userId: string): Promise<ChatSession> {
    // Try to find active session
    let session = await this.sessionRepo.findOne({
      where: { userId, isActive: true },
      relations: ['user'],
    });

    if (!session) {
      // Create new session
      const user = await this.userRepo.findOne({ where: { id: userId } });

      session = this.sessionRepo.create({
        userId,
        user,
        isActive: true,
        context: {},
        history: [],
        lastActivityAt: new Date(),
      });

      await this.sessionRepo.save(session);
      this.logger.log(`Created new chat session for user ${userId}`);
    }

    return session;
  }

  /**
   * Update session context.
   */
  async updateContext(
    userId: string,
    updates: Partial<ChatSession['context']>,
  ): Promise<void> {
    const session = await this.getSession(userId);

    session.context = {
      ...session.context,
      ...updates,
    };

    session.lastActivityAt = new Date();

    await this.sessionRepo.save(session);
  }

  /**
   * Set current flow (e.g., 'booking', 'payment', 'support').
   */
  async setFlow(userId: string, flow: string, step?: string): Promise<void> {
    const session = await this.getSession(userId);

    session.currentFlow = flow;
    session.currentStep = step || null;
    session.lastActivityAt = new Date();

    await this.sessionRepo.save(session);

    this.logger.debug(`User ${userId} entered flow: ${flow}${step ? ` (step: ${step})` : ''}`);
  }

  /**
   * Add message to conversation history.
   */
  async addMessage(
    userId: string,
    sender: 'user' | 'bot',
    message: string,
    intent?: string,
    confidence?: number,
  ): Promise<void> {
    const session = await this.getSession(userId);

    // Add to history (keep last 10 messages)
    session.history = [
      ...session.history.slice(-9), // Keep last 9
      {
        timestamp: new Date().toISOString(),
        sender,
        message,
        intent,
        confidence,
      },
    ];

    session.lastActivityAt = new Date();

    await this.sessionRepo.save(session);
  }

  /**
   * Get conversation history.
   */
  async getHistory(userId: string): Promise<ChatSession['history']> {
    const session = await this.getSession(userId);
    return session.history || [];
  }

  /**
   * Clear session (end conversation).
   */
  async clearSession(userId: string): Promise<void> {
    const session = await this.sessionRepo.findOne({
      where: { userId, isActive: true },
    });

    if (session) {
      session.isActive = false;
      await this.sessionRepo.save(session);
      this.logger.log(`Cleared chat session for user ${userId}`);
    }
  }

  /**
   * Get full context for decision engine.
   */
  async getFullContext(userId: string): Promise<{
    session: ChatSession;
    user: User;
    summary: {
      hasActiveFlow: boolean;
      currentFlow?: string;
      currentStep?: string;
      lastService?: string;
      location?: { city?: string; postalCode?: string };
      recentMessages: number;
    };
  }> {
    const session = await this.getSession(userId);
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['customerProfile', 'providerProfile', 'subscription'],
    });

    return {
      session,
      user,
      summary: {
        hasActiveFlow: !!session.currentFlow,
        currentFlow: session.currentFlow,
        currentStep: session.currentStep,
        lastService: session.context?.lastService,
        location: session.context?.location,
        recentMessages: session.history?.length || 0,
      },
    };
  }

  /**
   * Remember user preference.
   */
  async rememberPreference(
    userId: string,
    key: string,
    value: any,
  ): Promise<void> {
    const session = await this.getSession(userId);

    if (!session.context.preferences) {
      session.context.preferences = {};
    }

    session.context.preferences[key] = value;

    await this.sessionRepo.save(session);
  }

  /**
   * Get user preference.
   */
  async getPreference(userId: string, key: string): Promise<any> {
    const session = await this.getSession(userId);
    return session.context?.preferences?.[key];
  }
}
