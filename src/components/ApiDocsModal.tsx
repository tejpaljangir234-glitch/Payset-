import React, { useState } from 'react';
import { Language } from '../types/payment';
import { translations } from '../lib/i18n';
import { Terminal, Copy, Check, ShieldCheck, Code, Globe, Key } from 'lucide-react';

interface ApiDocsModalProps {
  language: Language;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ language }) => {
  const t = translations[language];
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const createOrderCurl = `curl -X POST https://api.paysetu.in/v1/orders \\
  -u YOUR_KEY_ID:YOUR_KEY_SECRET \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "INR",
    "receipt": "ORD_REF_98124",
    "notes": {
      "customer_vpa": "rahul@paysetu",
      "description": "Order for Electronics"
    }
  }'`;

  const verifySignatureCode = `// Node.js Backend: Verify Payment Signature
const crypto = require('crypto');

function verifyPaymentSignature(orderId, paymentId, receivedSignature, secret) {
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(orderId + '|' + paymentId)
    .digest('hex');

  return generatedSignature === receivedSignature;
}

// In your Express endpoint
app.post('/api/payment/verify', (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  const isValid = verifyPaymentSignature(order_id, payment_id, signature, process.env.PAYMENT_GATEWAY_KEY_SECRET);

  if (isValid) {
    // Fulfill order in database
    res.json({ status: 'success', message: 'Payment verified' });
  } else {
    res.status(400).json({ status: 'failed', error: 'Invalid HMAC signature' });
  }
});`;

  const webhookListenerCode = `// Node.js Express Webhook Endpoint with HMAC-SHA256 validation
const express = require('express');
const crypto = require('crypto');
const app = express();

app.post('/api/webhook/payment', express.raw({ type: 'application/json' }), (req, res) => {
  const webhookSignature = req.headers['x-gateway-signature'];
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  if (expectedSignature !== webhookSignature) {
    return res.status(400).send('Invalid webhook signature');
  }

  const event = JSON.parse(req.body.toString());

  switch (event.event) {
    case 'payment.captured':
      console.log('Payment successful:', event.payload.payment.id);
      break;
    case 'payment.failed':
      console.log('Payment failed:', event.payload.payment.id);
      break;
    case 'refund.processed':
      console.log('Refund settled:', event.payload.refund.id);
      break;
  }

  // Always return 200 OK immediately to acknowledge receipt
  res.status(200).json({ status: 'ok' });
});`;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Developer API & Payment Gateway Specification
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Official REST API endpoints, NPCI UPI specifications, and HMAC SHA-256 signature verification.
            </p>
          </div>
        </div>
      </div>

      {/* Security Architecture Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Security Best Practices (Rule 16 & 18)</span>
        </h2>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
          <li>Never hardcode <code className="text-amber-400 font-mono">KEY_SECRET</code> or <code className="text-amber-400 font-mono">WEBHOOK_SECRET</code> in client-side code; use secure server environment variables.</li>
          <li>Always verify the <code className="text-emerald-400 font-mono">HMAC-SHA256</code> signature on both front-end callback and back-end webhooks before fulfilling customer orders.</li>
          <li>Ensure webhook endpoints are idempotent to gracefully handle network retries.</li>
        </ul>
      </div>

      {/* Section 1: Create Order */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold mr-2">
              POST
            </span>
            <span className="font-mono text-xs font-semibold text-white">/v1/orders</span>
            <p className="text-xs text-slate-400 mt-1">Initiates an order for UPI Intent, Dynamic QR or Checkout.</p>
          </div>
          <button
            onClick={() => copyCode(createOrderCurl, 1)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndex === 1 ? 'Copied' : 'Copy cURL'}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-950">
          <pre className="text-xs font-mono text-slate-300 overflow-x-auto">
            {createOrderCurl}
          </pre>
        </div>
      </div>

      {/* Section 2: Signature Verification */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold mr-2">
              SECURITY
            </span>
            <span className="font-mono text-xs font-semibold text-white">Payment Signature Verification</span>
            <p className="text-xs text-slate-400 mt-1">Prevents payment-tampering attacks using cryptographic HMAC.</p>
          </div>
          <button
            onClick={() => copyCode(verifySignatureCode, 2)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndex === 2 ? 'Copied' : 'Copy Node.js'}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-950">
          <pre className="text-xs font-mono text-slate-300 overflow-x-auto">
            {verifySignatureCode}
          </pre>
        </div>
      </div>

      {/* Section 3: Webhook Verification */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-semibold mr-2">
              WEBHOOK
            </span>
            <span className="font-mono text-xs font-semibold text-white">Server-to-Server Event Listener</span>
            <p className="text-xs text-slate-400 mt-1">Validates incoming bank callbacks via X-Gateway-Signature.</p>
          </div>
          <button
            onClick={() => copyCode(webhookListenerCode, 3)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndex === 3 ? 'Copied' : 'Copy Listener'}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-950">
          <pre className="text-xs font-mono text-slate-300 overflow-x-auto">
            {webhookListenerCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
