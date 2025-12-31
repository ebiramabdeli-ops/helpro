import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { securityConfig } from '../config/security.js';

/**
 * Generate a random verification code
 */
export function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

/**
 * Generate secure random backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Generate MFA secret
 */
export function generateMFASecret(userEmail: string): { secret: string; qrCode: Promise<string> } {
  const secret = speakeasy.generateSecret({
    name: `${securityConfig.mfa.issuer} (${userEmail})`,
    issuer: securityConfig.mfa.issuer,
    length: 32,
  });

  const qrCode = QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode,
  };
}

/**
 * Verify MFA token
 */
export function verifyMFAToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  });
}

/**
 * Hash sensitive data (for backup codes)
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate email verification token
 */
export function generateVerificationToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
