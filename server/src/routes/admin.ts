import express, { Request, Response, NextFunction } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { IdentityVerificationModel } from '../models/IdentityVerification.js';
import { UserModel } from '../models/User.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { GDPRModel } from '../models/GDPR.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/admin/verifications
 * Get all verifications with filtering
 */
router.get('/verifications', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const verifications = status 
      ? IdentityVerificationModel.getAll(status as string)
      : IdentityVerificationModel.getAll();

    // Enrich with user data
    const enriched = verifications.map((v) => {
      const user = UserModel.findById(v.userId);
      return {
        ...v,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          verificationStatus: user.verificationStatus,
        } : null,
      };
    });

    res.json({
      verifications: enriched,
      count: enriched.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/verifications/:verificationId
 * Get detailed verification info
 */
router.get('/verifications/:verificationId', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { verificationId } = req.params;
    const verification = IdentityVerificationModel.findById(verificationId);

    if (!verification) {
      throw new ApiError('Verification not found', 404);
    }

    const user = UserModel.findById(verification.userId);
    const auditLogs = AuditLogModel.findByUserId(verification.userId);

    res.json({
      verification,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt,
      } : null,
      auditLogs: auditLogs.filter(log => 
        log.action.includes('VERIFICATION') || 
        log.action.includes('DOCUMENT') || 
        log.action.includes('BIOMETRIC')
      ),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users
 * Get all users with filtering
 */
router.get('/users', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { verificationStatus, role } = req.query;
    
    // This is a simple filter - in production use proper query builder
    let users = UserModel.findAll?.() || [];

    if (verificationStatus) {
      users = users.filter((u: any) => u.verificationStatus === verificationStatus);
    }

    if (role) {
      users = users.filter((u: any) => u.role === role);
    }

    const safeUsers = users.map((u: any) => UserModel.toSafe(u));

    res.json({
      users: safeUsers,
      count: safeUsers.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:userId
 * Get detailed user info
 */
router.get('/users/:userId', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const user = UserModel.findById(userId);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    const verification = IdentityVerificationModel.findByUserId(userId);
    const auditLogs = AuditLogModel.findByUserId(userId);
    const deletionRequest = GDPRModel.findDeletionRequest(userId);

    res.json({
      user: UserModel.toSafe(user),
      verification,
      auditLogs,
      deletionRequest,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/users/:userId/status
 * Update user verification status (admin override)
 */
router.patch('/users/:userId/status', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { verificationStatus, reason } = req.body;

    const validStatuses = ['UNVERIFIED_IDENTITY', 'ID_PENDING', 'ID_APPROVED', 'ID_REJECTED', 'BIOMETRIC_PENDING', 'VERIFIED'];
    if (!validStatuses.includes(verificationStatus)) {
      throw new ApiError('Invalid verification status', 400);
    }

    UserModel.update(userId, { verificationStatus });

    // Audit log
    AuditLogModel.create({
      userId,
      action: 'STATUS_CHANGED_BY_ADMIN',
      performedBy: req.userId!,
      details: `Changed to ${verificationStatus}. Reason: ${reason || 'N/A'}`,
      ipAddress: req.ip,
    });

    res.json({
      message: 'User status updated',
      verificationStatus,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/audit-logs
 * Get recent audit logs
 */
router.get('/audit-logs', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 100, action } = req.query;
    
    const logs = action 
      ? AuditLogModel.findByAction(action as string)
      : AuditLogModel.getRecent(Number(limit));

    res.json({
      logs,
      count: logs.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allVerifications = IdentityVerificationModel.getAll();
    const allUsers = UserModel.findAll?.() || [];

    const stats = {
      users: {
        total: allUsers.length,
        verified: allUsers.filter((u: any) => u.verificationStatus === 'VERIFIED').length,
        pending: allUsers.filter((u: any) => 
          u.verificationStatus === 'ID_PENDING' || 
          u.verificationStatus === 'BIOMETRIC_PENDING'
        ).length,
        rejected: allUsers.filter((u: any) => u.verificationStatus === 'ID_REJECTED').length,
      },
      verifications: {
        total: allVerifications.length,
        pending: allVerifications.filter(v => v.status === 'pending').length,
        review: allVerifications.filter(v => v.status === 'review').length,
        approved: allVerifications.filter(v => v.status === 'approved').length,
        rejected: allVerifications.filter(v => v.status === 'rejected').length,
      },
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
