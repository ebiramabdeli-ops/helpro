import express, { Request, Response, NextFunction } from 'express';
import { GDPRModel } from '../models/GDPR.js';
import { authMiddleware } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * POST /api/gdpr/export
 * Request data export (GDPR Right to Access)
 */
router.post('/export', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const request = GDPRModel.createExportRequest(userId);

    res.json({
      message: 'Data export request created. You will be notified when it is ready.',
      requestId: request.id,
      status: request.status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gdpr/export/:requestId
 * Check export request status
 */
router.get('/export/:requestId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const userId = req.userId!;

    const request = GDPRModel.findExportRequest(requestId);
    if (!request || request.userId !== userId) {
      throw new ApiError('Export request not found', 404);
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gdpr/export/:requestId/download
 * Download exported data
 */
router.get('/export/:requestId/download', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const userId = req.userId!;

    const request = GDPRModel.findExportRequest(requestId);
    if (!request || request.userId !== userId) {
      throw new ApiError('Export request not found', 404);
    }

    if (request.status !== 'ready') {
      throw new ApiError('Export not ready yet', 400);
    }

    if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
      throw new ApiError('Export has expired', 410);
    }

    const exportDir = path.join(process.cwd(), 'exports');
    const filename = `user-data-${userId}-${requestId.split('-')[1]}.json`;
    const filepath = path.join(exportDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new ApiError('Export file not found', 404);
    }

    res.download(filepath, `my-helpro-data-${Date.now()}.json`);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/gdpr/delete
 * Request account deletion (GDPR Right to Erasure)
 */
router.post('/delete', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { reason, confirmEmail } = req.body;

    // Additional security check
    if (!confirmEmail) {
      throw new ApiError('Email confirmation required for account deletion', 400);
    }

    const request = GDPRModel.createDeletionRequest(userId, reason);

    res.json({
      message: 'Account deletion scheduled. You have 30 days to cancel this request.',
      requestId: request.id,
      scheduledFor: request.scheduledFor,
      status: request.status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/gdpr/delete/cancel
 * Cancel account deletion request
 */
router.post('/delete/cancel', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const request = GDPRModel.findDeletionRequest(userId);

    if (!request) {
      throw new ApiError('No active deletion request found', 404);
    }

    const cancelled = GDPRModel.cancelDeletion(request.id);
    if (!cancelled) {
      throw new ApiError('Failed to cancel deletion request', 500);
    }

    res.json({
      message: 'Account deletion cancelled',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gdpr/delete/status
 * Check deletion request status
 */
router.get('/delete/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const request = GDPRModel.findDeletionRequest(userId);

    res.json({
      hasPendingDeletion: !!request,
      request: request || null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
