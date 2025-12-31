import db, { saveDB } from '../database.js';
import type { UploadedFile } from '../types/index.js';
import fs from 'fs';
import path from 'path';

export class FileModel {
  /**
   * Save file metadata
   */
  static create(data: Omit<UploadedFile, 'id' | 'uploadedAt'>): UploadedFile {
    const file: UploadedFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      uploadedAt: new Date(),
    };

    db.uploadedFiles.push(file);
    saveDB();

    return file;
  }

  /**
   * Find file by ID
   */
  static findById(id: string): UploadedFile | undefined {
    return db.uploadedFiles.find((f: UploadedFile) => f.id === id);
  }

  /**
   * Find files by user ID
   */
  static findByUserId(userId: string, purpose?: string): UploadedFile[] {
    return db.uploadedFiles.filter(
      (f: UploadedFile) => f.userId === userId && (!purpose || f.purpose === purpose)
    );
  }

  /**
   * Delete file
   */
  static delete(id: string): boolean {
    const file = this.findById(id);
    if (!file) return false;

    // Delete physical file
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error('Failed to delete physical file:', error);
    }

    // Delete from database
    const initialLength = db.uploadedFiles.length;
    db.uploadedFiles = db.uploadedFiles.filter((f: UploadedFile) => f.id !== id);

    if (db.uploadedFiles.length < initialLength) {
      saveDB();
      return true;
    }

    return false;
  }

  /**
   * Clean old files (older than 30 days)
   */
  static cleanOldFiles(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const oldFiles = db.uploadedFiles.filter(
      (f: UploadedFile) => new Date(f.uploadedAt) < thirtyDaysAgo && f.purpose === 'other'
    );

    oldFiles.forEach((file) => {
      this.delete(file.id);
    });
  }
}

// Clean old files daily
setInterval(() => {
  FileModel.cleanOldFiles();
}, 24 * 60 * 60 * 1000);
