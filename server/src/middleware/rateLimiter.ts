import rateLimit from 'express-rate-limit';
import { securityConfig } from '../config/security.js';

/**
 * General rate limiter for all routes
 */
export const generalLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.max,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiter for login/auth routes
 */
export const authLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.login.windowMs,
  max: securityConfig.rateLimit.login.max,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate limiter for phone verification
 */
export const phoneVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 verification attempts per hour
  message: 'Too many verification attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for MFA verification
 */
export const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 MFA attempts per 15 minutes
  message: 'Too many MFA attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
