import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface TrustWeights {
  identity: {
    emailVerified: number;
    phoneVerified: number;
    idVerified: number;
    backgroundCheck: number;
    weight: number;
  };
  completedJobs: {
    pointsPerJob: number;
    maxPoints: number;
    weight: number;
  };
  reviews: {
    maxRating: number;
    weight: number;
  };
  onTime: {
    weight: number;
  };
  disputes: {
    penaltyPerDispute: number;
    weight: number;
  };
}

export interface MatchingWeights {
  trust: number;
  distance: number;
  availability: number;
  price: number;
}

export interface AIConfig {
  trustWeights: TrustWeights;
  matchingWeights: MatchingWeights;
  matchingConfig: any;
  riskThresholds: any;
  pricingRules: any;
  workflowRules: any;
}

@Injectable()
export class AIConfigService {
  private config: AIConfig;

  constructor(private readonly configService: ConfigService) {
    this.loadConfig();
  }

  private loadConfig(): void {
    const configPath = path.join(process.cwd(), 'config', 'ai-config.json');
    const configFile = fs.readFileSync(configPath, 'utf8');
    this.config = JSON.parse(configFile);
  }

  getTrustWeights(): TrustWeights {
    return this.config.trustWeights;
  }

  getMatchingWeights(): MatchingWeights {
    return this.config.matchingWeights;
  }

  getMatchingConfig() {
    return this.config.matchingConfig;
  }

  getRiskThresholds() {
    return this.config.riskThresholds;
  }

  getPricingRules() {
    return this.config.pricingRules;
  }

  getWorkflowRules() {
    return this.config.workflowRules;
  }

  getFullConfig(): AIConfig {
    return this.config;
  }

  // Allow runtime updates (careful!)
  updateConfig(updates: Partial<AIConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
