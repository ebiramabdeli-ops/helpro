import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { securityConfig } from '../config/security.js';
import { ApiError } from './errorHandler.js';
import type { JWTPayload } from '../types/index.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      mfaVerified?: boolean;
    }
  }
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string, mfaVerified: boolean = false): string {
  const payload: JWTPayload = { userId, mfaVerified };
  const expiresIn = mfaVerified 
    ? securityConfig.jwt.expiresIn 
    : securityConfig.jwt.mfaExpiresIn;
  
  return jwt.sign(payload, securityConfig.jwt.secret, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, securityConfig.jwt.secret) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Auth middleware - requires valid JWT
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.userId = decoded.userId;
  req.mfaVerified = decoded.mfaVerified;
  next();
}

/**
 * MFA middleware - requires MFA verification
 */
export function mfaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.mfaVerified) {
    res.status(403).json({ 
      error: 'MFA verification required',
      code: 'MFA_REQUIRED' 
    });
    return;
  }
  next();
}

/**
 * Optional auth middleware
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.userId = decoded.userId;
      req.mfaVerified = decoded.mfaVerified;
    }
  }

  next();
}

/**
 * Admin middleware - requires admin role
 */
export function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // This would check the user's role from the database
  // For now, simplified version
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  // TODO: Check if user has admin role
  next();
}
