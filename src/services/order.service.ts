/**
 * Order Service (Bookings)
 * Service booking and management
 */

import { api } from './api-client';
import { endpoints } from '../config/api.config';

export interface CreateOrderRequest {
  serviceCategory: string;
  description: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  scheduledDate: string;
  estimatedHours: number;
  budget?: number;
}

export interface Order {
  id: string;
  customerId: string;
  helperId?: string;
  serviceCategory: string;
  description: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  scheduledDate: string;
  estimatedHours: number;
  budget: number;
  finalPrice?: number;
  status: 'PENDING' | 'MATCHED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

/**
 * Order Service
 */
export class OrderService {
  /**
   * Create new booking
   */
  static async createOrder(data: CreateOrderRequest): Promise<Order> {
    try {
      return await api.post<Order>(endpoints.orders.create, data);
    } catch (error) {
      console.error('Create order failed:', error);
      throw error;
    }
  }

  /**
   * Get user's orders
   */
  static async getOrders(params?: {
    status?: string;
    role?: 'customer' | 'helper';
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    try {
      return await api.get(endpoints.orders.list, params);
    } catch (error) {
      console.error('Get orders failed:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  static async getOrder(id: string): Promise<Order> {
    try {
      return await api.get<Order>(endpoints.orders.detail(id));
    } catch (error) {
      console.error('Get order failed:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(id: string, reason?: string): Promise<void> {
    try {
      await api.post(endpoints.orders.cancel(id), { reason });
    } catch (error) {
      console.error('Cancel order failed:', error);
      throw error;
    }
  }

  /**
   * Complete order
   */
  static async completeOrder(id: string): Promise<void> {
    try {
      await api.post(endpoints.orders.complete(id));
    } catch (error) {
      console.error('Complete order failed:', error);
      throw error;
    }
  }
}

/**
 * React Hook for Orders
 */
export function useOrders() {
  const createOrder = async (data: CreateOrderRequest) => {
    return OrderService.createOrder(data);
  };

  const getOrders = async (params?: any) => {
    return OrderService.getOrders(params);
  };

  const getOrder = async (id: string) => {
    return OrderService.getOrder(id);
  };

  const cancelOrder = async (id: string, reason?: string) => {
    return OrderService.cancelOrder(id, reason);
  };

  const completeOrder = async (id: string) => {
    return OrderService.completeOrder(id);
  };

  return {
    createOrder,
    getOrders,
    getOrder,
    cancelOrder,
    completeOrder,
  };
}
