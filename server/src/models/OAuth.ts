import db, { saveDB } from '../database.js';
import type { OAuthAccount } from '../types/index.js';

export class OAuthModel {
  /**
   * Create OAuth account link
   */
  static create(data: {
    userId: string;
    provider: 'google' | 'apple' | 'facebook';
    providerId: string;
    email: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  }): OAuthAccount {
    const account: OAuthAccount = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.oauthAccounts.push(account);
    saveDB();

    return account;
  }

  /**
   * Find OAuth account by provider and provider ID
   */
  static findByProvider(
    provider: string,
    providerId: string
  ): OAuthAccount | undefined {
    return db.oauthAccounts.find(
      (a: OAuthAccount) => a.provider === provider && a.providerId === providerId
    );
  }

  /**
   * Find all OAuth accounts for a user
   */
  static findByUserId(userId: string): OAuthAccount[] {
    return db.oauthAccounts.filter((a: OAuthAccount) => a.userId === userId);
  }

  /**
   * Update OAuth tokens
   */
  static updateTokens(
    userId: string,
    provider: string,
    tokens: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: Date;
    }
  ): boolean {
    const accountIndex = db.oauthAccounts.findIndex(
      (a: OAuthAccount) => a.userId === userId && a.provider === provider
    );

    if (accountIndex === -1) return false;

    db.oauthAccounts[accountIndex] = {
      ...db.oauthAccounts[accountIndex],
      ...tokens,
      updatedAt: new Date(),
    };

    saveDB();
    return true;
  }

  /**
   * Delete OAuth account
   */
  static delete(userId: string, provider: string): boolean {
    const initialLength = db.oauthAccounts.length;
    db.oauthAccounts = db.oauthAccounts.filter(
      (a: OAuthAccount) => !(a.userId === userId && a.provider === provider)
    );

    if (db.oauthAccounts.length < initialLength) {
      saveDB();
      return true;
    }

    return false;
  }
}
