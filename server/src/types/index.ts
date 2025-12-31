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
  mfaEnabled: boolean;
  mfaSecret?: string;
  accountLocked: boolean;
  loginAttempts: number;
  lastLoginAttempt?: Date;
  authProvider?: 'local' | 'google' | 'apple' | 'facebook';
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
  };
}

export interface JWTPayload {
  userId: string;
  mfaVerified?: boolean;
}
