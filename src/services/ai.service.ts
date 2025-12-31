/**
 * AI Service
 * Frontend client for Python AI microservice
 */

import { aiApi, APIError } from './api-client';

export interface AnalyzeTextRequest {
  text: string;
  language: string;
  context?: Record<string, any>;
}

export interface AnalyzeTextResponse {
  intent: string;
  confidence: number;
  entities: {
    dates?: string[];
    times?: string[];
    locations?: string[];
    items?: string[];
    money?: string[];
  };
  urgency: 'high' | 'medium' | 'low';
  service_category?: string;
}

export interface MakeDecisionRequest {
  intent: string;
  entities: Record<string, any>;
  context?: Record<string, any>;
}

export interface MakeDecisionResponse {
  action: string;
  suggested_response: string;
  next_steps: string[];
  auto_actions: string[];
  warnings: string[];
}

export interface MatchHelpersRequest {
  service_category: string;
  location: { lat: number; lng: number };
  budget?: number;
  urgency?: 'high' | 'medium' | 'low';
  preferences?: Record<string, any>;
}

export interface MatchHelpersResponse {
  matches: Array<{
    id: string;
    match_score: number;
    match_reasons: string[];
    distance_km: number;
    [key: string]: any;
  }>;
  algorithm: string;
  execution_time_ms: number;
}

export interface TrustScoreResponse {
  score: number;
  breakdown: Record<string, number>;
  level: 'high' | 'medium' | 'low';
  recommendations: string[];
}

/**
 * AI Service Client
 */
export class AIService {
  /**
   * Analyze user text (NLP + Intent Detection)
   */
  static async analyzeText(
    text: string,
    language: string,
    context?: Record<string, any>
  ): Promise<AnalyzeTextResponse> {
    try {
      return await aiApi.post<AnalyzeTextResponse>('/analyze', {
        text,
        language,
        context,
      });
    } catch (error) {
      console.error('AI analyze failed:', error);
      throw error;
    }
  }

  /**
   * Make decision based on intent
   */
  static async makeDecision(
    request: MakeDecisionRequest
  ): Promise<MakeDecisionResponse> {
    try {
      return await aiApi.post<MakeDecisionResponse>('/decide', request);
    } catch (error) {
      console.error('AI decision failed:', error);
      throw error;
    }
  }

  /**
   * Match helpers to task
   */
  static async matchHelpers(
    request: MatchHelpersRequest
  ): Promise<MatchHelpersResponse> {
    try {
      return await aiApi.post<MatchHelpersResponse>('/match', {
        task_data: {
          service_category: request.service_category,
          location: request.location,
          budget: request.budget,
          urgency: request.urgency || 'medium',
        },
        available_helpers: [], // Backend will fetch
        preferences: request.preferences,
      });
    } catch (error) {
      console.error('AI matching failed:', error);
      throw error;
    }
  }

  /**
   * Get user's trust score
   */
  static async getMyTrustScore(): Promise<TrustScoreResponse> {
    try {
      return await aiApi.get<TrustScoreResponse>('/my-score');
    } catch (error) {
      console.error('Get trust score failed:', error);
      throw error;
    }
  }

  /**
   * Check AI service health
   */
  static async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      return await aiApi.get('/');
    } catch (error) {
      console.error('AI health check failed:', error);
      return { status: 'unhealthy', service: 'Python AI Service' };
    }
  }

  /**
   * Record feedback for learning
   * (Called after user actions to improve AI)
   */
  static async recordFeedback(
    actionId: string,
    actionType: string,
    outcome: 'accepted' | 'rejected' | 'completed' | 'complained' | 'cancelled',
    data: Record<string, any>
  ): Promise<void> {
    try {
      await aiApi.post('/feedback', {
        action_id: actionId,
        action_type: actionType,
        outcome,
        data,
      });
    } catch (error) {
      // Feedback is non-critical, just log
      console.warn('AI feedback recording failed:', error);
    }
  }
}

/**
 * React Hook for AI Service
 */
export function useAI() {
  const analyzeText = async (text: string, language: string) => {
    return AIService.analyzeText(text, language);
  };

  const makeDecision = async (request: MakeDecisionRequest) => {
    return AIService.makeDecision(request);
  };

  const matchHelpers = async (request: MatchHelpersRequest) => {
    return AIService.matchHelpers(request);
  };

  const getMyTrustScore = async () => {
    return AIService.getMyTrustScore();
  };

  const recordFeedback = async (
    actionId: string,
    actionType: string,
    outcome: 'accepted' | 'rejected' | 'completed' | 'complained' | 'cancelled',
    data: Record<string, any>
  ) => {
    return AIService.recordFeedback(actionId, actionType, outcome, data);
  };

  return {
    analyzeText,
    makeDecision,
    matchHelpers,
    getMyTrustScore,
    recordFeedback,
  };
}
