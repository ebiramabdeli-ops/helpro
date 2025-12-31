import bcrypt from 'bcryptjs';
import db, { saveDB } from '../database.js';
import type { User, UserSafe } from '../types/index.js';

export class UserModel {
  /**
   * Create a new user
   */
  static async create(data: {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: 'customer' | 'helper' | 'admin';
    phone?: string;
    authProvider?: 'local' | 'google' | 'apple' | 'facebook';
    emailVerified?: boolean;
    country?: string;
    language?: string;
  }): Promise<UserSafe> {
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 12) : undefined;

    const user: User = {
      id: data.id,
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role,
      phone: data.phone,
      phoneVerified: false,
      emailVerified: data.emailVerified || false,
      verificationStatus: 'UNVERIFIED_IDENTITY',
      mfaEnabled: false,
      accountLocked: false,
      loginAttempts: 0,
      authProvider: data.authProvider || 'local',
      country: data.country,
      language: data.language,
      gdprConsent: true,
      gdprConsentDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.users.push(user);
    saveDB();

    return this.toSafe(user);
  }

  /**
   * Find user by email
   */
  static findByEmail(email: string): User | undefined {
    return db.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Find user by ID
   */
  static findById(id: string): User | undefined {
    return db.users.find((u: User) => u.id === id);
  }

  /**
   * Find user by phone
   */
  static findByPhone(phone: string): User | undefined {
    return db.users.find((u: User) => u.phone === phone);
  }

  /**
   * Verify password
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Update user
   */
  static update(id: string, data: Partial<User>): UserSafe | null {
    const userIndex = db.users.findIndex((u: User) => u.id === id);
    if (userIndex === -1) return null;

    db.users[userIndex] = {
      ...db.users[userIndex],
      ...data,
      updatedAt: new Date(),
    };

    saveDB();
    return this.toSafe(db.users[userIndex]);
  }

  /**
   * Enable MFA for user
   */
  static enableMFA(userId: string, secret: string): boolean {
    const user = this.findById(userId);
    if (!user) return false;

    this.update(userId, {
      mfaEnabled: true,
      mfaSecret: secret,
    });

    return true;
  }

  /**
   * Disable MFA for user
   */
  static disableMFA(userId: string): boolean {
    const user = this.findById(userId);
    if (!user) return false;

    this.update(userId, {
      mfaEnabled: false,
      mfaSecret: undefined,
    });

    return true;
  }

  /**
   * Verify email
   */
  static verifyEmail(userId: string): boolean {
    const user = this.findById(userId);
    if (!user) return false;

    this.update(userId, { emailVerified: true });
    return true;
  }

  /**
   * Verify phone number
   */
  static verifyPhone(userId: string): boolean {
    const user = this.findById(userId);
    if (!user) return false;

    this.update(userId, { phoneVerified: true });
    return true;
  }

  /**
   * Increment login attempts
   */
  static incrementLoginAttempts(email: string): void {
    const user = this.findByEmail(email);
    if (!user) return;

    const attempts = user.loginAttempts + 1;
    const shouldLock = attempts >= 5;

    this.update(user.id, {
      loginAttempts: attempts,
      lastLoginAttempt: new Date(),
      accountLocked: shouldLock,
    });
  }

  /**
   * Reset login attempts
   */
  static resetLoginAttempts(email: string): void {
    const user = this.findByEmail(email);
    if (!user) return;

    this.update(user.id, {
      loginAttempts: 0,
      accountLocked: false,
    });
  }

  /**
   * Check if account is locked
   */
  static isAccountLocked(email: string): boolean {
    const user = this.findByEmail(email);
    if (!user) return false;

    if (user.accountLocked && user.lastLoginAttempt) {
      const lockDuration = 15 * 60 * 1000; // 15 minutes
      const timeSinceLock = Date.now() - new Date(user.lastLoginAttempt).getTime();

      if (timeSinceLock > lockDuration) {
        // Auto-unlock after duration
        this.resetLoginAttempts(email);
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Convert user to safe object (remove sensitive fields)
   */
  static toSafe(user: User): UserSafe {
    const { password, mfaSecret, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Get all users (admin only)
   */
  static getAll(): UserSafe[] {
    return db.users.map(this.toSafe);
  }

  /**
   * Find all users (returns User[], not UserSafe[])
   */
  static findAll(): User[] {
    return db.users;
  }
}
