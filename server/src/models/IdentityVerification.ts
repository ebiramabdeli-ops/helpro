import db, { saveDB } from '../database.js';
import type { IdentityVerification, IdentityDocument, BiometricData } from '../types/index.js';

export class IdentityVerificationModel {
  /**
   * Create identity verification request
   */
  static create(userId: string): IdentityVerification {
    const verification: IdentityVerification = {
      id: `idv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      status: 'pending',
      documents: [],
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.identityVerifications.push(verification);
    saveDB();

    return verification;
  }

  /**
   * Find verification by user ID
   */
  static findByUserId(userId: string): IdentityVerification | undefined {
    return db.identityVerifications.find(
      (v: IdentityVerification) => v.userId === userId
    );
  }

  /**
   * Find verification by ID
   */
  static findById(id: string): IdentityVerification | undefined {
    return db.identityVerifications.find((v: IdentityVerification) => v.id === id);
  }

  /**
   * Add document to verification
   */
  static addDocument(
    userId: string,
    document: Omit<IdentityDocument, 'id' | 'uploadedAt'>
  ): IdentityVerification | null {
    const verification = this.findByUserId(userId) || this.create(userId);

    const newDocument: IdentityDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...document,
      uploadedAt: new Date(),
    };

    verification.documents.push(newDocument);
    verification.status = 'review';
    verification.updatedAt = new Date();

    saveDB();
    return verification;
  }

  /**
   * Add biometric data
   */
  static addBiometric(
    userId: string,
    biometric: Omit<BiometricData, 'id' | 'capturedAt'>
  ): IdentityVerification | null {
    const verification = this.findByUserId(userId) || this.create(userId);

    const newBiometric: BiometricData = {
      id: `bio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...biometric,
      capturedAt: new Date(),
    };

    verification.biometric = newBiometric;
    verification.status = 'review';
    verification.updatedAt = new Date();

    saveDB();
    return verification;
  }

  /**
   * Update verification status
   */
  static updateStatus(
    id: string,
    status: 'pending' | 'approved' | 'rejected' | 'review',
    reviewedBy?: string,
    rejectionReason?: string
  ): IdentityVerification | null {
    const verificationIndex = db.identityVerifications.findIndex(
      (v: IdentityVerification) => v.id === id
    );

    if (verificationIndex === -1) return null;

    db.identityVerifications[verificationIndex] = {
      ...db.identityVerifications[verificationIndex],
      status,
      reviewedAt: new Date(),
      reviewedBy,
      rejectionReason,
      updatedAt: new Date(),
    };

    saveDB();
    return db.identityVerifications[verificationIndex];
  }

  /**
   * Get all verifications (admin only)
   */
  static getAll(status?: string): IdentityVerification[] {
    if (status) {
      return db.identityVerifications.filter((v: IdentityVerification) => v.status === status);
    }
    return db.identityVerifications;
  }

  /**
   * Delete verification
   */
  static delete(id: string): boolean {
    const initialLength = db.identityVerifications.length;
    db.identityVerifications = db.identityVerifications.filter(
      (v: IdentityVerification) => v.id !== id
    );

    if (db.identityVerifications.length < initialLength) {
      saveDB();
      return true;
    }

    return false;
  }
}
