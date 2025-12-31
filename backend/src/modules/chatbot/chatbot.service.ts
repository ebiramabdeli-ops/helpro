import { Injectable } from '@nestjs/common';
import { IntentDetectionService } from './services/intent-detection.service';
import { DialogueStateService } from './services/dialogue-state.service';
import { DecisionEngineService } from './services/decision-engine.service';
import { ResponseGeneratorService } from './services/response-generator.service';
import { DetectedIntent, IntentType } from './types/intent.types';
import { DialogueState, DialogueEvent } from './types/dialogue.types';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly intentDetection: IntentDetectionService,
    private readonly dialogueState: DialogueStateService,
    private readonly decisionEngine: DecisionEngineService,
    private readonly responseGenerator: ResponseGeneratorService,
  ) {}

  /**
   * Main orchestration: Process user message through all layers
   */
  async processMessage(
    message: string,
    userId: string,
    sessionId?: string,
    language: 'en' | 'de' | 'sv' | 'es' = 'en',
  ): Promise<any> {
    // Step 1: Get or create session
    if (!sessionId) {
      sessionId = this.dialogueState.startSession(userId);
    }

    // Step 2: Detect intent from message (NLP Layer)
    const detectedLanguage = this.intentDetection.detectLanguage(message);
    const intent = this.intentDetection.detectIntent(message, detectedLanguage);

    // Step 3: Get current conversation context
    const currentState = this.dialogueState.getState(sessionId);
    const context = this.dialogueState.getContext(sessionId);

    if (!context) {
      throw new Error('Session not found');
    }

    // Step 4: Make decision based on intent + state (Decision Engine)
    const decision = this.decisionEngine.decide(intent, currentState!, context.known);

    // Step 5: Update dialogue state
    this.updateDialogueState(sessionId, intent, decision.nextState);

    // Step 6: Generate response (Response Generator)
    const response = this.responseGenerator.generateResponse(decision, language);

    // Step 7: Get quick replies (optional UI hints)
    const quickReplies = this.responseGenerator.generateQuickReplies(decision.responseKey, language);

    // Step 8: Store in conversation history
    if (context.history) {
      context.history.push({
        userMessage: message,
        botResponse: response.message,
        timestamp: new Date(),
      });
    }

    return {
      message: response.message,
      sessionId,
      language: detectedLanguage,
      metadata: response.metadata,
      quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
    };
  }

  /**
   * Start new conversation
   */
  startConversation(userId: string): { sessionId: string; message: string } {
    const sessionId = this.dialogueState.startSession(userId);

    const greetingResponse = this.responseGenerator.generateResponse(
      {
        action: 'GREETING' as any,
        nextState: DialogueState.ASK_SERVICE,
        responseKey: 'greeting',
      },
      'en',
    );

    return {
      sessionId,
      message: greetingResponse.message,
    };
  }

  /**
   * Get conversation context
   */
  getConversationContext(sessionId: string): any {
    return this.dialogueState.getContext(sessionId);
  }

  /**
   * End conversation
   */
  endConversation(sessionId: string): void {
    this.dialogueState.endSession(sessionId);
  }

  /**
   * Update dialogue state based on intent
   */
  private updateDialogueState(sessionId: string, intent: DetectedIntent, nextState: DialogueState): void {
    // Map intent to dialogue event
    let event: DialogueEvent;

    if (intent.entities.service) {
      event = { type: 'SERVICE_PROVIDED', service: intent.entities.service };
    } else if (intent.entities.location) {
      event = { type: 'LOCATION_PROVIDED', location: intent.entities.location };
    } else if (intent.entities.time) {
      event = { type: 'TIME_PROVIDED', time: intent.entities.time };
    } else if (intent.intent === IntentType.CANCEL_REQUEST) {
      event = { type: 'CANCEL' };
    } else {
      event = { type: 'MESSAGE', text: intent.rawText };
    }

    try {
      this.dialogueState.transition(sessionId, event);
    } catch (error) {
      console.error('State transition error:', error);
      // Continue without state update
    }
  }

  /**
   * Health check
   */
  healthCheck(): { status: string; activeSessions: number } {
    return {
      status: 'ok',
      activeSessions: this.dialogueState.getActiveSessions(),
    };
  }
}
