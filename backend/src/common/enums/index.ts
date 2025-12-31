export enum UserRole {
  CUSTOMER = 'customer',
  HELPER = 'helper',
  PRO = 'pro',
  ADMIN = 'admin',
  SUPPORT = 'support',
}

export enum UserStatus {
  PENDING = 'pending',       // Email not verified yet
  VERIFIED = 'verified',     // Email/phone verified, can use platform
  SUSPENDED = 'suspended',   // Temporarily suspended (violations)
  BANNED = 'banned',         // Permanently banned
}

export enum VerificationLevel {
  L0 = 'L0', // Email/Phone verified
  L1 = 'L1', // Identity verified (KYC)
  L2 = 'L2', // License verified (professional)
  L3 = 'L3', // Background check passed
}

export enum VerificationType {
  EMAIL = 'email',
  PHONE = 'phone',
  IDENTITY = 'identity',           // Passport, National ID
  DRIVER_LICENSE = 'driver_license',
  PROFESSIONAL_LICENSE = 'professional_license', // Electrician, Plumber, etc.
  BACKGROUND_CHECK = 'background_check',
}

export enum TaskStatus {
  CREATED = 'created',
  MATCHING = 'matching',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

export enum TaskCategory {
  CLEANING = 'cleaning',
  MOVING = 'moving',
  RECYCLING = 'recycling',
  HANDYMAN = 'handyman',
  SHOPPING = 'shopping',
  ASSEMBLY = 'assembly',
  GARDENING = 'gardening',
  DELIVERY = 'delivery',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  ESCROWED = 'escrowed',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum DisputeStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  PAYMENT_RECEIVED = 'payment_received',
  NEW_MESSAGE = 'new_message',
  REVIEW_RECEIVED = 'review_received',
  VERIFICATION_COMPLETE = 'verification_complete',
  DISPUTE_UPDATE = 'dispute_update',
}

export enum SubscriptionTier {
  BASIC = 'basic',       // FREE/€4.99 - Community mode
  PRO = 'pro',           // €14.99-24.99 - Smart matching (rule-based)
  PREMIUM = 'premium',   // €39.99-79.99 - Private AI assistant
}

export enum SubscriptionStatus {
  TRIAL = 'trial',           // 3-day free trial
  ACTIVE = 'active',         // Paid subscription
  CANCELLED = 'cancelled',   // Cancelled, active until period ends
  EXPIRED = 'expired',       // Trial/subscription ended
  SUSPENDED = 'suspended',   // Payment failed
}
