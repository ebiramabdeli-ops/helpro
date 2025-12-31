import { Injectable } from '@nestjs/common';
import {
  DetectedIntent,
  IntentType,
  ServiceType,
  IntentPattern,
  ServicePattern,
} from '../types/intent.types';

@Injectable()
export class IntentDetectionService {
  // Rule-based keyword patterns for intent detection
  private readonly intentPatterns: IntentPattern[] = [
    // REQUEST_SERVICE
    {
      keywords: ['need', 'want', 'looking for', 'require', 'help with', 'brauche', 'möchte', 'suche'],
      intent: IntentType.REQUEST_SERVICE,
      weight: 1.0,
    },
    // ASK_PRICE
    {
      keywords: ['cost', 'price', 'how much', 'kosten', 'preis', 'wie viel'],
      intent: IntentType.ASK_PRICE,
      weight: 1.0,
    },
    // ASK_AVAILABILITY
    {
      keywords: ['available', 'free', 'when', 'verfügbar', 'frei', 'wann'],
      intent: IntentType.ASK_AVAILABILITY,
      weight: 0.8,
    },
    // CANCEL
    {
      keywords: ['cancel', 'abort', 'stop', 'stornieren', 'abbrechen'],
      intent: IntentType.CANCEL_REQUEST,
      weight: 1.0,
    },
    // STATUS
    {
      keywords: ['status', 'progress', 'update', 'stand', 'fortschritt'],
      intent: IntentType.ASK_STATUS,
      weight: 0.9,
    },
    // GREETING
    {
      keywords: ['hello', 'hi', 'hey', 'hallo', 'hej', 'hola'],
      intent: IntentType.GREETING,
      weight: 0.7,
    },
    // HELP
    {
      keywords: ['help', 'how does', 'what can', 'hilfe', 'wie funktioniert'],
      intent: IntentType.HELP,
      weight: 0.8,
    },
  ];

  // Service type detection
  private readonly servicePatterns: ServicePattern[] = [
    { keywords: ['clean', 'cleaning', 'reinig', 'putzen', 'städa'], service: ServiceType.CLEANING },
    { keywords: ['move', 'moving', 'transport', 'umzug', 'flytt'], service: ServiceType.MOVING },
    { keywords: ['recycle', 'trash', 'garbage', 'müll', 'återvinning'], service: ServiceType.RECYCLING },
    { keywords: ['repair', 'fix', 'reparatur', 'reparera'], service: ServiceType.REPAIR },
    { keywords: ['garden', 'lawn', 'garten', 'trädgård'], service: ServiceType.GARDENING },
    { keywords: ['shop', 'grocery', 'einkauf', 'handla'], service: ServiceType.SHOPPING },
    { keywords: ['assemble', 'assembly', 'furniture', 'montage', 'montera'], service: ServiceType.ASSEMBLY },
    { keywords: ['paint', 'painting', 'malen', 'måla'], service: ServiceType.PAINTING },
  ];

  // Time patterns
  private readonly timePatterns = {
    today: ['today', 'heute', 'idag'],
    tomorrow: ['tomorrow', 'morgen', 'imorgon'],
    thisWeek: ['this week', 'diese woche', 'denna vecka'],
    urgent: ['urgent', 'asap', 'now', 'dringend', 'sofort', 'akut'],
  };

  /**
   * Main method: Detect intent from user message
   */
  detectIntent(text: string, language: 'en' | 'de' | 'sv' | 'es' = 'en'): DetectedIntent {
    const normalized = this.normalizeText(text);

    // Detect intent
    const intent = this.matchIntent(normalized);

    // Extract entities
    const entities = {
      service: this.extractService(normalized),
      time: this.extractTime(normalized),
      urgency: this.extractUrgency(normalized),
      location: this.extractLocation(normalized),
    };

    // Calculate confidence
    const confidence = this.calculateConfidence(intent, entities);

    return {
      intent,
      confidence,
      entities,
      rawText: text,
      language,
    };
  }

  /**
   * Normalize text for matching
   */
  private normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }

  /**
   * Match intent using keyword patterns
   */
  private matchIntent(text: string): IntentType {
    let bestMatch = { intent: IntentType.UNKNOWN, score: 0 };

    for (const pattern of this.intentPatterns) {
      const matchCount = pattern.keywords.filter((keyword) => text.includes(keyword)).length;
      const score = matchCount * pattern.weight;

      if (score > bestMatch.score) {
        bestMatch = { intent: pattern.intent, score };
      }
    }

    return bestMatch.intent;
  }

  /**
   * Extract service type
   */
  private extractService(text: string): ServiceType | undefined {
    for (const pattern of this.servicePatterns) {
      if (pattern.keywords.some((keyword) => text.includes(keyword))) {
        return pattern.service;
      }
    }
    return undefined;
  }

  /**
   * Extract time information
   */
  private extractTime(text: string): string | undefined {
    if (this.timePatterns.today.some((t) => text.includes(t))) return 'today';
    if (this.timePatterns.tomorrow.some((t) => text.includes(t))) return 'tomorrow';
    if (this.timePatterns.thisWeek.some((t) => text.includes(t))) return 'this_week';
    return undefined;
  }

  /**
   * Extract urgency level
   */
  private extractUrgency(text: string): 'urgent' | 'normal' | 'flexible' | undefined {
    if (this.timePatterns.urgent.some((t) => text.includes(t))) return 'urgent';
    return undefined;
  }

  /**
   * Extract location (simple pattern matching)
   */
  private extractLocation(text: string): string | undefined {
    // Simple patterns for common location indicators
    const locationPatterns = ['in', 'at', 'near', 'bei', 'in der nähe', 'vid'];
    for (const pattern of locationPatterns) {
      const index = text.indexOf(pattern);
      if (index !== -1) {
        // Extract next few words as potential location
        const afterPattern = text.substring(index + pattern.length).trim();
        const words = afterPattern.split(' ').slice(0, 3);
        return words.join(' ');
      }
    }
    return undefined;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(intent: IntentType, entities: any): number {
    let confidence = 0.5; // Base confidence

    // Intent detected → +30%
    if (intent !== IntentType.UNKNOWN) confidence += 0.3;

    // Service detected → +20%
    if (entities.service) confidence += 0.2;

    // Time detected → +10%
    if (entities.time) confidence += 0.1;

    return Math.min(confidence, 1.0); // Cap at 100%
  }

  /**
   * Detect language (simple heuristic)
   */
  detectLanguage(text: string): 'en' | 'de' | 'sv' | 'es' {
    const normalized = text.toLowerCase();

    // German indicators
    if (/\b(ich|möchte|brauche|wie|können|der|die|das)\b/.test(normalized)) return 'de';

    // Swedish indicators
    if (/\b(jag|kan|behöver|vill|hur|när)\b/.test(normalized)) return 'sv';

    // Spanish indicators
    if (/\b(necesito|quiero|cómo|cuándo|dónde)\b/.test(normalized)) return 'es';

    // Default to English
    return 'en';
  }
}
