// Dialogue State Types
export enum DialogueState {
  START = 'START',
  ASK_SERVICE = 'ASK_SERVICE',
  ASK_LOCATION = 'ASK_LOCATION',
  ASK_TIME = 'ASK_TIME',
  ASK_DESCRIPTION = 'ASK_DESCRIPTION',
  CONFIRM = 'CONFIRM',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  state: DialogueState;
  known: {
    service?: string;
    location?: string;
    time?: string;
    description?: string;
    urgency?: 'urgent' | 'normal' | 'flexible';
    budgetRange?: { min: number; max: number };
  };
  history: Array<{
    userMessage: string;
    botResponse: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export type DialogueEvent =
  | { type: 'MESSAGE'; text: string }
  | { type: 'SERVICE_PROVIDED'; service: string }
  | { type: 'LOCATION_PROVIDED'; location: string }
  | { type: 'TIME_PROVIDED'; time: string }
  | { type: 'DESCRIPTION_PROVIDED'; description: string }
  | { type: 'CONFIRM' }
  | { type: 'CANCEL' }
  | { type: 'ERROR'; error: string };
