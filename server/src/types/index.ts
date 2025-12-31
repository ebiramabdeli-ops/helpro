export type VerificationStatus = 
  | 'UNVERIFIED_IDENTITY' 
  | 'ID_PENDING' 
  | 'ID_APPROVED' 
  | 'ID_REJECTED' 
  | 'BIOMETRIC_PENDING'
  | 'VERIFIED';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional for OAuth users
  role: 'customer' | 'helper' | 'admin';
  avatar?: string;
  phone?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  verificationStatus: VerificationStatus;
  mfaEnabled: boolean;
  mfaSecret?: string;
  accountLocked: boolean;
  loginAttempts: number;
  lastLoginAttempt?: Date;
  authProvider?: 'local' | 'google' | 'apple' | 'facebook';
  biometricConsent?: boolean;
  biometricConsentDate?: Date;
  country?: string;
  language?: string;
  gdprConsent: boolean;
  gdprConsentDate: Date;
  dataRetentionDate?: Date; // Auto-delete date if user is inactive
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSafe extends Omit<User, 'password' | 'mfaSecret'> {}

export interface PhoneVerification {
  userId: string;
  phone: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

export interface MFASetup {
  userId: string;
  secret: string;
  backupCodes: string[];
}

export interface LoginAttempt {
  email: string;
  attempts: number;
  lastAttempt: Date;
  blocked: boolean;
}

export interface Request {
  id: string;
  userId: string;
  category: string;
  title: string;
  description: string;
  location: string;
  date: string;
  price?: number;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Booking {
  id: string;
  requestId: string;
  helperId: string;
  customerId: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

export interface Database {
  users: User[];
  requests: Request[];
  bookings: Booking[];
  messages: Message[];
  phoneVerifications: PhoneVerification[];
  loginAttempts: LoginAttempt[];
  oauthAccounts: OAuthAccount[];
  emailVerifications: EmailVerification[];
  userProfiles: UserProfile[];
  identityVerifications: IdentityVerification[];
  uploadedFiles: UploadedFile[];
  auditLogs: AuditLog[];
  dataExportRequests: DataExportRequest[];
  dataDeletionRequests: DataDeletionRequest[];
}

export interface OAuthAccount {
  userId: string;
  provider: 'google' | 'apple' | 'facebook';
  providerId: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailVerification {
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
  verified: boolean;
}

export interface UserProfile {
  userId: string;
  bio?: string;
  skills?: string[];
  languages?: string[];
  location?: string;
  availability?: {
    monday?: boolean;
    tuesday?: boolean;
    wednesday?: boolean;
    thursday?: boolean;
    friday?: boolean;
    saturday?: boolean;
    sunday?: boolean;
  };
  hourlyRate?: number;
  rating?: number;
  completedJobs?: number;
  badges?: string[];
  verifications?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    address: boolean;
    biometric: boolean;
  };
}

export interface IdentityVerification {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'review';
  documents: IdentityDocument[];
  biometric?: BiometricData;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IdentityDocument {
  id: string;
  type: 'passport' | 'id_card' | 'drivers_license' | 'residence_permit';
  frontImage: string;
  backImage?: string;
  documentNumber?: string;
  expiryDate?: Date;
  country?: string;
  uploadedAt: Date;
}

export interface BiometricData {
  id: string;
  faceImage: string;
  livenessCheck: boolean;
  faceMatchScore?: number;
  capturedAt: Date;
  verified: boolean;
  consentGiven: boolean;
  processingComplete: boolean;
  dataDeletedAt?: Date; // Biometric data must be deleted after verification
  attempts: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  performedBy: string; // Admin ID
  details?: string;
  ipAddress?: string;
  timestamp: Date;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  status: 'pending' | 'processing' | 'ready' | 'expired';
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  scheduledFor: Date;
  completedAt?: Date;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  reason?: string;
}

export interface UploadedFile {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  purpose: 'identity' | 'biometric' | 'avatar' | 'other';
  uploadedAt: Date;
}

export interface JWTPayload {
  userId: string;
  mfaVerified?: boolean;
}
