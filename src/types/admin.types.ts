/**
 * Admin Dashboard Types
 * Problem-driven operational data structures
 */

// Priority levels for problem resolution
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

// Problem status
export type ProblemStatus = 'open' | 'in-progress' | 'resolved' | 'escalated';

// Risk categories
export type RiskType = 'safety' | 'trust' | 'financial' | 'operational';

// ============================================
// PROBLEM OVERVIEW (Landing Page)
// ============================================

export interface ActiveProblem {
  id: string;
  type: 'complaint' | 'payment' | 'ai-error' | 'system' | 'user' | 'provider' | 'booking';
  priority: PriorityLevel;
  riskType: RiskType;
  title: string;
  description: string;
  affectedUsers: number;
  createdAt: string;
  status: ProblemStatus;
}

export interface DashboardOverview {
  activeProblems: ActiveProblem[];
  stats: {
    openComplaints: number;
    failedPayments: number;
    aiErrors: number;
    systemIssues: number;
    suspendedUsers: number;
    suspendedProviders: number;
  };
}

// ============================================
// MODULE A - USERS (CUSTOMERS)
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'active' | 'suspended' | 'blocked';
  trustScore: number;
  joinedAt: string;
  totalBookings: number;
  totalSpent: number;
  complaints: number;
  flags: UserFlag[];
}

export interface UserFlag {
  type: 'suspicious' | 'abuse' | 'payment-issue' | 'complaint';
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface UserBookingHistory {
  id: string;
  service: string;
  provider: string;
  date: string;
  status: string;
  amount: number;
  rating?: number;
  complaint?: string;
}

export interface AdminNote {
  id: string;
  userId: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// MODULE B - PROVIDERS
// ============================================

export interface ProviderProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected' | 'banned';
  trustScore: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  services: string[];
  joinedAt: string;
  totalJobs: number;
  totalEarned: number;
  averageRating: number;
  noShowCount: number;
  complaints: number;
  warnings: ProviderWarning[];
}

export interface ProviderWarning {
  type: 'no-show' | 'bad-behavior' | 'quality' | 'safety';
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface ProviderDocument {
  type: 'id' | 'certification' | 'insurance' | 'background-check';
  status: 'pending' | 'approved' | 'rejected';
  url: string;
  uploadedAt: string;
}

// ============================================
// MODULE C - BOOKINGS & SCHEDULING
// ============================================

export interface BookingDetail {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  provider: {
    id: string;
    name: string;
    email: string;
  };
  service: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  issues: BookingIssue[];
  adminInterventions: AdminIntervention[];
}

export interface BookingIssue {
  type: 'double-booking' | 'wrong-time' | 'wrong-address' | 'cancellation' | 'interruption';
  description: string;
  reportedAt: string;
  reportedBy: 'customer' | 'provider';
}

export interface AdminIntervention {
  action: 'cancelled' | 'rescheduled' | 'provider-changed' | 'refunded' | 'override';
  reason: string;
  performedBy: string;
  performedAt: string;
}

// ============================================
// MODULE D - PAYMENTS
// ============================================

export interface PaymentRecord {
  id: string;
  bookingId: string;
  customer: string;
  provider: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: string;
  createdAt: string;
  failureReason?: string;
  refundStatus?: 'requested' | 'processing' | 'completed';
}

export interface PayoutRecord {
  id: string;
  providerId: string;
  providerName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledDate: string;
  completedDate?: string;
}

// ============================================
// MODULE E - COMPLAINTS & CONFLICTS
// ============================================

export interface Complaint {
  id: string;
  bookingId: string;
  type: 'service-quality' | 'behavior' | 'payment' | 'safety' | 'other';
  priority: PriorityLevel;
  status: ProblemStatus;
  reportedBy: {
    id: string;
    name: string;
    role: 'customer' | 'provider';
  };
  reportedAgainst: {
    id: string;
    name: string;
    role: 'customer' | 'provider';
  };
  description: string;
  evidence?: string[];
  timeline: ComplaintEvent[];
  resolution?: ComplaintResolution;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintEvent {
  type: 'created' | 'updated' | 'escalated' | 'resolved' | 'admin-note';
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface ComplaintResolution {
  decision: 'customer-favor' | 'provider-favor' | 'mutual' | 'no-action';
  actions: string[];
  compensation?: number;
  notes: string;
  resolvedBy: string;
  resolvedAt: string;
}

// ============================================
// MODULE F - AI & AUTOMATION CONTROL
// ============================================

export interface AIDecisionLog {
  id: string;
  timestamp: string;
  type: 'service-recommendation' | 'pricing' | 'provider-assignment' | 'trust-score';
  input: Record<string, any>;
  output: Record<string, any>;
  ruleTriggered: string;
  confidence: number;
  wasCorrect?: boolean;
  issue?: string;
  status: 'active' | 'overridden' | 'flagged';
}

export interface AIRule {
  id: string;
  name: string;
  type: 'matching' | 'pricing' | 'trust' | 'recommendation';
  enabled: boolean;
  config: Record<string, any>;
  successRate: number;
  lastTriggered: string;
  issueCount: number;
}

// ============================================
// MODULE G - SYSTEM & STABILITY
// ============================================

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    frontend: ServiceStatus;
    backend: ServiceStatus;
    database: ServiceStatus;
    aiService: ServiceStatus;
    payments: ServiceStatus;
  };
  lastChecked: string;
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  uptime: number;
  lastError?: string;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  service: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  userId?: string;
}

export interface MaintenanceMode {
  enabled: boolean;
  reason: string;
  estimatedEnd?: string;
  enabledBy: string;
  enabledAt: string;
}

// ============================================
// ADMIN ACTION LOGS
// ============================================

export interface AdminActionLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: {
    type: 'user' | 'provider' | 'booking' | 'payment' | 'complaint' | 'system' | 'ai-rule';
    id: string;
  };
  details: Record<string, any>;
  timestamp: string;
  ipAddress: string;
}
