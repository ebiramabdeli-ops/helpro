import { Injectable, Logger } from '@nestjs/common';
import serviceRules from '../../../common/config/service-rules.json';

/**
 * SafetyRulesService
 * 
 * Enforces platform safety rules:
 * - Block illegal/unsafe tasks
 * - Enforce verification requirements
 * - Suggest safe alternatives
 * 
 * Philosophy:
 * "Safety is non-negotiable. Humans come before algorithms."
 */
@Injectable()
export class SafetyRulesService {
  private readonly logger = new Logger(SafetyRulesService.name);
  private readonly blockedTasks = serviceRules.safetyRules.blockedTasks;
  private readonly verificationGates = serviceRules.safetyRules.verificationGates;

  /**
   * Check if a task description contains blocked keywords.
   */
  checkTaskSafety(taskDescription: string): {
    isAllowed: boolean;
    reason?: string;
    alternative?: string;
    blockedKeywords?: string[];
  } {
    const normalizedTask = taskDescription.toLowerCase();

    for (const rule of this.blockedTasks) {
      const matchedKeywords = rule.keywords.filter((keyword) =>
        normalizedTask.includes(keyword.toLowerCase()),
      );

      if (matchedKeywords.length > 0) {
        this.logger.warn(
          `Blocked unsafe task: "${taskDescription}" (keywords: ${matchedKeywords.join(', ')})`,
        );

        return {
          isAllowed: false,
          reason: rule.reason,
          alternative: rule.alternative,
          blockedKeywords: matchedKeywords,
        };
      }
    }

    return { isAllowed: true };
  }

  /**
   * Check if user's verification level allows booking a service.
   */
  checkVerificationGate(
    userVerificationLevel: 'L0' | 'L1' | 'L2' | 'L3',
    serviceSlug: string,
    jobValue: number,
  ): {
    isAllowed: boolean;
    reason?: string;
    requiredLevel?: string;
    currentLevel: string;
  } {
    const gate = this.verificationGates[userVerificationLevel];

    // Check max job value
    if (jobValue > gate.maxJobValue) {
      return {
        isAllowed: false,
        reason: `Your verification level (${userVerificationLevel}) allows jobs up to €${gate.maxJobValue}. This job is €${jobValue}.`,
        requiredLevel: this.getRequiredLevelForValue(jobValue),
        currentLevel: userVerificationLevel,
      };
    }

    // Check allowed services
    if (!gate.allowedServices.includes(serviceSlug)) {
      return {
        isAllowed: false,
        reason: `${serviceSlug} service requires higher verification level.`,
        requiredLevel: this.getRequiredLevelForService(serviceSlug),
        currentLevel: userVerificationLevel,
      };
    }

    return {
      isAllowed: true,
      currentLevel: userVerificationLevel,
    };
  }

  /**
   * Get required verification level for a job value.
   */
  private getRequiredLevelForValue(jobValue: number): string {
    if (jobValue <= 50) return 'L1';
    if (jobValue <= 500) return 'L2';
    return 'L3';
  }

  /**
   * Get required verification level for a service.
   */
  private getRequiredLevelForService(serviceSlug: string): string {
    const category = serviceRules.serviceCategories[serviceSlug];
    return category?.minProviderLevel || 'L1';
  }

  /**
   * Get safety warnings for a specific service.
   */
  getServiceSafetyInfo(serviceSlug: string): {
    requiresLicense: boolean;
    insuranceRequired: string;
    safetyWarnings: string[];
  } {
    const category = serviceRules.serviceCategories[serviceSlug];

    if (!category) {
      return {
        requiresLicense: false,
        insuranceRequired: 'basic',
        safetyWarnings: [],
      };
    }

    const warnings: string[] = [];

    if (category.requiresLicense) {
      warnings.push('⚠️ This service requires licensed professionals');
    }

    if (category.requiresVehicle) {
      warnings.push('🚗 Provider must have suitable vehicle');
    }

    if (category.insuranceRequired === 'professional') {
      warnings.push('🛡️ Enhanced insurance coverage required');
    }

    return {
      requiresLicense: category.requiresLicense,
      insuranceRequired: category.insuranceRequired,
      safetyWarnings: warnings,
    };
  }

  /**
   * Validate job request before creation.
   */
  async validateJobRequest(request: {
    userId: string;
    userVerificationLevel: 'L0' | 'L1' | 'L2' | 'L3';
    serviceSlug: string;
    taskDescription: string;
    estimatedValue: number;
  }): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check task safety
    const safetyCheck = this.checkTaskSafety(request.taskDescription);
    if (!safetyCheck.isAllowed) {
      errors.push(safetyCheck.reason);
      if (safetyCheck.alternative) {
        warnings.push(`Alternative: ${safetyCheck.alternative}`);
      }
    }

    // Check verification gate
    const verificationCheck = this.checkVerificationGate(
      request.userVerificationLevel,
      request.serviceSlug,
      request.estimatedValue,
    );

    if (!verificationCheck.isAllowed) {
      errors.push(verificationCheck.reason);
      warnings.push(
        `Please upgrade to ${verificationCheck.requiredLevel} verification to book this service.`,
      );
    }

    // Get service-specific warnings
    const serviceInfo = this.getServiceSafetyInfo(request.serviceSlug);
    warnings.push(...serviceInfo.safetyWarnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
