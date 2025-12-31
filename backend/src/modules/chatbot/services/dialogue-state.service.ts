import { Injectable } from '@nestjs/common';
import { createMachine, interpret, StateMachine, Interpreter } from 'xstate';
import { ConversationContext, DialogueState, DialogueEvent } from '../types/dialogue.types';

@Injectable()
export class DialogueStateService {
  private sessions = new Map<string, Interpreter<ConversationContext, any, DialogueEvent>>();

  /**
   * Create dialogue state machine (xstate)
   */
  private createStateMachine(): StateMachine<ConversationContext, any, DialogueEvent> {
    return createMachine<ConversationContext, DialogueEvent>(
      {
        id: 'chatbot',
        initial: 'START',
        context: {
          userId: '',
          sessionId: '',
          state: DialogueState.START,
          known: {},
          history: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        states: {
          START: {
            on: {
              MESSAGE: [
                {
                  target: 'ASK_LOCATION',
                  cond: 'hasService',
                  actions: 'storeService',
                },
                { target: 'ASK_SERVICE' },
              ],
            },
          },
          ASK_SERVICE: {
            on: {
              SERVICE_PROVIDED: {
                target: 'ASK_LOCATION',
                actions: 'storeService',
              },
              MESSAGE: {
                target: 'ASK_SERVICE',
                cond: 'noService',
              },
            },
          },
          ASK_LOCATION: {
            on: {
              LOCATION_PROVIDED: {
                target: 'ASK_TIME',
                actions: 'storeLocation',
              },
              MESSAGE: [
                {
                  target: 'ASK_TIME',
                  cond: 'hasLocation',
                  actions: 'storeLocation',
                },
                { target: 'ASK_LOCATION' },
              ],
            },
          },
          ASK_TIME: {
            on: {
              TIME_PROVIDED: {
                target: 'ASK_DESCRIPTION',
                actions: 'storeTime',
              },
              MESSAGE: [
                {
                  target: 'ASK_DESCRIPTION',
                  cond: 'hasTime',
                  actions: 'storeTime',
                },
                { target: 'ASK_TIME' },
              ],
            },
          },
          ASK_DESCRIPTION: {
            on: {
              DESCRIPTION_PROVIDED: {
                target: 'CONFIRM',
                actions: 'storeDescription',
              },
              MESSAGE: {
                target: 'CONFIRM',
                actions: 'storeDescription',
              },
            },
          },
          CONFIRM: {
            on: {
              CONFIRM: {
                target: 'COMPLETE',
              },
              CANCEL: {
                target: 'START',
                actions: 'resetContext',
              },
            },
          },
          COMPLETE: {
            type: 'final',
          },
          ERROR: {
            on: {
              MESSAGE: 'START',
            },
          },
        },
      },
      {
        guards: {
          hasService: (context, event: any) => !!event.service,
          noService: (context, event: any) => !event.service,
          hasLocation: (context, event: any) => !!event.location,
          hasTime: (context, event: any) => !!event.time,
        },
        actions: {
          storeService: (context, event: any) => {
            context.known.service = event.service;
            context.updatedAt = new Date();
          },
          storeLocation: (context, event: any) => {
            context.known.location = event.location;
            context.updatedAt = new Date();
          },
          storeTime: (context, event: any) => {
            context.known.time = event.time;
            context.updatedAt = new Date();
          },
          storeDescription: (context, event: any) => {
            context.known.description = event.description || event.text;
            context.updatedAt = new Date();
          },
          resetContext: (context) => {
            context.known = {};
            context.history = [];
            context.updatedAt = new Date();
          },
        },
      },
    );
  }

  /**
   * Start new conversation session
   */
  startSession(userId: string): string {
    const sessionId = this.generateSessionId();
    const machine = this.createStateMachine();
    const service = interpret(machine).start();

    // Initialize context
    service.send({
      type: 'MESSAGE' as any,
      text: '',
    });

    this.sessions.set(sessionId, service);

    return sessionId;
  }

  /**
   * Get current state for session
   */
  getState(sessionId: string): DialogueState | null {
    const service = this.sessions.get(sessionId);
    if (!service) return null;

    return service.state.value as DialogueState;
  }

  /**
   * Get conversation context
   */
  getContext(sessionId: string): ConversationContext | null {
    const service = this.sessions.get(sessionId);
    if (!service) return null;

    return service.state.context;
  }

  /**
   * Update state based on event
   */
  transition(sessionId: string, event: DialogueEvent): DialogueState {
    const service = this.sessions.get(sessionId);
    if (!service) {
      throw new Error(`Session ${sessionId} not found`);
    }

    service.send(event);

    return service.state.value as DialogueState;
  }

  /**
   * Check if state requires specific information
   */
  getMissingInfo(sessionId: string): string[] {
    const context = this.getContext(sessionId);
    if (!context) return [];

    const missing: string[] = [];

    if (!context.known.service) missing.push('service');
    if (!context.known.location) missing.push('location');
    if (!context.known.time) missing.push('time');
    if (!context.known.description) missing.push('description');

    return missing;
  }

  /**
   * Clean up session
   */
  endSession(sessionId: string): void {
    const service = this.sessions.get(sessionId);
    if (service) {
      service.stop();
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all active sessions (for monitoring)
   */
  getActiveSessions(): number {
    return this.sessions.size;
  }
}
