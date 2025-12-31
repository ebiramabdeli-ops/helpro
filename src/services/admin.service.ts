import { apiClient } from '../config/api.config';
import type {
  DashboardOverview,
  UserProfile,
  UserBookingHistory,
  AdminNote,
  ProviderProfile,
  ProviderDocument,
  BookingDetail,
  PaymentRecord,
  PayoutRecord,
  Complaint,
  AIDecisionLog,
  AIRule,
  SystemHealth,
  ErrorLog,
  MaintenanceMode,
  AdminActionLog
} from '../types/admin.types';

/**
 * Admin Service - API calls for admin operations
 * All endpoints require admin role
 * Every action is logged in backend
 */

class AdminService {
  private baseUrl = '/api/admin';

  // ============================================
  // DASHBOARD OVERVIEW
  // ============================================

  async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await apiClient.get(`${this.baseUrl}/overview`);
    return response.data;
  }

  // ============================================
  // MODULE A - USERS
  // ============================================

  async getUsers(filters?: {
    status?: string;
    search?: string;
    hasComplaints?: boolean;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get(`${this.baseUrl}/users`, { params: filters });
    return response.data;
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await apiClient.get(`${this.baseUrl}/users/${userId}`);
    return response.data;
  }

  async getUserBookings(userId: string): Promise<UserBookingHistory[]> {
    const response = await apiClient.get(`${this.baseUrl}/users/${userId}/bookings`);
    return response.data;
  }

  async suspendUser(userId: string, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/users/${userId}/suspend`, { reason });
  }

  async unsuspendUser(userId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/users/${userId}/unsuspend`);
  }

  async blockUser(userId: string, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/users/${userId}/block`, { reason });
  }

  async addUserNote(userId: string, note: string): Promise<AdminNote> {
    const response = await apiClient.post(`${this.baseUrl}/users/${userId}/notes`, { note });
    return response.data;
  }

  async triggerRefund(userId: string, bookingId: string, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/users/${userId}/refund`, { bookingId, reason });
  }

  // ============================================
  // MODULE B - PROVIDERS
  // ============================================

  async getProviders(filters?: {
    status?: string;
    search?: string;
    verificationStatus?: string;
    hasWarnings?: boolean;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get(`${this.baseUrl}/providers`, { params: filters });
    return response.data;
  }

  async getProviderProfile(providerId: string): Promise<ProviderProfile> {
    const response = await apiClient.get(`${this.baseUrl}/providers/${providerId}`);
    return response.data;
  }

  async getProviderDocuments(providerId: string): Promise<ProviderDocument[]> {
    const response = await apiClient.get(`${this.baseUrl}/providers/${providerId}/documents`);
    return response.data;
  }

  async approveProvider(providerId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/providers/${providerId}/approve`);
  }

  async rejectProvider(providerId: string, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/providers/${providerId}/reject`, { reason });
  }

  async suspendProvider(providerId: string, reason: string, duration?: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/providers/${providerId}/suspend`, { reason, duration });
  }

  async banProvider(providerId: string, reason: string, permanent: boolean): Promise<void> {
    await apiClient.post(`${this.baseUrl}/providers/${providerId}/ban`, { reason, permanent });
  }

  async addProviderWarning(providerId: string, type: string, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/providers/${providerId}/warnings`, { type, reason });
  }

  // ============================================
  // MODULE C - BOOKINGS
  // ============================================

  async getBookings(filters?: {
    status?: string;
    hasIssues?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get(`${this.baseUrl}/bookings`, { params: filters });
    return response.data;
  }

  async getBookingDetail(bookingId: string): Promise<BookingDetail> {
    const response = await apiClient.get(`${this.baseUrl}/bookings/${bookingId}`);
    return response.data;
  }

  async updateBookingStatus(bookingId: string, status: string, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/bookings/${bookingId}/status`, { status, reason });
  }

  async cancelBooking(bookingId: string, reason: string, refund: boolean): Promise<void> {
    await apiClient.post(`${this.baseUrl}/bookings/${bookingId}/cancel`, { reason, refund });
  }

  async rescheduleBooking(bookingId: string, newDate: string, newTime: string, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/bookings/${bookingId}/reschedule`, {
      newDate,
      newTime,
      reason
    });
  }

  async assignNewProvider(bookingId: string, newProviderId: string, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/bookings/${bookingId}/reassign`, {
      newProviderId,
      reason
    });
  }

  // ============================================
  // MODULE D - PAYMENTS
  // ============================================

  async getPayments(filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get(`${this.baseUrl}/payments`, { params: filters });
    return response.data;
  }

  async getPaymentDetail(paymentId: string): Promise<PaymentRecord> {
    const response = await apiClient.get(`${this.baseUrl}/payments/${paymentId}`);
    return response.data;
  }

  async triggerPaymentRefund(paymentId: string, reason: string, amount?: number): Promise<void> {
    await apiClient.post(`${this.baseUrl}/payments/${paymentId}/refund`, { reason, amount });
  }

  async markPaymentResolved(paymentId: string, notes: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/payments/${paymentId}/resolve`, { notes });
  }

  async getPayouts(filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get(`${this.baseUrl}/payouts`, { params: filters });
    return response.data;
  }

  // ============================================
  // MODULE E - COMPLAINTS
  // ============================================

  async getComplaints(filters?: {
    status?: string;
    priority?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get(`${this.baseUrl}/complaints`, { params: filters });
    return response.data;
  }

  async getComplaintDetail(complaintId: string): Promise<Complaint> {
    const response = await apiClient.get(`${this.baseUrl}/complaints/${complaintId}`);
    return response.data;
  }

  async updateComplaintStatus(complaintId: string, status: string, notes?: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/complaints/${complaintId}/status`, { status, notes });
  }

  async resolveComplaint(
    complaintId: string,
    decision: string,
    actions: string[],
    compensation?: number,
    notes?: string
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/complaints/${complaintId}/resolve`, {
      decision,
      actions,
      compensation,
      notes
    });
  }

  async escalateComplaint(complaintId: string, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/complaints/${complaintId}/escalate`, { reason });
  }

  // ============================================
  // MODULE F - AI & AUTOMATION
  // ============================================

  async getAIDecisionLogs(filters?: {
    type?: string;
    hasIssue?: boolean;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get(`${this.baseUrl}/ai/decisions`, { params: filters });
    return response.data;
  }

  async getAIDecisionDetail(decisionId: string): Promise<AIDecisionLog> {
    const response = await apiClient.get(`${this.baseUrl}/ai/decisions/${decisionId}`);
    return response.data;
  }

  async flagAIDecision(decisionId: string, issue: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/ai/decisions/${decisionId}/flag`, { issue });
  }

  async overrideAIDecision(decisionId: string, newOutput: Record<string, any>, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/ai/decisions/${decisionId}/override`, {
      newOutput,
      reason
    });
  }

  async getAIRules(type?: string) {
    const response = await apiClient.get(`${this.baseUrl}/ai/rules`, { params: { type } });
    return response.data;
  }

  async getAIRuleDetail(ruleId: string): Promise<AIRule> {
    const response = await apiClient.get(`${this.baseUrl}/ai/rules/${ruleId}`);
    return response.data;
  }

  async toggleAIRule(ruleId: string, enabled: boolean, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/ai/rules/${ruleId}/toggle`, { enabled, reason });
  }

  async updateAIRule(ruleId: string, config: Record<string, any>, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/ai/rules/${ruleId}/update`, { config, reason });
  }

  // ============================================
  // MODULE G - SYSTEM
  // ============================================

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get(`${this.baseUrl}/system/health`);
    return response.data;
  }

  async getErrorLogs(filters?: {
    service?: string;
    severity?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get(`${this.baseUrl}/system/errors`, { params: filters });
    return response.data;
  }

  async getMaintenanceMode(): Promise<MaintenanceMode> {
    const response = await apiClient.get(`${this.baseUrl}/system/maintenance`);
    return response.data;
  }

  async setMaintenanceMode(enabled: boolean, reason: string, estimatedEnd?: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/system/maintenance`, {
      enabled,
      reason,
      estimatedEnd
    });
  }

  async disableService(service: string, reason: string, duration?: number): Promise<void> {
    await apiClient.post(`${this.baseUrl}/system/services/${service}/disable`, {
      reason,
      duration
    });
  }

  // ============================================
  // ADMIN LOGS
  // ============================================

  async getAdminLogs(filters?: {
    adminId?: string;
    action?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get(`${this.baseUrl}/logs`, { params: filters });
    return response.data;
  }
}

export const adminService = new AdminService();
export default adminService;
