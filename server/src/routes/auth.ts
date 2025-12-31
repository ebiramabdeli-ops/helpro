import express, { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User.js';
import { PhoneVerificationModel } from '../models/PhoneVerification.js';
import { EmailVerificationModel } from '../models/EmailVerification.js';
import { UserProfileModel } from '../models/UserProfile.js';
import { EmailService } from '../services/email.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { authLimiter, phoneVerificationLimiter, mfaLimiter } from '../middleware/rateLimiter.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRole,
  sanitizeInput,
  ValidationError,
} from '../utils/validators.js';
import {
  generateMFASecret,
  verifyMFAToken,
  generateBackupCodes,
  hashData,
} from '../utils/crypto.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      throw new ApiError('All fields are required', 400);
    }

    if (!validateEmail(email)) {
      throw new ApiError('Invalid email format', 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new ApiError(passwordValidation.errors.join(', '), 400);
    }

    if (!validateRole(role)) {
      throw new ApiError('Invalid role', 400);
    }

    if (phone && !validatePhone(phone)) {
      throw new ApiError('Invalid phone format. Use E.164 format: +[country][number]', 400);
    }

    // Check if user exists
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      throw new ApiError('Email already registered', 409);
    }

    if (phone) {
      const existingPhone = UserModel.findByPhone(phone);
      if (existingPhone) {
        throw new ApiError('Phone number already registered', 409);
      }
    }

    // Create user
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const user = await UserModel.create({
      id: userId,
      name: sanitizeInput(name),
      email: email.toLowerCase(),
      password,
      role,
      phone,
      authProvider: 'local',
    });

    // Create user profile
    UserProfileModel.create(userId);

    // Create email verification
    const verification = EmailVerificationModel.create(userId, email);
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verification.token}`;

    // Send verification email
    await EmailService.sendVerificationEmail(email, user.name || 'User', verificationUrl);

    // Generate token (short-lived, email not verified yet)
    const token = generateToken(userId, false);

    res.status(201).json({
      user,
      token,
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError('Email and password are required', 400);
    }

    // Check if account is locked
    if (UserModel.isAccountLocked(email)) {
      throw new ApiError('Account is temporarily locked due to too many failed attempts. Try again in 15 minutes.', 423);
    }

    const user = UserModel.findByEmail(email);
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Check if user has a password (OAuth users might not have one)
    if (!user.password) {
      throw new ApiError('This account uses OAuth login (Google, etc.). Please use the appropriate sign-in method.', 400);
    }

    const isValid = await UserModel.verifyPassword(password, user.password);
    if (!isValid) {
      UserModel.incrementLoginAttempts(email);
      throw new ApiError('Invalid credentials', 401);
    }

    // Reset login attempts on successful login
    UserModel.resetLoginAttempts(email);

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      // Return short-lived token, require MFA verification
      const token = generateToken(user.id, false);
      res.json({
        requireMFA: true,
        token,
        message: 'MFA verification required',
      });
      return;
    }

    // Generate full token
    const token = generateToken(user.id, true);
    const safeUser = UserModel.toSafe(user);

    res.json({
      user: safeUser,
      token,
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify-mfa
 * Verify MFA token
 */
router.post('/verify-mfa', [authMiddleware, mfaLimiter], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token: mfaToken } = req.body;

    if (!mfaToken) {
      throw new ApiError('MFA token is required', 400);
    }

    const user = UserModel.findById(req.userId!);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new ApiError('MFA not enabled for this account', 400);
    }

    const isValid = verifyMFAToken(mfaToken, user.mfaSecret);
    if (!isValid) {
      throw new ApiError('Invalid MFA token', 401);
    }

    // Generate full token with MFA verified
    const token = generateToken(user.id, true);
    const safeUser = UserModel.toSafe(user);

    res.json({
      user: safeUser,
      token,
      message: 'MFA verification successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = UserModel.findById(req.userId!);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.json(UserModel.toSafe(user));
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/auth/me
 * Update profile
 */
router.patch('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, avatar } = req.body;
    
    const updates: any = {};
    if (name) updates.name = sanitizeInput(name);
    if (avatar) updates.avatar = sanitizeInput(avatar);

    const user = UserModel.update(req.userId!, updates);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/phone/request-verification
 * Request phone verification code
 */
router.post('/phone/request-verification', [authMiddleware, phoneVerificationLimiter], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new ApiError('Phone number is required', 400);
    }

    if (!validatePhone(phone)) {
      throw new ApiError('Invalid phone format. Use E.164 format: +[country][number]', 400);
    }

    const user = UserModel.findById(req.userId!);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Check if phone is already taken
    const existingPhone = UserModel.findByPhone(phone);
    if (existingPhone && existingPhone.id !== user.id) {
      throw new ApiError('Phone number already in use', 409);
    }

    // Update user's phone
    UserModel.update(user.id, { phone, phoneVerified: false });

    // Create verification
    const verification = PhoneVerificationModel.create(user.id, phone);

    // TODO: Send SMS with verification code
    // For now, return code in response (ONLY FOR DEVELOPMENT!)
    console.log(`📱 Verification code for ${phone}: ${verification.code}`);

    res.json({
      message: 'Verification code sent to your phone',
      // Remove this in production:
      code: process.env.NODE_ENV === 'development' ? verification.code : undefined,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/phone/verify
 * Verify phone number
 */
router.post('/phone/verify', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;

    if (!code) {
      throw new ApiError('Verification code is required', 400);
    }

    const isValid = PhoneVerificationModel.verify(req.userId!, code);
    if (!isValid) {
      throw new ApiError('Invalid or expired verification code', 400);
    }

    // Mark phone as verified
    UserModel.verifyPhone(req.userId!);

    res.json({
      message: 'Phone number verified successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/mfa/setup
 * Setup MFA for user
 */
router.post('/mfa/setup', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = UserModel.findById(req.userId!);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (user.mfaEnabled) {
      throw new ApiError('MFA is already enabled', 400);
    }

    // Generate secret and QR code
    const { secret, qrCode } = generateMFASecret(user.email);
    const backupCodes = generateBackupCodes(10);

    // Store secret temporarily (not enabled yet)
    // User needs to verify with a token first

    res.json({
      secret,
      qrCode: await qrCode,
      backupCodes,
      message: 'Scan the QR code with your authenticator app, then verify with a token',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/mfa/enable
 * Enable MFA after verification
 */
router.post('/mfa/enable', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { secret, token } = req.body;

    if (!secret || !token) {
      throw new ApiError('Secret and token are required', 400);
    }

    const user = UserModel.findById(req.userId!);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Verify token
    const isValid = verifyMFAToken(token, secret);
    if (!isValid) {
      throw new ApiError('Invalid MFA token', 401);
    }

    // Enable MFA
    UserModel.enableMFA(user.id, secret);

    res.json({
      message: 'MFA enabled successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/mfa/disable
 * Disable MFA
 */
router.post('/mfa/disable', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, token } = req.body;

    if (!password || !token) {
      throw new ApiError('Password and MFA token are required', 400);
    }

    const user = UserModel.findById(req.userId!);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (!user.mfaEnabled) {
      throw new ApiError('MFA is not enabled', 400);
    }

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      throw new ApiError('Cannot verify password for OAuth accounts', 400);
    }

    // Verify password
    const isPasswordValid = await UserModel.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid password', 401);
    }

    // Verify MFA token
    const isTokenValid = verifyMFAToken(token, user.mfaSecret!);
    if (!isTokenValid) {
      throw new ApiError('Invalid MFA token', 401);
    }

    // Disable MFA
    UserModel.disableMFA(user.id);

    res.json({
      message: 'MFA disabled successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ApiError('Verification token is required', 400);
    }

    const verification = EmailVerificationModel.findByToken(token);
    if (!verification) {
      throw new ApiError('Invalid or expired verification token', 400);
    }

    // Mark email as verified
    const success = EmailVerificationModel.verify(token);
    if (!success) {
      throw new ApiError('Failed to verify email', 500);
    }

    // Update user
    UserModel.verifyEmail(verification.userId);
    UserProfileModel.updateVerification(verification.userId, 'email', true);

    // Send welcome email
    const user = UserModel.findById(verification.userId);
    if (user) {
      await EmailService.sendWelcomeEmail(user.email, user.name);
    }

    res.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend email verification
 */
router.post('/resend-verification', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = UserModel.findById(req.userId!);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (user.emailVerified) {
      throw new ApiError('Email is already verified', 400);
    }

    // Create new verification
    const verification = EmailVerificationModel.create(user.id, user.email);
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verification.token}`;

    // Send email
    await EmailService.sendVerificationEmail(user.email, user.name || 'User', verificationUrl);

    res.json({
      message: 'Verification email sent',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
