import db, { saveDB } from '../database.js';
import type { UserProfile } from '../types/index.js';

export class UserProfileModel {
  /**
   * Create user profile
   */
  static create(userId: string): UserProfile {
    const profile: UserProfile = {
      userId,
      verifications: {
        email: false,
        phone: false,
        identity: false,
        address: false,
      },
    };

    db.userProfiles.push(profile);
    saveDB();

    return profile;
  }

  /**
   * Find profile by user ID
   */
  static findByUserId(userId: string): UserProfile | undefined {
    return db.userProfiles.find((p: UserProfile) => p.userId === userId);
  }

  /**
   * Update profile
   */
  static update(userId: string, data: Partial<UserProfile>): UserProfile | null {
    const profileIndex = db.userProfiles.findIndex((p: UserProfile) => p.userId === userId);

    if (profileIndex === -1) {
      // Create profile if it doesn't exist
      const profile = this.create(userId);
      return this.update(userId, data);
    }

    db.userProfiles[profileIndex] = {
      ...db.userProfiles[profileIndex],
      ...data,
    };

    saveDB();
    return db.userProfiles[profileIndex];
  }

  /**
   * Update verification status
   */
  static updateVerification(
    userId: string,
    verificationType: 'email' | 'phone' | 'identity' | 'address',
    status: boolean
  ): boolean {
    const profile = this.findByUserId(userId) || this.create(userId);

    if (!profile.verifications) {
      profile.verifications = {
        email: false,
        phone: false,
        identity: false,
        address: false,
      };
    }

    profile.verifications[verificationType] = status;
    saveDB();

    return true;
  }

  /**
   * Delete profile
   */
  static delete(userId: string): boolean {
    const initialLength = db.userProfiles.length;
    db.userProfiles = db.userProfiles.filter((p: UserProfile) => p.userId !== userId);

    if (db.userProfiles.length < initialLength) {
      saveDB();
      return true;
    }

    return false;
  }
}
