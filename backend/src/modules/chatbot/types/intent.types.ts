// Intent Detection Types
export enum IntentType {
  REQUEST_SERVICE = 'request_service',
  ASK_PRICE = 'ask_price',
  ASK_AVAILABILITY = 'ask_availability',
  MODIFY_REQUEST = 'modify_request',
  CANCEL_REQUEST = 'cancel_request',
  ASK_STATUS = 'ask_status',
  GREETING = 'greeting',
  HELP = 'help',
  UNKNOWN = 'unknown',
}

export enum ServiceType {
  CLEANING = 'cleaning',
  MOVING = 'moving',
  RECYCLING = 'recycling',
  REPAIR = 'repair',
  GARDENING = 'gardening',
  SHOPPING = 'shopping',
  ASSEMBLY = 'assembly',
  PAINTING = 'painting',
  UNKNOWN = 'unknown',
}

export interface DetectedIntent {
  intent: IntentType;
  confidence: number;
  entities: {
    service?: ServiceType;
    location?: string;
    time?: string;
    urgency?: 'urgent' | 'normal' | 'flexible';
    budgetRange?: { min: number; max: number };
  };
  rawText: string;
  language: 'en' | 'de' | 'sv' | 'es';
}

export interface IntentPattern {
  keywords: string[];
  intent: IntentType;
  weight: number;
}

export interface ServicePattern {
  keywords: string[];
  service: ServiceType;
}
