import { User, Order, Transaction, Refund, WebhookEvent, GatewayConfig, PaymentMethod, TransactionStatus } from '../types/payment';
import { generateUpiRrn } from './upi';
import { generateHmacSha256 } from './crypto';

const STORAGE_KEY_PREFIX = 'paysetu_db_';

export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  mode: 'sandbox',
  keyId: 'rzp_test_9A8x2KlmN4Pq',
  keySecret: 'sec_test_k902jkl4m90asd81234',
  webhookSecret: 'whsec_9812739120938012398',
  merchantVpa: 'paysetu.merchant@icici',
  merchantName: 'PaySetu Payments India',
  mcc: '6012',
};

const INITIAL_USERS: User[] = [
  {
    id: 'usr_customer_01',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '9876543210',
    vpa: 'rahul@paysetu',
    role: 'user',
    balance: 14850.00,
    createdAt: '2026-03-15T10:30:00Z',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
  },
  {
    id: 'usr_admin_01',
    name: 'Pooja Verma (Admin)',
    email: 'admin@paysetu.in',
    phone: '9811223344',
    vpa: 'admin@paysetu',
    role: 'admin',
    balance: 345000.00,
    createdAt: '2026-01-01T00:00:00Z',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja',
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'pay_982314781',
    orderId: 'order_892301',
    userId: 'usr_customer_01',
    amount: 1450.00,
    currency: 'INR',
    method: 'upi_intent',
    status: 'SUCCESS',
    payerVpa: 'rahul@paysetu',
    payerPhone: '9876543210',
    payeeVpa: 'swiggy.order@icici',
    payeeName: 'Swiggy Food Delivery',
    upiRrn: '412093847291',
    gatewayTxnId: 'gtw_781293041',
    signature: '6e729a1b029384acde10293847120938',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'pay_982314782',
    orderId: 'order_892302',
    userId: 'usr_customer_01',
    amount: 500.00,
    currency: 'INR',
    method: 'upi_qr',
    status: 'SUCCESS',
    payerVpa: 'rahul@paysetu',
    payerPhone: '9876543210',
    payeeVpa: 'kirana.store@paytm',
    payeeName: 'Sharma General Store',
    upiRrn: '412093847292',
    gatewayTxnId: 'gtw_781293042',
    signature: '7f830b2c130495bdef21304958231049',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'pay_982314783',
    orderId: 'order_892303',
    userId: 'usr_customer_01',
    amount: 2200.00,
    currency: 'INR',
    method: 'upi_intent',
    status: 'REFUNDED',
    payerVpa: 'rahul@paysetu',
    payeeVpa: 'airtel.broadband@axis',
    payeeName: 'Airtel Fiber Broadband',
    upiRrn: '412093847293',
    gatewayTxnId: 'gtw_781293043',
    refundedAmount: 2200.00,
    refunds: [
      {
        id: 'rfnd_839213',
        transactionId: 'pay_982314783',
        orderId: 'order_892303',
        amount: 2200.00,
        currency: 'INR',
        reason: 'Duplicate payment auto-refunded by bank',
        status: 'PROCESSED',
        arn: 'ARN_4918230912',
        createdAt: new Date(Date.now() - 3600000 * 40).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
  {
    id: 'pay_982314784',
    orderId: 'order_892304',
    userId: 'usr_customer_01',
    amount: 3500.00,
    currency: 'INR',
    method: 'card',
    status: 'FAILED',
    payerVpa: 'rahul@paysetu',
    payeeVpa: 'myntra.fashion@hdfc',
    payeeName: 'Myntra Fashion',
    gatewayTxnId: 'gtw_781293044',
    failureReason: 'Bank Server Timeout / Declined by issuing bank',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 'pay_982314785',
    orderId: 'order_892305',
    userId: 'usr_customer_01',
    amount: 150.00,
    currency: 'INR',
    method: 'upi_intent',
    status: 'PENDING',
    payerVpa: 'rahul@paysetu',
    payeeVpa: 'uber.india@yesbank',
    payeeName: 'Uber Rides India',
    gatewayTxnId: 'gtw_781293045',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

class PaymentDatabase {
  private users: User[] = [];
  private orders: Order[] = [];
  private transactions: Transaction[] = [];
  private refunds: Refund[] = [];
  private webhooks: WebhookEvent[] = [];
  private gatewayConfig: GatewayConfig = DEFAULT_GATEWAY_CONFIG;
  private currentUserId: string = 'usr_customer_01';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEY_PREFIX + 'users');
      this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;

      const storedTxns = localStorage.getItem(STORAGE_KEY_PREFIX + 'transactions');
      this.transactions = storedTxns ? JSON.parse(storedTxns) : INITIAL_TRANSACTIONS;

      const storedConfig = localStorage.getItem(STORAGE_KEY_PREFIX + 'config');
      this.gatewayConfig = storedConfig ? JSON.parse(storedConfig) : DEFAULT_GATEWAY_CONFIG;

      const storedWebhooks = localStorage.getItem(STORAGE_KEY_PREFIX + 'webhooks');
      this.webhooks = storedWebhooks ? JSON.parse(storedWebhooks) : [];

      const storedRefunds = localStorage.getItem(STORAGE_KEY_PREFIX + 'refunds');
      this.refunds = storedRefunds ? JSON.parse(storedRefunds) : [];

      const storedUser = localStorage.getItem(STORAGE_KEY_PREFIX + 'currentUser');
      if (storedUser) {
        this.currentUserId = storedUser;
      }
    } catch {
      this.users = INITIAL_USERS;
      this.transactions = INITIAL_TRANSACTIONS;
      this.gatewayConfig = DEFAULT_GATEWAY_CONFIG;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'transactions', JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'config', JSON.stringify(this.gatewayConfig));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'webhooks', JSON.stringify(this.webhooks));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'refunds', JSON.stringify(this.refunds));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'currentUser', this.currentUserId);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // --- Users & Auth ---
  public getUsers(): User[] {
    return [...this.users];
  }

  public getCurrentUser(): User {
    const user = this.users.find(u => u.id === this.currentUserId);
    return user || this.users[0];
  }

  public setCurrentUser(userId: string): User | null {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.currentUserId = user.id;
      this.saveToStorage();
      return user;
    }
    return null;
  }

  public registerUser(name: string, identifier: string, role: 'user' | 'admin' = 'user'): User {
    const isEmail = identifier.includes('@');
    const email = isEmail ? identifier : `${identifier.replace(/\D/g, '')}@paysetu.user`;
    const phone = isEmail ? '9' + Math.floor(100000000 + Math.random() * 900000000) : identifier.replace(/\D/g, '');
    const cleanHandle = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'user';
    const vpa = `${cleanHandle}${Math.floor(100 + Math.random() * 900)}@paysetu`;

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      phone,
      vpa,
      role,
      balance: 10000.00, // starting balance in sandbox
      createdAt: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    };

    this.users.unshift(newUser);
    this.currentUserId = newUser.id;
    this.saveToStorage();
    return newUser;
  }

  public updateUserBalance(userId: string, delta: number): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.balance = Math.max(0, user.balance + delta);
      this.saveToStorage();
    }
  }

  // --- Gateway Config ---
  public getGatewayConfig(): GatewayConfig {
    return { ...this.gatewayConfig };
  }

  public updateGatewayConfig(config: Partial<GatewayConfig>): GatewayConfig {
    this.gatewayConfig = { ...this.gatewayConfig, ...config };
    this.saveToStorage();
    return this.gatewayConfig;
  }

  // --- Orders & Payments ---
  public createOrder(params: {
    userId: string;
    amount: number;
    description: string;
    orderReference?: string;
  }): Order {
    const orderId = `order_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      orderReference: params.orderReference || `ORD_REF_${Date.now().toString().slice(-6)}`,
      userId: params.userId,
      amount: Number(params.amount),
      currency: 'INR',
      description: params.description || 'UPI Payment via PaySetu Gateway',
      status: 'created',
      createdAt: new Date().toISOString(),
    };
    this.orders.push(newOrder);
    return newOrder;
  }

  public async processPayment(params: {
    orderId: string;
    userId: string;
    amount: number;
    method: PaymentMethod;
    payeeVpa: string;
    payeeName: string;
    payerVpa?: string;
    statusSimulation?: 'SUCCESS' | 'PENDING' | 'FAILED';
  }): Promise<{ transaction: Transaction; signature: string }> {
    const paymentId = `pay_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const status: TransactionStatus = params.statusSimulation || 'SUCCESS';
    const upiRrn = status === 'SUCCESS' ? generateUpiRrn() : undefined;
    const gatewayTxnId = `gtw_${Date.now()}`;

    // Cryptographic signature generation matching Gateway standards
    const signature = await generateHmacSha256(
      `${params.orderId}|${paymentId}`,
      this.gatewayConfig.keySecret
    );

    const transaction: Transaction = {
      id: paymentId,
      orderId: params.orderId,
      userId: params.userId,
      amount: params.amount,
      currency: 'INR',
      method: params.method,
      status,
      payerVpa: params.payerVpa || this.getCurrentUser().vpa,
      payerPhone: this.getCurrentUser().phone,
      payeeVpa: params.payeeVpa,
      payeeName: params.payeeName,
      upiRrn,
      gatewayTxnId,
      signature,
      failureReason: status === 'FAILED' ? 'Bank Declined: Insufficient balance in linked account' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.unshift(transaction);

    // If successful, debit payer balance and credit payee if internal user
    if (status === 'SUCCESS') {
      this.updateUserBalance(params.userId, -params.amount);
      const recipient = this.users.find(u => u.vpa === params.payeeVpa);
      if (recipient) {
        this.updateUserBalance(recipient.id, params.amount);
      }
    }

    // Trigger automatic webhook event
    await this.recordWebhookEvent({
      event: status === 'SUCCESS' ? 'payment.captured' : 'payment.failed',
      payload: { transaction },
    });

    this.saveToStorage();
    return { transaction, signature };
  }

  // --- Transactions ---
  public getTransactions(filterUserId?: string): Transaction[] {
    if (filterUserId) {
      return this.transactions.filter(t => t.userId === filterUserId || t.payeeVpa === this.getCurrentUser().vpa);
    }
    return [...this.transactions];
  }

  public getTransactionById(id: string): Transaction | undefined {
    return this.transactions.find(t => t.id === id);
  }

  // --- Refunds ---
  public async issueRefund(transactionId: string, amount: number, reason: string): Promise<Refund> {
    const txn = this.transactions.find(t => t.id === transactionId);
    if (!txn) {
      throw new Error('Transaction not found');
    }
    if (txn.status !== 'SUCCESS') {
      throw new Error('Only successful transactions can be refunded');
    }

    const currentRefunded = txn.refundedAmount || 0;
    if (currentRefunded + amount > txn.amount) {
      throw new Error(`Refund amount cannot exceed remaining balance (₹${txn.amount - currentRefunded})`);
    }

    const refundId = `rfnd_${Date.now()}`;
    const refund: Refund = {
      id: refundId,
      transactionId: txn.id,
      orderId: txn.orderId,
      amount,
      currency: 'INR',
      reason,
      status: 'PROCESSED',
      arn: `ARN_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (!txn.refunds) txn.refunds = [];
    txn.refunds.push(refund);
    txn.refundedAmount = currentRefunded + amount;
    txn.status = txn.refundedAmount >= txn.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    txn.updatedAt = new Date().toISOString();

    this.refunds.unshift(refund);

    // Credit refund back to user balance
    this.updateUserBalance(txn.userId, amount);

    // Trigger refund webhook event
    await this.recordWebhookEvent({
      event: 'refund.processed',
      payload: { transaction: txn, refund },
    });

    this.saveToStorage();
    return refund;
  }

  public getRefunds(): Refund[] {
    return [...this.refunds];
  }

  // --- Webhook Logs ---
  public async recordWebhookEvent(params: {
    event: 'payment.captured' | 'payment.failed' | 'refund.processed' | 'order.paid';
    payload: { transaction?: Transaction; order?: Order; refund?: Refund };
  }): Promise<WebhookEvent> {
    const payloadStr = JSON.stringify(params.payload);
    const signature = await generateHmacSha256(payloadStr, this.gatewayConfig.webhookSecret);

    const event: WebhookEvent = {
      id: `evt_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      event: params.event,
      payload: params.payload,
      signature,
      status: 'DELIVERED',
      createdAt: new Date().toISOString(),
    };

    this.webhooks.unshift(event);
    if (this.webhooks.length > 50) this.webhooks.pop();
    this.saveToStorage();
    return event;
  }

  public getWebhooks(): WebhookEvent[] {
    return [...this.webhooks];
  }
}

export const db = new PaymentDatabase();
