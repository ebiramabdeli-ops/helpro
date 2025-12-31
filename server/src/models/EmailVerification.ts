import db, { saveDB } from '../database.js';
import type { EmailVerification } from '../types/index.js';
import { generateVerificationToken } from '../utils/crypto.js';
import { emailConfig } from '../config/oauth.js';

export class EmailVerificationModel {
  /**
   * Create email verification
   */
  static create(userId: string, email: string): EmailVerification {
    const token = generateVerificationToken(emailConfig.verification.tokenLength);
    const expiryMs = emailConfig.verification.expiryHours * 60 * 60 * 1000;

    const verification: EmailVerification = {
      userId,
      email,
      token,
      expiresAt: new Date(Date.now() + expiryMs),
      verified: false,
    };

    // Remove old verifications for this user
    db.emailVerifications = db.emailVerifications.filter(
      (v: EmailVerification) => v.userId !== userId
    );

    db.emailVerifications.push(verification);
    saveDB();

    return verification;
  }

  /**
   * Find verification by token
   */
  static findByToken(token: string): EmailVerification | undefined {
    const now = new Date();
    return db.emailVerifications.find(
      (v: EmailVerification) => v.token === token && v.expiresAt > now && !v.verified
    );
  }

  /**
   * Find verification by user ID
   */
  static findByUserId(userId: string): EmailVerification | undefined {
    return db.emailVerifications.find((v: EmailVerification) => v.userId === userId);
  }

  /**
   * Verify email
   */
  static verify(token: string): boolean {
    const verification = this.findByToken(token);
    if (!verification) return false;

    verification.verified = true;
    saveDB();

    return true;
  }

  /**
   * Remove verification
   */
  static remove(userId: string): void {
    db.emailVerifications = db.emailVerifications.filter(
      (v: EmailVerification) => v.userId !== userId
    );
    saveDB();
  }

  /**
   * Clean expired verifications
   */
  static cleanExpired(): void {
    const now = new Date();
    db.emailVerifications = db.emailVerifications.filter(
      (v: EmailVerification) => v.expiresAt > now
    );
    saveDB();
  }
}

// Clean expired verifications every hour
setInterval(() => {
  EmailVerificationModel.cleanExpired();
}, 60 * 60 * 1000);
