import db, { saveDB } from '../database.js';
import type { DataExportRequest, DataDeletionRequest, User } from '../types/index.js';
import { UserModel } from './User.js';
import { UserProfileModel } from './UserProfile.js';
import { IdentityVerificationModel } from './IdentityVerification.js';
import { FileModel } from './File.js';
import fs from 'fs';
import path from 'path';

export class GDPRModel {
  /**
   * Create data export request
   */
  static createExportRequest(userId: string): DataExportRequest {
    const request: DataExportRequest = {
      id: `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      requestedAt: new Date(),
      status: 'pending',
    };

    db.dataExportRequests.push(request);
    saveDB();

    // Process export asynchronously
    this.processExport(request.id).catch(console.error);

    return request;
  }

  /**
   * Process data export
   */
  private static async processExport(requestId: string): Promise<void> {
    const request = db.dataExportRequests.find((r) => r.id === requestId);
    if (!request) return;

    try {
      // Update status
      request.status = 'processing';
      saveDB();

      // Collect all user data
      const user = UserModel.findById(request.userId);
      if (!user) throw new Error('User not found');

      const profile = UserProfileModel.findByUserId(request.userId);
      const verification = IdentityVerificationModel.findByUserId(request.userId);
      const files = FileModel.findByUserId(request.userId);

      // Create export data (excluding sensitive fields)
      const exportData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
          verificationStatus: user.verificationStatus,
          country: user.country,
          language: user.language,
          authProvider: user.authProvider,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        profile: profile ? {
          bio: profile.bio,
          skills: profile.skills,
          languages: profile.languages,
          location: profile.location,
          availability: profile.availability,
          hourlyRate: profile.hourlyRate,
          verifications: profile.verifications,
        } : null,
        verification: verification ? {
          status: verification.status,
          submittedAt: verification.submittedAt,
          reviewedAt: verification.reviewedAt,
        } : null,
        files: files.map(f => ({
          filename: f.originalName,
          purpose: f.purpose,
          uploadedAt: f.uploadedAt,
        })),
        exportDate: new Date(),
      };

      // In production, save to secure storage (S3, etc.)
      const exportDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const filename = `user-data-${request.userId}-${Date.now()}.json`;
      const filepath = path.join(exportDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

      // Update request
      request.status = 'ready';
      request.completedAt = new Date();
      request.downloadUrl = `/api/gdpr/export/${request.id}/download`;
      request.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      saveDB();

    } catch (error) {
      console.error('Export failed:', error);
      request.status = 'pending';
      saveDB();
    }
  }

  /**
   * Create data deletion request
   */
  static createDeletionRequest(
    userId: string,
    reason?: string
  ): DataDeletionRequest {
    const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days grace period

    const request: DataDeletionRequest = {
      id: `deletion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      requestedAt: new Date(),
      scheduledFor,
      status: 'scheduled',
      reason,
    };

    db.dataDeletionRequests.push(request);
    saveDB();

    return request;
  }

  /**
   * Cancel deletion request
   */
  static cancelDeletion(requestId: string): boolean {
    const request = db.dataDeletionRequests.find((r) => r.id === requestId);
    if (!request || request.status === 'completed') return false;

    request.status = 'cancelled';
    saveDB();
    return true;
  }

  /**
   * Execute scheduled deletions
   */
  static executeScheduledDeletions(): void {
    const now = new Date();
    const scheduledDeletions = db.dataDeletionRequests.filter(
      (r: DataDeletionRequest) => 
        r.status === 'scheduled' && new Date(r.scheduledFor) <= now
    );

    scheduledDeletions.forEach((request) => {
      try {
        this.deleteUserData(request.userId);
        request.status = 'completed';
        request.completedAt = new Date();
        saveDB();
      } catch (error) {
        console.error(`Failed to delete user ${request.userId}:`, error);
      }
    });
  }

  /**
   * Delete all user data (GDPR right to erasure)
   */
  private static deleteUserData(userId: string): void {
    // Delete user files
    const files = FileModel.findByUserId(userId);
    files.forEach(file => FileModel.delete(file.id));

    // Delete identity verification
    const verification = IdentityVerificationModel.findByUserId(userId);
    if (verification) {
      IdentityVerificationModel.delete(verification.id);
    }

    // Delete user profile
    UserProfileModel.delete(userId);

    // Anonymize user data (keep for legal/accounting purposes)
    const userIndex = db.users.findIndex((u: User) => u.id === userId);
    if (userIndex !== -1) {
      db.users[userIndex] = {
        ...db.users[userIndex],
        name: '[DELETED]',
        email: `deleted-${userId}@deleted.local`,
        phone: undefined,
        avatar: undefined,
        password: undefined,
        mfaSecret: undefined,
        accountLocked: true,
        updatedAt: new Date(),
      };
    }

    // Keep audit logs but anonymize
    db.auditLogs = db.auditLogs.map((log) => {
      if (log.userId === userId) {
        return { ...log, details: '[USER DATA DELETED]' };
      }
      return log;
    });

    saveDB();
    console.log(`User data deleted for userId: ${userId}`);
  }

  /**
   * Find export request by ID
   */
  static findExportRequest(requestId: string): DataExportRequest | undefined {
    return db.dataExportRequests.find((r) => r.id === requestId);
  }

  /**
   * Find deletion request by user ID
   */
  static findDeletionRequest(userId: string): DataDeletionRequest | undefined {
    return db.dataDeletionRequests.find(
      (r: DataDeletionRequest) => r.userId === userId && r.status === 'scheduled'
    );
  }

  /**
   * Delete expired biometric data (must be deleted after verification)
   */
  static cleanBiometricData(): void {
    const verifications = db.identityVerifications;
    
    verifications.forEach((verification) => {
      if (verification.biometric && 
          verification.status === 'approved' && 
          !verification.biometric.dataDeletedAt) {
        
        // Delete biometric file
        const file = FileModel.findById(verification.biometric.faceImage);
        if (file) {
          FileModel.delete(file.id);
        }

        // Mark as deleted
        verification.biometric.dataDeletedAt = new Date();
      }
    });

    saveDB();
  }
}

// Run scheduled deletions daily
setInterval(() => {
  GDPRModel.executeScheduledDeletions();
}, 24 * 60 * 60 * 1000);

// Clean biometric data daily
setInterval(() => {
  GDPRModel.cleanBiometricData();
}, 24 * 60 * 60 * 1000);
