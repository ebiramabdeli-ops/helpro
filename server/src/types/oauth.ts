export interface OAuthProvider {
  provider: 'google' | 'apple' | 'facebook';
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
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
