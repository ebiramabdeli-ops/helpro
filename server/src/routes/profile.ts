import express, { Request, Response, NextFunction } from 'express';
import { UserProfileModel } from '../models/UserProfile.js';
import { UserModel } from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { sanitizeInput } from '../utils/validators.js';

const router = express.Router();

/**
 * GET /api/profile
 * Get current user's profile
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    let profile = UserProfileModel.findByUserId(userId);

    if (!profile) {
      // Create profile if it doesn't exist
      profile = UserProfileModel.create(userId);
    }

    const user = UserModel.findById(userId);
    
    res.json({
      user: user ? UserModel.toSafe(user) : null,
      profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/profile
 * Update user profile
 */
router.patch('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const {
      bio,
      skills,
      languages,
      location,
      availability,
      hourlyRate,
    } = req.body;

    const updates: any = {};

    if (bio !== undefined) updates.bio = sanitizeInput(bio);
    if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills.map(s => sanitizeInput(s)) : [];
    if (languages !== undefined) updates.languages = Array.isArray(languages) ? languages : [];
    if (location !== undefined) updates.location = sanitizeInput(location);
    if (availability !== undefined) updates.availability = availability;
    if (hourlyRate !== undefined) {
      const rate = parseFloat(hourlyRate);
      if (isNaN(rate) || rate < 0) {
        throw new ApiError('Invalid hourly rate', 400);
      }
      updates.hourlyRate = rate;
    }

    const profile = UserProfileModel.update(userId, updates);

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile/:userId
 * Get public profile of another user
 */
router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = UserModel.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    const profile = UserProfileModel.findByUserId(userId);

    // Return public information only
    const publicUser = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    };

    const publicProfile = profile ? {
      bio: profile.bio,
      skills: profile.skills,
      languages: profile.languages,
      location: profile.location,
      availability: profile.availability,
      hourlyRate: profile.hourlyRate,
      rating: profile.rating,
      completedJobs: profile.completedJobs,
      badges: profile.badges,
      verifications: profile.verifications,
    } : null;

    res.json({
      user: publicUser,
      profile: publicProfile,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
