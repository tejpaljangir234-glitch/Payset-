/**
 * Payment System Data Models & Interfaces
 * NPCI UPI & Official Payment Gateway Specification
 */

export type Language = 'en' | 'hi';

export type UserRole = 'user' | 'admin' | 'merchant';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  vpa: string; // e.g. "rahul@paysetu"
  role: UserRole;
  balance: number; // in INR
  createdAt: string;
  avatarUrl?: string;
}

export type PaymentMethod = 'upi_intent' | 'upi_qr' | 'upi_collect' | 'card' | 'netbanking';

export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface Order {
  id: string; // e.g. "order_9832746"
  orderReference: string; // Merchant reference
  userId: string;
  amount: number; // in INR
  currency: 'INR';
  description: string;
  status: 'created' | 'attempted' | 'paid' | 'expired';
  createdAt: string;
}

export interface Transaction {
  id: string; // e.g. "pay_9823147"
  orderId: string;
  userId: string;
  amount: number;
  currency: 'INR';
  method: PaymentMethod;
  status: TransactionStatus;
  payerVpa?: string;
  payerPhone?: string;
  payeeVpa: string;
  payeeName: string;
  upiRrn?: string; // NPCI 12-digit Retrieval Reference Number (UTR)
  gatewayTxnId: string;
  signature?: string; // HMAC SHA256 signature
  failureReason?: string;
  refundedAmount?: number;
  refunds?: Refund[];
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string; // e.g. "rfnd_839213"
  transactionId: string;
  orderId: string;
  amount: number;
  currency: 'INR';
  reason: string;
  status: 'PROCESSED' | 'PENDING' | 'FAILED';
  arn: string; // Acquirer Reference Number
  createdAt: string;
}

export interface WebhookEvent {
  id: string; // e.g. "evt_827364"
  event: 'payment.captured' | 'payment.failed' | 'refund.processed' | 'order.paid';
  payload: {
    transaction?: Transaction;
    order?: Order;
    refund?: Refund;
  };
  signature: string;
  status: 'DELIVERED' | 'FAILED';
  createdAt: string;
}

export interface GatewayConfig {
  mode: 'sandbox' | 'production';
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  merchantVpa: string;
  merchantName: string;
  mcc: string; // Merchant Category Code (e.g. 6012)
}
