import { Injectable, Logger } from '@nestjs/common';
import { IntentDetectionService } from './intent-detection.service';
import { ContextMemoryService } from './context-memory.service';
import { DecisionEngineService } from './decision-engine.service';
import { ResponseTemplateService } from './response-template.service';

/**
 * ChatEngineService
 * 
 * Main orchestrator for AI chat engine.
 * 
 * 5-Layer Architecture:
 * 1. User Input
 * 2. Intent Detection (keyword-based)
 * 3. Context Memory (Redis + PostgreSQL)
 * 4. Decision Engine (business logic)
 * 5. Response Generator (templates)
 * 
 * This is your "AI" - Fast, predictable, trust-building, helpful, low-cost, explainable.
 * 
 * Philosophy:
 * "AI is about 'what to do next', not 'what to say beautifully'"
 */
@Injectable()
export class ChatEngineService {
  private readonly logger = new Logger(ChatEngineService.name);

  constructor(
    private intentDetection: IntentDetectionService,
    private contextMemory: ContextMemoryService,
    private decisionEngine: DecisionEngineService,
    private responseTemplate: ResponseTemplateService,
  ) {}

  /**
   * Main entry point: Process user message and generate response.
   */
  async processMessage(
    userId: string,
    message: string,
  ): Promise<{
    response: string;
    intent: string;
    confidence: number;
    buttons?: Array<{ label: string; action: string; value?: any }>;
    shouldEscalate?: boolean;
    metadata?: Record<string, any>;
  }> {
    this.logger.log(`Processing message from user ${userId}: "${message}"`);

    // Step 1: Get context
    const { session, user, summary } = await this.contextMemory.getFullContext(userId);

    // Step 2: Detect intent
    const { intent, confidence, alternativeIntents } = await this.intentDetection.detect(
      message,
      session.context,
    );

    // Step 3: Store message in history
    await this.contextMemory.addMessage(userId, 'user', message, intent, confidence);

    // Step 4: Make decisions
    const shouldEscalate = this.decisionEngine.shouldEscalateToHuman(
      intent,
      confidence,
      session.context,
    );

    if (shouldEscalate.escalate) {
      const escalationResponse = this.responseTemplate.generate(
        'complaint',
        'escalate',
        {
          orderId: session.context?.pendingOrderId,
          ticketId: `TKT-${Date.now()}`,
        },
      );

      await this.contextMemory.addMessage(userId, 'bot', escalationResponse);

      return {
        response: escalationResponse,
        intent,
        confidence,
        shouldEscalate: true,
        metadata: {
          escalationReason: shouldEscalate.reason,
          priority: shouldEscalate.priority,
        },
      };
    }

    // Step 5: Generate response based on intent
    const result = await this.handleIntent(userId, intent, message, session.context, user);

    // Step 6: Store bot response in history
    await this.contextMemory.addMessage(userId, 'bot', result.response);

    return {
      ...result,
      intent,
      confidence,
    };
  }

  /**
   * Handle specific intent and generate appropriate response.
   */
  private async handleIntent(
    userId: string,
    intent: string,
    message: string,
    context: Record<string, any>,
    user: any,
  ): Promise<{
    response: string;
    buttons?: Array<{ label: string; action: string; value?: any }>;
    metadata?: Record<string, any>;
  }> {
    switch (intent) {
      case 'greeting':
        return this.handleGreeting(userId, user);

      case 'book_cleaning':
      case 'book_moving':
      case 'book_recycling':
        return this.handleBooking(userId, intent, context);

      case 'ask_price':
        return this.handlePriceQuestion(intent, context);

      case 'ask_availability':
        return this.handleAvailabilityQuestion(context);

      case 'become_provider':
        return this.handleProviderOnboarding();

      case 'trust_safety':
        return this.handleTrustSafetyQuestion();

      case 'complaint':
        return this.handleComplaint(context);

      case 'payment_issue':
        return this.handlePaymentIssue(context);

      case 'change_booking':
        return this.handleChangeBooking(context);

      case 'thanks':
        return this.handleThanks(context);

      case 'help':
        return this.handleHelp();

      default:
        return this.handleUnknown(message);
    }
  }

  /**
   * Handle: Greeting
   */
  private async handleGreeting(userId: string, user: any): Promise<any> {
    const userName = user.firstName || 'there';
    const isReturning = user.totalOrders > 0;

    const variant = isReturning ? 'returning' : 'default';
    const response = this.responseTemplate.generate('greeting', variant, {
      name: userName,
    });

    return {
      response,
      buttons: [
        { label: '🏠 Book Service', action: 'start_booking' },
        { label: '📋 My Bookings', action: 'view_bookings' },
        { label: '💼 Become Provider', action: 'become_provider' },
      ],
    };
  }

  /**
   * Handle: Booking intents
   */
  private async handleBooking(
    userId: string,
    intent: string,
    context: Record<string, any>,
  ): Promise<any> {
    const serviceMap = {
      book_cleaning: 'cleaning',
      book_moving: 'moving',
      book_recycling: 'recycling',
    };

    const service = serviceMap[intent];

    // Check if user can book
    const canBook = await this.decisionEngine.canBookService(userId, service);

    if (!canBook.allowed) {
      return {
        response: this.responseTemplate.generate('error', 'verification_required'),
        buttons: [
          { label: '🔒 Verify Identity', action: 'start_verification' },
          { label: '❌ Cancel', action: 'cancel' },
        ],
        metadata: {
          requiredAction: canBook.requiredAction,
          reason: canBook.reason,
        },
      };
    }

    // Start booking flow
    await this.contextMemory.setFlow(userId, 'booking', 'select_service');
    await this.contextMemory.updateContext(userId, { lastService: service });

    const response = this.responseTemplate.generate(intent, 'start');

    return {
      response,
      buttons: [
        { label: 'Use My Location', action: 'use_location' },
        { label: 'Enter Address', action: 'enter_address' },
      ],
    };
  }

  /**
   * Handle: Price question
   */
  private handlePriceQuestion(intent: string, context: Record<string, any>): any {
    if (context.lastService === 'cleaning') {
      return {
        response: this.responseTemplate.generate('ask_price', 'cleaning', {
          basePrice: 25,
        }),
        buttons: [
          { label: '📅 Book Now', action: 'start_booking', value: 'cleaning' },
          { label: '📊 See Details', action: 'view_pricing' },
        ],
      };
    }

    return {
      response: this.responseTemplate.generate('ask_price', 'general'),
      buttons: [
        { label: '🏠 Home Cleaning', action: 'view_price', value: 'cleaning' },
        { label: '📦 Moving Help', action: 'view_price', value: 'moving' },
        { label: '♻️ Recycling', action: 'view_price', value: 'recycling' },
      ],
    };
  }

  /**
   * Handle: Availability question
   */
  private handleAvailabilityQuestion(context: Record<string, any>): any {
    const service = context.lastService || 'cleaning';
    const city = context.location?.city || 'your area';

    return {
      response: this.responseTemplate.generate('ask_availability', 'yes', {
        service,
        city,
      }),
      buttons: [
        { label: 'Today', action: 'book_today', value: 'today' },
        { label: 'Tomorrow', action: 'book_tomorrow', value: 'tomorrow' },
        { label: 'Choose Date', action: 'choose_date' },
      ],
    };
  }

  /**
   * Handle: Become provider
   */
  private handleProviderOnboarding(): any {
    return {
      response: this.responseTemplate.generate('become_provider', 'start'),
      buttons: [
        { label: '🏠 Home Cleaning', action: 'provider_signup', value: 'cleaning' },
        { label: '📦 Moving Help', action: 'provider_signup', value: 'moving' },
        { label: '🤝 Both', action: 'provider_signup', value: 'all' },
      ],
    };
  }

  /**
   * Handle: Trust & safety
   */
  private handleTrustSafetyQuestion(): any {
    return {
      response: this.responseTemplate.generate('trust_safety', 'general'),
      buttons: [
        { label: '🔍 Learn More', action: 'view_safety' },
        { label: '📅 Book Service', action: 'start_booking' },
      ],
    };
  }

  /**
   * Handle: Complaint
   */
  private handleComplaint(context: Record<string, any>): any {
    return {
      response: this.responseTemplate.generate('complaint', 'acknowledge', {
        orderId: context.pendingOrderId || 'unknown',
      }),
      buttons: [
        { label: '📞 Call Support', action: 'call_support' },
        { label: '💬 Explain Issue', action: 'explain_issue' },
      ],
    };
  }

  /**
   * Handle: Payment issue
   */
  private handlePaymentIssue(context: Record<string, any>): any {
    return {
      response: this.responseTemplate.generate('payment_issue', 'not_charged'),
      buttons: [
        { label: '💳 View Payments', action: 'view_payments' },
        { label: '📞 Contact Support', action: 'contact_support' },
      ],
    };
  }

  /**
   * Handle: Change booking
   */
  private handleChangeBooking(context: Record<string, any>): any {
    return {
      response: this.responseTemplate.generate('change_booking', 'start', {
        orderId: context.pendingOrderId || 'unknown',
      }),
      buttons: [
        { label: '📅 Change Date/Time', action: 'change_date' },
        { label: '📍 Change Location', action: 'change_location' },
        { label: '❌ Cancel Order', action: 'cancel_order' },
      ],
    };
  }

  /**
   * Handle: Thanks
   */
  private handleThanks(context: Record<string, any>): any {
    return {
      response: this.responseTemplate.generate('thanks', 'default'),
    };
  }

  /**
   * Handle: Help
   */
  private handleHelp(): any {
    return {
      response: this.responseTemplate.generate('help', 'default'),
      buttons: [
        { label: '📅 Book Service', action: 'start_booking' },
        { label: '💰 Pricing', action: 'view_pricing' },
        { label: '📋 My Bookings', action: 'view_bookings' },
      ],
    };
  }

  /**
   * Handle: Unknown intent
   */
  private handleUnknown(message: string): any {
    return {
      response: this.responseTemplate.generate('unknown', 'default'),
      buttons: [
        { label: '📅 Book Service', action: 'start_booking' },
        { label: '💰 Pricing', action: 'view_pricing' },
        { label: '📋 My Bookings', action: 'view_bookings' },
        { label: '❓ Help', action: 'help' },
      ],
    };
  }
}
