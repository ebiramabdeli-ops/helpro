import db, { saveDB } from '../database.js';
import type { PhoneVerification } from '../types/index.js';
import { generateVerificationCode } from '../utils/crypto.js';
import { securityConfig } from '../config/security.js';

export class PhoneVerificationModel {
  /**
   * Create phone verification
   */
  static create(userId: string, phone: string): PhoneVerification {
    const code = generateVerificationCode(securityConfig.phoneVerification.codeLength);
    const expiryMs = securityConfig.phoneVerification.expiryMinutes * 60 * 1000;

    const verification: PhoneVerification = {
      userId,
      phone,
      code,
      expiresAt: new Date(Date.now() + expiryMs),
      attempts: 0,
    };

    // Remove old verifications for this user
    db.phoneVerifications = db.phoneVerifications.filter((v: PhoneVerification) => v.userId !== userId);

    db.phoneVerifications.push(verification);
    saveDB();

    return verification;
  }

  /**
   * Find active verification for user
   */
  static findByUserId(userId: string): PhoneVerification | undefined {
    const now = new Date();
    return db.phoneVerifications.find(
      (v: PhoneVerification) => v.userId === userId && v.expiresAt > now
    );
  }

  /**
   * Verify code
   */
  static verify(userId: string, code: string): boolean {
    const verification = this.findByUserId(userId);
    if (!verification) return false;

    // Check max attempts
    if (verification.attempts >= securityConfig.phoneVerification.maxAttempts) {
      this.remove(userId);
      return false;
    }

    // Increment attempts
    verification.attempts++;
    saveDB();

    // Check code
    if (verification.code === code) {
      this.remove(userId);
      return true;
    }

    return false;
  }

  /**
   * Remove verification
   */
  static remove(userId: string): void {
    db.phoneVerifications = db.phoneVerifications.filter((v: PhoneVerification) => v.userId !== userId);
    saveDB();
  }

  /**
   * Clean expired verifications
   */
  static cleanExpired(): void {
    const now = new Date();
    db.phoneVerifications = db.phoneVerifications.filter((v: PhoneVerification) => v.expiresAt > now);
    saveDB();
  }
}

// Clean expired verifications every hour
setInterval(() => {
  PhoneVerificationModel.cleanExpired();
}, 60 * 60 * 1000);
