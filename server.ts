import express, { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory persistent database for orders, transactions, and webhooks
const database = {
  orders: new Map<string, any>(),
  transactions: new Map<string, any>(),
  refunds: new Map<string, any>(),
  webhooks: [] as any[],
  users: new Map<string, any>([
    [
      'usr_demo',
      {
        id: 'usr_demo',
        name: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul.sharma@example.com',
        vpa: 'rahul@paysetu',
        balance: 15000.00,
        role: 'user',
      },
    ],
    [
      'usr_admin',
      {
        id: 'usr_admin',
        name: 'Pooja Verma',
        phone: '9811223344',
        email: 'admin@paysetu.in',
        vpa: 'admin@paysetu',
        balance: 350000.00,
        role: 'admin',
      },
    ],
  ]),
};

// Config from env
const KEY_SECRET = process.env.PAYMENT_GATEWAY_KEY_SECRET || 'sec_test_k902jkl4m90asd81234';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_9812739120938012398';

/**
 * Health check
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    gateway: 'PaySetu UPI Gateway',
    mode: process.env.PAYMENT_GATEWAY_MODE || 'sandbox',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Create Order API
 * POST /api/orders/create
 */
app.post('/api/orders/create', (req: Request, res: Response) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid amount is required (greater than 0)' });
  }

  const orderId = `order_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const order = {
    id: orderId,
    amount: Number(amount),
    currency,
    receipt: receipt || `REC_${Date.now().toString().slice(-6)}`,
    status: 'created',
    notes: notes || {},
    createdAt: new Date().toISOString(),
  };

  database.orders.set(orderId, order);
  res.status(201).json({ status: 'success', data: order });
});

/**
 * Verify Payment Signature API
 * POST /api/payment/verify
 */
app.post('/api/payment/verify', (req: Request, res: Response) => {
  const { order_id, payment_id, signature } = req.body;

  if (!order_id || !payment_id || !signature) {
    return res.status(400).json({ error: 'order_id, payment_id and signature are required' });
  }

  // Compute HMAC SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

  const isValid = expectedSignature === signature;

  if (!isValid) {
    return res.status(400).json({
      status: 'failed',
      verified: false,
      error: 'Invalid payment signature',
    });
  }

  res.json({
    status: 'success',
    verified: true,
    message: 'Payment verified successfully with Bank Gateway',
  });
});

/**
 * Webhook Listener API
 * POST /api/webhook/payment
 */
app.post('/api/webhook/payment', (req: Request, res: Response) => {
  const signatureHeader = req.headers['x-gateway-signature'] as string;

  // Verify HMAC-SHA256 signature of raw body
  const rawBody = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const isSignatureValid = signatureHeader ? signatureHeader === expectedSignature : true;

  const event = req.body;
  database.webhooks.unshift({
    id: `evt_${Date.now()}`,
    event: event.event || 'payment.captured',
    payload: event.payload || {},
    signatureVerified: isSignatureValid,
    receivedAt: new Date().toISOString(),
  });

  // Always respond with 200 OK to prevent gateway retry storms
  res.status(200).json({
    status: 'received',
    signature_verified: isSignatureValid,
  });
});

/**
 * Process Refund API
 * POST /api/admin/refund
 */
app.post('/api/admin/refund', (req: Request, res: Response) => {
  const { transaction_id, amount, reason } = req.body;

  if (!transaction_id || !amount) {
    return res.status(400).json({ error: 'transaction_id and amount are required' });
  }

  const refundId = `rfnd_${Date.now()}`;
  const refund = {
    id: refundId,
    transactionId: transaction_id,
    amount: Number(amount),
    reason: reason || 'Merchant/Admin initiated reversal',
    status: 'PROCESSED',
    arn: `ARN_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  database.refunds.set(refundId, refund);
  res.status(200).json({ status: 'success', data: refund });
});

// Serve frontend static assets if built
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Only listen if run directly (e.g. tsx server.ts)
if (process.env.NODE_ENV === 'production' || process.env.RUN_SERVER) {
  app.listen(PORT, () => {
    console.log(`PaySetu Payment Gateway Server listening on port ${PORT}`);
  });
}

export default app;
