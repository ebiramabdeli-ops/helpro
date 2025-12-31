import { APIClient } from './api-client';
import { config } from '../config/api.config';

/**
 * ADMIN API SERVICE
 *
 * Handles all admin-specific API calls.
 *
 * CRITICAL:
 * - All endpoints require admin token
 * - Backend validates role for every request
 * - 403 Forbidden if not admin
 *
 * DEVELOPER B: Backend implements admin routes
 * DEVELOPER A: Frontend uses this service
 */

class AdminAPIService extends APIClient {
  constructor() {
    super(config.api.baseUrl, config.api.timeout);
  }

  // Override to add /admin prefix
  private async adminRequest<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const fullEndpoint = `/admin${endpoint}`;
    return this.request<T>(fullEndpoint, {
      method,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // ============================================
  // SYSTEM / DASHBOARD
  // ============================================

  async getSystemStats() {
    return this.adminRequest('GET', '/stats');
  }

  async getSystemHealth() {
    return this.adminRequest('GET', '/health');
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  async getAllUsers(filters?: {
    status?: string;
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.adminRequest('GET', `/users?${params}`);
  }

  async getUser(userId: string) {
    return this.adminRequest('GET', `/users/${userId}`);
  }

  async banUser(userId: string, reason: string) {
    return this.adminRequest('POST', `/users/${userId}/ban`, { reason });
  }

  async unbanUser(userId: string) {
    return this.adminRequest('POST', `/users/${userId}/unban`, {});
  }

  async updateUserTrustScore(userId: string, adjustment: number, reason: string) {
    return this.adminRequest('POST', `/users/${userId}/trust-score`, {
      adjustment,
      reason,
    });
  }

  // ============================================
  // ORDER MANAGEMENT
  // ============================================

  async getAllOrders(filters?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.adminRequest('GET', `/orders?${params}`);
  }

  async getOrder(orderId: string) {
    return this.adminRequest('GET', `/orders/${orderId}`);
  }

  async cancelOrder(orderId: string, reason: string) {
    return this.adminRequest('POST', `/orders/${orderId}/cancel`, { reason });
  }

  async assignHelper(orderId: string, helperId: string) {
    return this.adminRequest('POST', `/orders/${orderId}/assign`, { helperId });
  }

  // ============================================
  // PAYMENT MANAGEMENT
  // ============================================

  async getAllPayments(filters?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.adminRequest('GET', `/payments?${params}`);
  }

  async getPayment(paymentId: string) {
    return this.adminRequest('GET', `/payments/${paymentId}`);
  }

  async refundPayment(paymentId: string, amount: number, reason: string) {
    return this.adminRequest('POST', `/payments/${paymentId}/refund`, {
      amount,
      reason,
    });
  }

  async releaseEscrow(paymentId: string) {
    return this.adminRequest('POST', `/payments/${paymentId}/release`, {});
  }

  // ============================================
  // COMPLAINT MANAGEMENT
  // ============================================

  async getAllComplaints(filters?: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.adminRequest('GET', `/complaints?${params}`);
  }

  async getComplaint(complaintId: string) {
    return this.adminRequest('GET', `/complaints/${complaintId}`);
  }

  async resolveComplaint(complaintId: string, resolution: string) {
    return this.adminRequest('POST', `/complaints/${complaintId}/resolve`, {
      resolution,
    });
  }

  async escalateComplaint(complaintId: string) {
    return this.adminRequest('POST', `/complaints/${complaintId}/escalate`, {});
  }

  // ============================================
  // AI SYSTEM
  // ============================================

  async getAIStats() {
    return this.adminRequest('GET', '/ai/stats');
  }

  async getAIDecisionLogs(filters?: {
    fromDate?: string;
    toDate?: string;
    intent?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.adminRequest('GET', `/ai/decisions?${params}`);
  }

  async overrideAIDecision(decisionId: string, newAction: string, reason: string) {
    return this.adminRequest('POST', `/ai/decisions/${decisionId}/override`, {
      newAction,
      reason,
    });
  }

  async retrainAI(language: string) {
    return this.adminRequest('POST', '/ai/retrain', { language });
  }

  // ============================================
  // ADMIN ACTIONS LOG
  // ============================================

  async getAdminActionLogs(filters?: {
    adminId?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.adminRequest('GET', `/logs/actions?${params}`);
  }
}

export const adminApi = new AdminAPIService();
