import db, { saveDB } from '../database.js';
import type { AuditLog } from '../types/index.js';

export class AuditLogModel {
  /**
   * Create audit log entry
   */
  static create(data: {
    userId: string;
    action: string;
    performedBy: string;
    details?: string;
    ipAddress?: string;
  }): AuditLog {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      timestamp: new Date(),
    };

    db.auditLogs.push(log);
    saveDB();

    return log;
  }

  /**
   * Find logs by user ID
   */
  static findByUserId(userId: string): AuditLog[] {
    return db.auditLogs.filter((log: AuditLog) => log.userId === userId);
  }

  /**
   * Find logs by action
   */
  static findByAction(action: string): AuditLog[] {
    return db.auditLogs.filter((log: AuditLog) => log.action === action);
  }

  /**
   * Get recent logs (last 100)
   */
  static getRecent(limit: number = 100): AuditLog[] {
    return db.auditLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Clean old logs (older than 2 years for GDPR compliance)
   */
  static cleanOldLogs(): void {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const initialLength = db.auditLogs.length;
    db.auditLogs = db.auditLogs.filter(
      (log: AuditLog) => new Date(log.timestamp) >= twoYearsAgo
    );

    if (db.auditLogs.length < initialLength) {
      console.log(`Cleaned ${initialLength - db.auditLogs.length} old audit logs`);
      saveDB();
    }
  }
}

// Clean old logs monthly
setInterval(() => {
  AuditLogModel.cleanOldLogs();
}, 30 * 24 * 60 * 60 * 1000);
