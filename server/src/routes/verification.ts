import express, { Request, Response, NextFunction } from 'express';
import { IdentityVerificationModel } from '../models/IdentityVerification.js';
import { FileModel } from '../models/File.js';
import { UserProfileModel } from '../models/UserProfile.js';
import { UserModel } from '../models/User.js';
import { BiometricService } from '../services/biometric.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireBiometricConsent } from '../middleware/verification.js';
import { uploadConfigs } from '../middleware/upload.js';
import { ApiError } from '../middleware/errorHandler.js';
import path from 'path';

const router = express.Router();

/**
 * POST /api/verification/consent/biometric
 * Give biometric consent
 */
router.post('/consent/biometric', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { consent } = req.body;

    if (consent !== true) {
      throw new ApiError('Explicit consent required', 400);
    }

    const user = UserModel.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Update user consent
    UserModel.update(userId, {
      biometricConsent: true,
      biometricConsentDate: new Date(),
    });

    // Audit log
    AuditLogModel.create({
      userId,
      action: 'BIOMETRIC_CONSENT_GIVEN',
      performedBy: userId,
      ipAddress: req.ip,
    });

    res.json({
      message: 'Biometric consent recorded',
      consentDate: new Date(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/verification/consent/revoke
 * Revoke biometric consent
 */
router.post('/consent/revoke', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    UserModel.update(userId, {
      biometricConsent: false,
    });

    // Audit log
    AuditLogModel.create({
      userId,
      action: 'BIOMETRIC_CONSENT_REVOKED',
      performedBy: userId,
      ipAddress: req.ip,
    });

    res.json({
      message: 'Biometric consent revoked',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/verification/status
 * Get verification status
 */
router.get('/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const user = UserModel.findById(userId);
    const verification = IdentityVerificationModel.findByUserId(userId);

    res.json({
      emailVerified: user?.emailVerified || false,
      verificationStatus: user?.verificationStatus || 'UNVERIFIED_IDENTITY',
      biometricConsent: user?.biometricConsent || false,
      canBook: user?.emailVerified && user?.verificationStatus === 'VERIFIED',
      verification: verification || null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/verification/document
 * Upload identity document
 */
router.post(
  '/document',
  authMiddleware,
  uploadConfigs.identity,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { documentType, documentNumber, expiryDate, country } = req.body;

      if (!files || !files.front) {
        throw new ApiError('Front image of document is required', 400);
      }

      const validTypes = ['passport', 'id_card', 'drivers_license', 'residence_permit'];
      if (!validTypes.includes(documentType)) {
        throw new ApiError('Invalid document type', 400);
      }

      const frontFile = files.front[0];
      const backFile = files.back?.[0];

      // Save file metadata
      const frontFileRecord = FileModel.create({
        userId,
        filename: frontFile.filename,
        originalName: frontFile.originalname,
        mimetype: frontFile.mimetype,
        size: frontFile.size,
        path: frontFile.path,
        purpose: 'identity',
      });

      let backFileRecord;
      if (backFile) {
        backFileRecord = FileModel.create({
          userId,
          filename: backFile.filename,
          originalName: backFile.originalname,
          mimetype: backFile.mimetype,
          size: backFile.size,
          path: backFile.path,
          purpose: 'identity',
        });
      }

      // Verify document authenticity (mock for now)
      const documentVerification = await BiometricService.verifyDocument(
        frontFile.path,
        documentType
      );

      if (!documentVerification.isAuthentic) {
        throw new ApiError('Document verification failed. Please ensure the document is clear and authentic.', 400);
      }

      // Add document to verification
      const verification = IdentityVerificationModel.addDocument(userId, {
        type: documentType,
        frontImage: frontFileRecord.id,
        backImage: backFileRecord?.id,
        documentNumber: documentNumber || documentVerification.extractedData?.documentNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        country,
      });

      // Update user status
      UserModel.update(userId, {
        verificationStatus: 'ID_PENDING',
      });

      // Audit log
      AuditLogModel.create({
        userId,
        action: 'DOCUMENT_UPLOADED',
        performedBy: userId,
        details: `Document type: ${documentType}`,
        ipAddress: req.ip,
      });

      res.json({
        message: 'Document uploaded successfully',
        verification,
        documentVerification: {
          confidence: documentVerification.confidence,
          extractedData: documentVerification.extractedData,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/verification/biometric
 * Upload biometric face image for verification
 */
router.post(
  '/biometric',
  authMiddleware,
  requireBiometricConsent,
  uploadConfigs.biometric,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const file = req.file;

      if (!file) {
        throw new ApiError('Face image is required', 400);
      }

      // Get user's identity verification
      const verification = IdentityVerificationModel.findByUserId(userId);
      if (!verification || verification.documents.length === 0) {
        throw new ApiError('Please upload identity document first', 400);
      }

      // Save file metadata
      const fileRecord = FileModel.create({
        userId,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        purpose: 'biometric',
      });

      // Check liveness
      const livenessCheck = await BiometricService.checkLiveness(file.path);

      if (!livenessCheck) {
        throw new ApiError('Liveness check failed. Please ensure you are taking a live photo.', 400);
      }

      // Extract face features
      const faceFeatures = await BiometricService.extractFaceFeatures(file.path);

      if (!faceFeatures.faceDetected) {
        throw new ApiError('No face detected. Please ensure your face is clearly visible.', 400);
      }

      if (faceFeatures.faceCount > 1) {
        throw new ApiError('Multiple faces detected. Please ensure only your face is visible.', 400);
      }

      if (faceFeatures.quality < 0.7) {
        throw new ApiError('Image quality too low. Please take a clearer photo with good lighting.', 400);
      }

      // Compare face with ID document
      const firstDocument = verification.documents[0];
      const documentImageFile = FileModel.findById(firstDocument.frontImage);

      if (!documentImageFile) {
        throw new ApiError('Document image not found', 404);
      }

      const faceMatch = await BiometricService.verifyFace(file.path, documentImageFile.path);

      // Add biometric data
      const updatedVerification = IdentityVerificationModel.addBiometric(userId, {
        faceImage: fileRecord.id,
        livenessCheck: livenessCheck,
        faceMatchScore: faceMatch.confidence,
        verified: faceMatch.isMatch && faceMatch.confidence >= 90,
        consentGiven: true,
        processingComplete: true,
        attempts: 1,
      });

      // If everything is verified, update status to review
      if (faceMatch.isMatch && faceMatch.confidence >= 90) {
        IdentityVerificationModel.updateStatus(updatedVerification!.id, 'review');
        UserModel.update(userId, {
          verificationStatus: 'BIOMETRIC_PENDING',
        });
      }

      // Audit log
      AuditLogModel.create({
        userId,
        action: 'BIOMETRIC_VERIFICATION_COMPLETED',
        performedBy: userId,
        details: `Match score: ${faceMatch.confidence}%, Liveness: ${livenessCheck}`,
        ipAddress: req.ip,
      });

      res.json({
        message: 'Biometric verification completed',
        verification: updatedVerification,
        faceMatch: {
          isMatch: faceMatch.isMatch,
          confidence: faceMatch.confidence,
          livenessCheck,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/verification/submit
 * Submit verification for review
 */
router.post('/submit', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const verification = IdentityVerificationModel.findByUserId(userId);

    if (!verification) {
      throw new ApiError('No verification found', 404);
    }

    if (verification.documents.length === 0) {
      throw new ApiError('Please upload identity document first', 400);
    }

    if (!verification.biometric) {
      throw new ApiError('Please complete biometric verification first', 400);
    }

    // Update status to review
    const updated = IdentityVerificationModel.updateStatus(verification.id, 'review');

    res.json({
      message: 'Verification submitted for review',
      verification: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/verification/admin/pending
 * Get all pending verifications (admin only)
 */
router.get('/admin/pending', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Add admin role check
    const verifications = IdentityVerificationModel.getAll('review');

    res.json({
      verifications,
      count: verifications.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/verification/admin/:verificationId/approve
 * Approve verification (admin only)
 */
router.post('/admin/:verificationId/approve', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Add admin role check
    const { verificationId } = req.params;
    const { notes } = req.body;
    const verification = IdentityVerificationModel.findById(verificationId);

    if (!verification) {
      throw new ApiError('Verification not found', 404);
    }

    // Update verification status
    const updated = IdentityVerificationModel.updateStatus(
      verificationId,
      'approved',
      req.userId
    );

    // Update user status to VERIFIED
    UserModel.update(verification.userId, {
      verificationStatus: 'VERIFIED',
    });

    // Update user profile verification status
    UserProfileModel.updateVerification(verification.userId, 'identity', true);
    if (verification.biometric?.verified) {
      UserProfileModel.updateVerification(verification.userId, 'biometric', true);
    }

    // Audit log
    AuditLogModel.create({
      userId: verification.userId,
      action: 'VERIFICATION_APPROVED',
      performedBy: req.userId!,
      details: notes || 'Verification approved by admin',
      ipAddress: req.ip,
    });

    res.json({
      message: 'Verification approved',
      verification: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/verification/admin/:verificationId/reject
 * Reject verification (admin only)
 */
router.post('/admin/:verificationId/reject', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Add admin role check
    const { verificationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new ApiError('Rejection reason is required', 400);
    }

    const verification = IdentityVerificationModel.findById(verificationId);
    if (!verification) {
      throw new ApiError('Verification not found', 404);
    }

    const updated = IdentityVerificationModel.updateStatus(
      verificationId,
      'rejected',
      req.userId,
      reason
    );

    // Update user status
    UserModel.update(verification.userId, {
      verificationStatus: 'ID_REJECTED',
    });

    // Audit log
    AuditLogModel.create({
      userId: verification.userId,
      action: 'VERIFICATION_REJECTED',
      performedBy: req.userId!,
      details: `Reason: ${reason}`,
      ipAddress: req.ip,
    });

    res.json({
      message: 'Verification rejected',
      verification: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/verification/file/:fileId
 * Get uploaded file (authenticated users only)
 */
router.get('/file/:fileId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;
    const file = FileModel.findById(fileId);

    if (!file) {
      throw new ApiError('File not found', 404);
    }

    // Check if user has access to this file
    const user = UserModel.findById(req.userId!);
    const isOwner = file.userId === req.userId;
    const isAdmin = user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ApiError('Access denied', 403);
    }

    res.sendFile(path.resolve(file.path));
  } catch (error) {
    next(error);
  }
});

export default router;
