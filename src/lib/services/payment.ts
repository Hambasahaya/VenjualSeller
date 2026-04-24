/**
 * Payment Service
 * Handles: payment creation, payment retrieval
 */

import { apiCall } from "./api";

export interface PaymentItem {
  name: string;
  quantity: number;
  price: number;
}

export interface CreatePaymentRequest {
  merchant_id: string;
  order_id: string;
  amount: number;
  currency?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  items?: PaymentItem[];
  callback_url?: string;
}

export interface Payment {
  id: string;
  merchant_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  payment_url: string;
  doku_transaction_id?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new payment transaction
 */
export async function createPayment(
  data: CreatePaymentRequest
): Promise<Payment> {
  return apiCall<Payment>("/api/v1/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get payment details by transaction ID
 */
export async function getPayment(paymentId: string): Promise<Payment> {
  return apiCall<Payment>(`/api/v1/payments/${paymentId}`, {
    method: "GET",
  });
}
