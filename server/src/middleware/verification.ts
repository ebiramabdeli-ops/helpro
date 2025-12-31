import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler.js';
import { UserModel } from '../models/User.js';

/**
 * Middleware to check if user has verified email
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ApiError('Authentication required', 401);
    }

    const user = UserModel.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (!user.emailVerified) {
      throw new ApiError(
        'Email verification required. Please verify your email before proceeding.',
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has completed identity verification
 */
export const requireIdentityVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ApiError('Authentication required', 401);
    }

    const user = UserModel.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (user.verificationStatus !== 'VERIFIED') {
      throw new ApiError(
        'Identity verification required. Please complete identity verification to book services.',
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check verification for booking
 */
export const requireBookingAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ApiError('Authentication required', 401);
    }

    const user = UserModel.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Check email verification
    if (!user.emailVerified) {
      throw new ApiError(
        'Email verification required. Please verify your email before booking.',
        403
      );
    }

    // Check identity verification
    if (user.verificationStatus !== 'VERIFIED') {
      throw new ApiError(
        `Identity verification required. Current status: ${user.verificationStatus}. Please complete identity verification to book services.`,
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check biometric consent
 */
export const requireBiometricConsent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ApiError('Authentication required', 401);
    }

    const user = UserModel.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (!user.biometricConsent) {
      throw new ApiError(
        'Biometric consent required. Please accept biometric processing terms before proceeding.',
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
