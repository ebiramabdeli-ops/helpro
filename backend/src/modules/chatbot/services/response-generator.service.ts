import { Injectable } from '@nestjs/common';
import { DecisionResult } from './decision-engine.service';
import * as fs from 'fs';
import * as path from 'path';

export interface ChatbotResponse {
  message: string;
  language: 'en' | 'de' | 'sv' | 'es';
  metadata?: {
    action: string;
    confidence: number;
    nextState: string;
  };
}

@Injectable()
export class ResponseGeneratorService {
  private templates: Record<string, Record<string, string>> = {};

  constructor() {
    this.loadTemplates();
  }

  /**
   * Load response templates from JSON file
   */
  private loadTemplates(): void {
    try {
      const templatesPath = path.join(__dirname, '../../../../config/chatbot-templates.json');
      const data = fs.readFileSync(templatesPath, 'utf-8');
      this.templates = JSON.parse(data);
    } catch (error) {
      console.error('Failed to load chatbot templates:', error);
      // Fallback to basic templates
      this.templates = {
        en: {
          greeting: 'Hello! How can I help you?',
          fallback: 'I did not understand that. Can you rephrase?',
        },
      };
    }
  }

  /**
   * Generate response based on decision
   */
  generateResponse(
    decision: DecisionResult,
    language: 'en' | 'de' | 'sv' | 'es' = 'en',
  ): ChatbotResponse {
    const template = this.getTemplate(decision.responseKey, language);
    const message = this.fillSlots(template, decision.slots || {});

    return {
      message,
      language,
      metadata: {
        action: decision.action,
        confidence: decision.metadata?.confidence || 0,
        nextState: decision.nextState,
      },
    };
  }

  /**
   * Get template for specific response key and language
   */
  private getTemplate(key: string, language: 'en' | 'de' | 'sv' | 'es'): string {
    // Try specific language
    if (this.templates[language]?.[key]) {
      return this.templates[language][key];
    }

    // Fallback to English
    if (this.templates['en']?.[key]) {
      return this.templates['en'][key];
    }

    // Ultimate fallback
    return `Response not available (${key})`;
  }

  /**
   * Fill template slots with actual values
   */
  private fillSlots(template: string, slots: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(slots)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return result;
  }

  /**
   * Generate quick reply buttons (optional)
   */
  generateQuickReplies(responseKey: string, language: 'en' | 'de' | 'sv' | 'es'): string[] {
    const quickReplies: Record<string, Record<string, string[]>> = {
      ask_service: {
        en: ['Cleaning', 'Moving', 'Recycling', 'Repair'],
        de: ['Reinigung', 'Umzug', 'Recycling', 'Reparatur'],
        sv: ['Städning', 'Flytt', 'Återvinning', 'Reparation'],
        es: ['Limpieza', 'Mudanza', 'Reciclaje', 'Reparación'],
      },
      ask_time: {
        en: ['Today', 'Tomorrow', 'This week', 'Next week'],
        de: ['Heute', 'Morgen', 'Diese Woche', 'Nächste Woche'],
        sv: ['Idag', 'Imorgon', 'Denna vecka', 'Nästa vecka'],
        es: ['Hoy', 'Mañana', 'Esta semana', 'Próxima semana'],
      },
      confirm: {
        en: ['Yes, create it', 'No, cancel'],
        de: ['Ja, erstellen', 'Nein, abbrechen'],
        sv: ['Ja, skapa', 'Nej, avbryt'],
        es: ['Sí, crear', 'No, cancelar'],
      },
    };

    return quickReplies[responseKey]?.[language] || [];
  }

  /**
   * Generate contextual help message
   */
  generateHelp(language: 'en' | 'de' | 'sv' | 'es'): string {
    return this.getTemplate('help', language);
  }

  /**
   * Generate error message
   */
  generateError(language: 'en' | 'de' | 'sv' | 'es'): string {
    return this.getTemplate('error', language);
  }
}
