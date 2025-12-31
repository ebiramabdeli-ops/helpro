import express, { Request, Response, NextFunction } from 'express';
import { GoogleOAuthService } from '../services/googleOAuth.js';
import { UserModel } from '../models/User.js';
import { OAuthModel } from '../models/OAuth.js';
import { UserProfileModel } from '../models/UserProfile.js';
import { EmailService } from '../services/email.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * GET /api/oauth/google
 * Get Google OAuth URL
 */
router.get('/google', (req: Request, res: Response) => {
  const state = Math.random().toString(36).substring(7);
  const authUrl = GoogleOAuthService.getAuthUrl(state);
  
  res.json({ authUrl, state });
});

/**
 * POST /api/oauth/google/callback
 * Handle Google OAuth callback
 */
router.post('/google/callback', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;

    if (!code) {
      throw new ApiError('Authorization code is required', 400);
    }

    // Exchange code for tokens
    const tokens = await GoogleOAuthService.getTokens(code);
    
    // Get user info from Google
    const googleUser = await GoogleOAuthService.getUserInfo(tokens.access_token);

    if (!googleUser.verified_email) {
      throw new ApiError('Google email is not verified', 400);
    }

    // Check if OAuth account exists
    let oauthAccount = OAuthModel.findByProvider('google', googleUser.id);
    let user;

    if (oauthAccount) {
      // Existing OAuth user - login
      user = UserModel.findById(oauthAccount.userId);
      
      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Update OAuth tokens
      OAuthModel.updateTokens(user.id, 'google', {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      });
    } else {
      // Check if user with this email already exists
      const existingUser = UserModel.findByEmail(googleUser.email);

      if (existingUser) {
        // Link OAuth account to existing user
        user = existingUser;
        
        oauthAccount = OAuthModel.create({
          userId: user.id,
          provider: 'google',
          providerId: googleUser.id,
          email: googleUser.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        });
      } else {
        // Create new user
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        user = await UserModel.create({
          id: userId,
          name: googleUser.name,
          email: googleUser.email,
          role: 'customer',
          authProvider: 'google',
          emailVerified: true, // Google email is already verified
        });

        // Create OAuth account link
        oauthAccount = OAuthModel.create({
          userId: user.id,
          provider: 'google',
          providerId: googleUser.id,
          email: googleUser.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        });

        // Create user profile
        UserProfileModel.create(user.id);
        UserProfileModel.updateVerification(user.id, 'email', true);

        // Send welcome email
        await EmailService.sendWelcomeEmail(user.email, user.name);
      }
    }

    // Update avatar if not set
    if (!user.avatar && googleUser.picture) {
      UserModel.update(user.id, { avatar: googleUser.picture });
    }

    // Generate JWT token
    const token = generateToken(user.id, true); // MFA not required for OAuth
    const safeUser = UserModel.toSafe(user);

    res.json({
      user: safeUser,
      token,
      isNewUser: !oauthAccount || oauthAccount.createdAt.getTime() > Date.now() - 60000,
      message: 'Google login successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/oauth/disconnect/:provider
 * Disconnect OAuth provider
 */
router.post('/disconnect/:provider', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    const userId = req.userId!;

    if (!['google', 'apple', 'facebook'].includes(provider)) {
      throw new ApiError('Invalid provider', 400);
    }

    const user = UserModel.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Check if user has a password (can't disconnect if it's the only login method)
    if (!user.password) {
      const oauthAccounts = OAuthModel.findByUserId(userId);
      if (oauthAccounts.length <= 1) {
        throw new ApiError('Cannot disconnect the only login method. Set a password first.', 400);
      }
    }

    const deleted = OAuthModel.delete(userId, provider);
    
    if (!deleted) {
      throw new ApiError('OAuth account not found', 404);
    }

    res.json({
      message: `${provider} account disconnected successfully`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/oauth/linked
 * Get linked OAuth accounts
 */
router.get('/linked', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const accounts = OAuthModel.findByUserId(userId);

    const linkedAccounts = accounts.map((account) => ({
      provider: account.provider,
      email: account.email,
      linkedAt: account.createdAt,
    }));

    res.json({ accounts: linkedAccounts });
  } catch (error) {
    next(error);
  }
});

export default router;
