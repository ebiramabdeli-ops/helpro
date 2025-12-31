/**
 * Payment Service
 * Stripe payment integration
 */

import { api } from './api-client';
import { endpoints } from '../config/api.config';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

/**
 * Initialize Stripe
 */
export function initializeStripe(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

export interface CreatePaymentIntentRequest {
  orderId: string;
  amount: number;
  currency?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  stripePaymentIntentId: string;
  createdAt: string;
}

/**
 * Payment Service
 */
export class PaymentService {
  /**
   * Create payment intent
   */
  static async createPaymentIntent(
    request: CreatePaymentIntentRequest
  ): Promise<PaymentIntentResponse> {
    try {
      return await api.post<PaymentIntentResponse>(
        endpoints.payments.createIntent,
        request
      );
    } catch (error) {
      console.error('Create payment intent failed:', error);
      throw error;
    }
  }

  /**
   * Confirm payment
   */
  static async confirmPayment(paymentIntentId: string): Promise<void> {
    try {
      await api.post(endpoints.payments.confirm, { paymentIntentId });
    } catch (error) {
      console.error('Confirm payment failed:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(): Promise<Payment[]> {
    try {
      return await api.get<Payment[]>(endpoints.payments.history);
    } catch (error) {
      console.error('Get payment history failed:', error);
      throw error;
    }
  }

  /**
   * Process Stripe payment
   */
  static async processStripePayment(
    stripe: Stripe,
    elements: StripeElements,
    clientSecret: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        return { success: true };
      }

      return {
        success: false,
        error: 'Payment was not successful',
      };
    } catch (error) {
      console.error('Stripe payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * React Hook for Payments
 */
export function usePayments() {
  const createPaymentIntent = async (request: CreatePaymentIntentRequest) => {
    return PaymentService.createPaymentIntent(request);
  };

  const confirmPayment = async (paymentIntentId: string) => {
    return PaymentService.confirmPayment(paymentIntentId);
  };

  const getPaymentHistory = async () => {
    return PaymentService.getPaymentHistory();
  };

  return {
    createPaymentIntent,
    confirmPayment,
    getPaymentHistory,
  };
}
