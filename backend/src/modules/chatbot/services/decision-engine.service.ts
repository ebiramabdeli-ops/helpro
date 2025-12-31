import { Injectable } from '@nestjs/common';
import { DetectedIntent, IntentType } from '../types/intent.types';
import { DialogueState } from '../types/dialogue.types';

export interface DecisionResult {
  action: ActionType;
  nextState: DialogueState;
  responseKey: string;
  slots?: Record<string, any>;
  metadata?: {
    shouldAsk: string[];
    confidence: number;
    reasoning: string;
  };
}

export enum ActionType {
  ASK_SERVICE = 'ASK_SERVICE',
  ASK_LOCATION = 'ASK_LOCATION',
  ASK_TIME = 'ASK_TIME',
  ASK_DESCRIPTION = 'ASK_DESCRIPTION',
  CONFIRM_REQUEST = 'CONFIRM_REQUEST',
  CREATE_TASK = 'CREATE_TASK',
  PROVIDE_PRICE_ESTIMATE = 'PROVIDE_PRICE_ESTIMATE',
  PROVIDE_AVAILABILITY = 'PROVIDE_AVAILABILITY',
  PROVIDE_STATUS = 'PROVIDE_STATUS',
  CANCEL_REQUEST = 'CANCEL_REQUEST',
  GREETING = 'GREETING',
  HELP = 'HELP',
  FALLBACK = 'FALLBACK',
}

@Injectable()
export class DecisionEngineService {
  /**
   * Main decision method: Decide what to do next
   */
  decide(
    intent: DetectedIntent,
    currentState: DialogueState,
    known: Record<string, any>,
  ): DecisionResult {
    // Rule 1: Handle greetings
    if (intent.intent === IntentType.GREETING) {
      return this.handleGreeting();
    }

    // Rule 2: Handle help requests
    if (intent.intent === IntentType.HELP) {
      return this.handleHelp();
    }

    // Rule 3: Handle cancellations
    if (intent.intent === IntentType.CANCEL_REQUEST) {
      return this.handleCancellation();
    }

    // Rule 4: Handle price inquiries
    if (intent.intent === IntentType.ASK_PRICE) {
      return this.handlePriceInquiry(known);
    }

    // Rule 5: Handle status inquiries
    if (intent.intent === IntentType.ASK_STATUS) {
      return this.handleStatusInquiry();
    }

    // Rule 6: Handle service requests (main flow)
    if (intent.intent === IntentType.REQUEST_SERVICE) {
      return this.handleServiceRequest(intent, currentState, known);
    }

    // Rule 7: Low confidence → fallback
    if (intent.confidence < 0.5) {
      return this.handleFallback();
    }

    // Default: Continue conversation based on state
    return this.continueConversation(currentState, known);
  }

  /**
   * Handle greeting
   */
  private handleGreeting(): DecisionResult {
    return {
      action: ActionType.GREETING,
      nextState: DialogueState.ASK_SERVICE,
      responseKey: 'greeting',
      metadata: {
        shouldAsk: ['service'],
        confidence: 1.0,
        reasoning: 'User greeted, proceed to service selection',
      },
    };
  }

  /**
   * Handle help request
   */
  private handleHelp(): DecisionResult {
    return {
      action: ActionType.HELP,
      nextState: DialogueState.ASK_SERVICE,
      responseKey: 'help',
      metadata: {
        shouldAsk: [],
        confidence: 1.0,
        reasoning: 'User asked for help',
      },
    };
  }

  /**
   * Handle cancellation
   */
  private handleCancellation(): DecisionResult {
    return {
      action: ActionType.CANCEL_REQUEST,
      nextState: DialogueState.START,
      responseKey: 'cancelled',
      metadata: {
        shouldAsk: [],
        confidence: 1.0,
        reasoning: 'User cancelled request',
      },
    };
  }

  /**
   * Handle price inquiry
   */
  private handlePriceInquiry(known: Record<string, any>): DecisionResult {
    // Need service info to provide price
    if (!known.service) {
      return {
        action: ActionType.ASK_SERVICE,
        nextState: DialogueState.ASK_SERVICE,
        responseKey: 'ask_service_for_price',
        metadata: {
          shouldAsk: ['service'],
          confidence: 0.8,
          reasoning: 'Need service type to calculate price',
        },
      };
    }

    return {
      action: ActionType.PROVIDE_PRICE_ESTIMATE,
      nextState: DialogueState.ASK_LOCATION,
      responseKey: 'price_estimate',
      slots: { service: known.service },
      metadata: {
        shouldAsk: ['location'],
        confidence: 0.9,
        reasoning: 'Provided price estimate, continue to location',
      },
    };
  }

  /**
   * Handle status inquiry
   */
  private handleStatusInquiry(): DecisionResult {
    return {
      action: ActionType.PROVIDE_STATUS,
      nextState: DialogueState.START,
      responseKey: 'status',
      metadata: {
        shouldAsk: [],
        confidence: 0.9,
        reasoning: 'User asked for status',
      },
    };
  }

  /**
   * Handle service request (main conversation flow)
   */
  private handleServiceRequest(
    intent: DetectedIntent,
    currentState: DialogueState,
    known: Record<string, any>,
  ): DecisionResult {
    // Step 1: Service
    if (!known.service && !intent.entities.service) {
      return {
        action: ActionType.ASK_SERVICE,
        nextState: DialogueState.ASK_SERVICE,
        responseKey: 'ask_service',
        metadata: {
          shouldAsk: ['service'],
          confidence: intent.confidence,
          reasoning: 'Missing service type',
        },
      };
    }

    // Step 2: Location
    if (!known.location && !intent.entities.location) {
      return {
        action: ActionType.ASK_LOCATION,
        nextState: DialogueState.ASK_LOCATION,
        responseKey: 'ask_location',
        slots: { service: known.service || intent.entities.service },
        metadata: {
          shouldAsk: ['location'],
          confidence: intent.confidence,
          reasoning: 'Service known, need location',
        },
      };
    }

    // Step 3: Time
    if (!known.time && !intent.entities.time) {
      return {
        action: ActionType.ASK_TIME,
        nextState: DialogueState.ASK_TIME,
        responseKey: 'ask_time',
        metadata: {
          shouldAsk: ['time'],
          confidence: intent.confidence,
          reasoning: 'Service and location known, need time',
        },
      };
    }

    // Step 4: Description
    if (!known.description) {
      return {
        action: ActionType.ASK_DESCRIPTION,
        nextState: DialogueState.ASK_DESCRIPTION,
        responseKey: 'ask_description',
        metadata: {
          shouldAsk: ['description'],
          confidence: intent.confidence,
          reasoning: 'Basic info collected, need details',
        },
      };
    }

    // Step 5: Confirm
    return {
      action: ActionType.CONFIRM_REQUEST,
      nextState: DialogueState.CONFIRM,
      responseKey: 'confirm',
      slots: {
        service: known.service || intent.entities.service,
        location: known.location || intent.entities.location,
        time: known.time || intent.entities.time,
        description: known.description,
      },
      metadata: {
        shouldAsk: [],
        confidence: intent.confidence,
        reasoning: 'All info collected, ready to confirm',
      },
    };
  }

  /**
   * Handle low-confidence fallback
   */
  private handleFallback(): DecisionResult {
    return {
      action: ActionType.FALLBACK,
      nextState: DialogueState.ASK_SERVICE,
      responseKey: 'fallback',
      metadata: {
        shouldAsk: ['service'],
        confidence: 0.3,
        reasoning: 'Low confidence, clarification needed',
      },
    };
  }

  /**
   * Continue conversation based on current state
   */
  private continueConversation(currentState: DialogueState, known: Record<string, any>): DecisionResult {
    switch (currentState) {
      case DialogueState.START:
      case DialogueState.ASK_SERVICE:
        return {
          action: ActionType.ASK_SERVICE,
          nextState: DialogueState.ASK_SERVICE,
          responseKey: 'ask_service',
          metadata: { shouldAsk: ['service'], confidence: 0.7, reasoning: 'Continue to service' },
        };

      case DialogueState.ASK_LOCATION:
        return {
          action: ActionType.ASK_LOCATION,
          nextState: DialogueState.ASK_LOCATION,
          responseKey: 'ask_location',
          metadata: { shouldAsk: ['location'], confidence: 0.7, reasoning: 'Continue to location' },
        };

      case DialogueState.ASK_TIME:
        return {
          action: ActionType.ASK_TIME,
          nextState: DialogueState.ASK_TIME,
          responseKey: 'ask_time',
          metadata: { shouldAsk: ['time'], confidence: 0.7, reasoning: 'Continue to time' },
        };

      case DialogueState.ASK_DESCRIPTION:
        return {
          action: ActionType.ASK_DESCRIPTION,
          nextState: DialogueState.ASK_DESCRIPTION,
          responseKey: 'ask_description',
          metadata: { shouldAsk: ['description'], confidence: 0.7, reasoning: 'Continue to description' },
        };

      default:
        return this.handleFallback();
    }
  }

  /**
   * Priority rules: Determine urgency
   */
  calculatePriority(known: Record<string, any>): 'high' | 'medium' | 'low' {
    if (known.urgency === 'urgent') return 'high';
    if (known.time === 'today') return 'high';
    if (known.time === 'tomorrow') return 'medium';
    return 'low';
  }

  /**
   * Validation: Check if data is complete
   */
  isComplete(known: Record<string, any>): boolean {
    return !!(known.service && known.location && known.time && known.description);
  }
}
