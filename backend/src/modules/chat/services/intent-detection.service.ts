import { Injectable, Logger } from '@nestjs/common';

/**
 * IntentDetectionService
 * 
 * Rule-based intent detection using keyword matching and pattern scoring.
 * NO LLM - Fast, predictable, cheap, explainable.
 * 
 * Philosophy:
 * - Users feel "AI is smart" when it understands intent
 * - Keyword matching is 95% accurate for structured domains
 * - Easy to improve: add keywords, no retraining
 * 
 * Supported Intents:
 * - book_cleaning: User wants to book cleaning service
 * - book_moving: User wants to book moving help
 * - book_recycling: User wants to book recycling
 * - change_booking: Modify existing order
 * - complaint: Report problem with order
 * - ask_price: Question about pricing
 * - ask_availability: Check if service is available
 * - become_provider: Sign up as service provider
 * - trust_safety: Questions about safety/verification
 * - payment_issue: Payment or billing question
 * - greeting: Hello, hi, greetings
 * - thanks: Thank you, appreciate it
 * - help: General help request
 * - unknown: No clear intent detected
 */
@Injectable()
export class IntentDetectionService {
  private readonly logger = new Logger(IntentDetectionService.name);

  /**
   * Intent patterns with keywords and confidence weights.
   * 
   * Structure:
   * - High-confidence keywords: 1.0 weight
   * - Medium-confidence keywords: 0.7 weight
   * - Low-confidence keywords: 0.4 weight
   */
  private readonly INTENT_PATTERNS = {
    // Booking intents
    book_cleaning: {
      keywords: ['clean', 'cleaning', 'home cleaning', 'house cleaning', 'apartment cleaning'],
      phrases: ['need cleaning', 'book clean', 'schedule clean', 'want cleaning'],
      weight: 1.0,
    },
    book_moving: {
      keywords: ['move', 'moving', 'relocate', 'transport', 'carry furniture'],
      phrases: ['need help moving', 'book moving', 'schedule move', 'want to move'],
      weight: 1.0,
    },
    book_recycling: {
      keywords: ['recycle', 'recycling', 'dispose', 'waste', 'trash'],
      phrases: ['need recycling', 'book recycling', 'schedule pickup', 'dispose items'],
      weight: 1.0,
    },

    // Order management
    change_booking: {
      keywords: ['change', 'modify', 'reschedule', 'update', 'edit booking'],
      phrases: ['change my booking', 'reschedule order', 'modify appointment'],
      weight: 1.0,
    },
    cancel_booking: {
      keywords: ['cancel', 'cancellation', 'abort', 'stop order'],
      phrases: ['cancel booking', 'cancel order', 'stop service'],
      weight: 1.0,
    },

    // Support
    complaint: {
      keywords: ['problem', 'issue', 'complain', 'bad', 'terrible', 'disappointed'],
      phrases: ['have a problem', 'not satisfied', 'went wrong', 'unhappy with'],
      weight: 1.0,
    },
    ask_price: {
      keywords: ['price', 'cost', 'how much', 'pricing', 'fee', 'charge'],
      phrases: ['how much does', 'what is the price', 'cost to', 'pricing for'],
      weight: 0.8,
    },
    ask_availability: {
      keywords: ['available', 'availability', 'when can', 'time slot', 'schedule'],
      phrases: ['is it available', 'can i book', 'what times', 'available times'],
      weight: 0.8,
    },

    // Provider onboarding
    become_provider: {
      keywords: ['become provider', 'work', 'earn', 'join as helper', 'sign up as pro'],
      phrases: ['want to work', 'become a helper', 'earn money', 'offer services'],
      weight: 1.0,
    },

    // Trust & Safety
    trust_safety: {
      keywords: ['safe', 'safety', 'trust', 'verified', 'background check', 'identity'],
      phrases: ['is it safe', 'can i trust', 'are they verified', 'background check'],
      weight: 0.9,
    },

    // Payment
    payment_issue: {
      keywords: ['payment', 'pay', 'invoice', 'refund', 'charge', 'billing'],
      phrases: ['payment problem', 'didnt pay', 'refund request', 'invoice issue'],
      weight: 1.0,
    },

    // Social
    greeting: {
      keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings'],
      phrases: ['hi there', 'hello there', 'hey there'],
      weight: 0.5,
    },
    thanks: {
      keywords: ['thank', 'thanks', 'appreciate', 'grateful'],
      phrases: ['thank you', 'thanks a lot', 'appreciate it'],
      weight: 0.5,
    },
    help: {
      keywords: ['help', 'assist', 'support', 'info', 'information'],
      phrases: ['need help', 'can you help', 'how does this work', 'what can you do'],
      weight: 0.6,
    },
  };

  /**
   * Detect intent from user message.
   * 
   * Returns top intent with confidence score.
   */
  async detect(message: string, context?: Record<string, any>): Promise<{
    intent: string;
    confidence: number;
    alternativeIntents?: Array<{ intent: string; confidence: number }>;
  }> {
    const normalizedMessage = this.normalizeMessage(message);

    // Score all intents
    const scores = this.scoreIntents(normalizedMessage);

    // Apply context boost (if user is in a flow)
    const boostedScores = this.applyContextBoost(scores, context);

    // Sort by confidence
    const sortedIntents = Object.entries(boostedScores)
      .map(([intent, confidence]) => ({ intent, confidence }))
      .sort((a, b) => b.confidence - a.confidence);

    // Get top intent
    const topIntent = sortedIntents[0];

    // Get alternatives (confidence > 0.3)
    const alternatives = sortedIntents.slice(1, 3).filter((i) => i.confidence > 0.3);

    // Log for improvement
    this.logger.debug(`Intent detected: ${topIntent.intent} (${topIntent.confidence.toFixed(2)})`);

    return {
      intent: topIntent.intent,
      confidence: topIntent.confidence,
      alternativeIntents: alternatives.length > 0 ? alternatives : undefined,
    };
  }

  /**
   * Normalize message for matching.
   */
  private normalizeMessage(message: string): string {
    return message
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9äöüß\s]/gi, ' ')
      .replace(/\s+/g, ' ');
  }

  /**
   * Score all intents against message.
   */
  private scoreIntents(message: string): Record<string, number> {
    const scores: Record<string, number> = {};

    for (const [intent, pattern] of Object.entries(this.INTENT_PATTERNS)) {
      let score = 0;

      // Check keywords
      for (const keyword of pattern.keywords) {
        if (message.includes(keyword.toLowerCase())) {
          score += 0.5 * pattern.weight;
        }
      }

      // Check phrases (higher weight)
      for (const phrase of pattern.phrases) {
        if (message.includes(phrase.toLowerCase())) {
          score += 1.0 * pattern.weight;
        }
      }

      scores[intent] = Math.min(score, 1.0); // Cap at 1.0
    }

    // If no clear intent, mark as unknown
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore < 0.3) {
      scores['unknown'] = 0.9;
    }

    return scores;
  }

  /**
   * Apply context boost to scores.
   * 
   * Example: If user is in "booking" flow, boost booking-related intents.
   */
  private applyContextBoost(
    scores: Record<string, number>,
    context?: Record<string, any>,
  ): Record<string, number> {
    if (!context) {
      return scores;
    }

    const boosted = { ...scores };

    // Boost intents related to current flow
    if (context.currentFlow === 'booking') {
      if (boosted['book_cleaning']) boosted['book_cleaning'] *= 1.2;
      if (boosted['book_moving']) boosted['book_moving'] *= 1.2;
      if (boosted['book_recycling']) boosted['book_recycling'] *= 1.2;
      if (boosted['ask_price']) boosted['ask_price'] *= 1.3;
      if (boosted['ask_availability']) boosted['ask_availability'] *= 1.3;
    }

    if (context.currentFlow === 'support') {
      if (boosted['complaint']) boosted['complaint'] *= 1.3;
      if (boosted['change_booking']) boosted['change_booking'] *= 1.2;
      if (boosted['payment_issue']) boosted['payment_issue'] *= 1.2;
    }

    // Cap at 1.0
    for (const key of Object.keys(boosted)) {
      boosted[key] = Math.min(boosted[key], 1.0);
    }

    return boosted;
  }

  /**
   * Add new keywords to an intent (for continuous improvement).
   */
  addKeywords(intent: string, keywords: string[]): void {
    if (this.INTENT_PATTERNS[intent]) {
      this.INTENT_PATTERNS[intent].keywords.push(...keywords);
      this.logger.log(`Added ${keywords.length} keywords to intent: ${intent}`);
    }
  }

  /**
   * Get all supported intents.
   */
  getSupportedIntents(): string[] {
    return Object.keys(this.INTENT_PATTERNS);
  }
}
