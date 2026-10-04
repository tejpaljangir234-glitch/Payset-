import React, { useState } from 'react';
import { User, Transaction, Refund, WebhookEvent, GatewayConfig, Language } from '../types/payment';
import { translations } from '../lib/i18n';
import { formatINR } from '../lib/upi';
import { db } from '../lib/storage';
import { 
  SlidersHorizontal, 
  BarChart3, 
  Receipt, 
  Users, 
  RefreshCcw, 
  Webhook, 
  Settings, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Play, 
  Key, 
  Check, 
  Lock,
  ChevronRight
} from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  transactions: Transaction[];
  refunds: Refund[];
  webhooks: WebhookEvent[];
  gatewayConfig: GatewayConfig;
  language: Language;
  onRefreshData: () => void;
  onSelectTransaction: (txn: Transaction) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  transactions,
  refunds,
  webhooks,
  gatewayConfig,
  language,
  onRefreshData,
  onSelectTransaction,
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'users' | 'refunds' | 'webhooks' | 'settings'>('overview');

  // Refund Modal State
  const [selectedTxnForRefund, setSelectedTxnForRefund] = useState<Transaction | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('Customer requested refund / duplicate charge');
  const [isProcessingRefund, setIsProcessingRefund] = useState<boolean>(false);
  const [refundMessage, setRefundMessage] = useState<string | null>(null);

  // Gateway Settings State
  const [mode, setMode] = useState<'sandbox' | 'production'>(gatewayConfig.mode);
  const [keyId, setKeyId] = useState(gatewayConfig.keyId);
  const [keySecret, setKeySecret] = useState(gatewayConfig.keySecret);
  const [webhookSecret, setWebhookSecret] = useState(gatewayConfig.webhookSecret);
  const [merchantVpa, setMerchantVpa] = useState(gatewayConfig.merchantVpa);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Search filter
  const [searchTxn, setSearchTxn] = useState('');

  // Overview metrics
  const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalRefunded = transactions.reduce((acc, t) => acc + (t.refundedAmount || 0), 0);
  const successfulTxns = transactions.filter(t => t.status === 'SUCCESS');
  const successRate = transactions.length > 0 
    ? ((successfulTxns.length / transactions.length) * 100).toFixed(1) 
    : '100';

  const handleOpenRefund = (txn: Transaction) => {
    setSelectedTxnForRefund(txn);
    const remaining = txn.amount - (txn.refundedAmount || 0);
    setRefundAmount(remaining.toString());
    setRefundMessage(null);
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxnForRefund) return;

    const amt = parseFloat(refundAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid refund amount');
      return;
    }

    setIsProcessingRefund(true);
    try {
      await db.issueRefund(selectedTxnForRefund.id, amt, refundReason);
      setIsProcessingRefund(false);
      setRefundMessage(t.refundSuccessMsg);
      onRefreshData();
      setTimeout(() => {
        setSelectedTxnForRefund(null);
        setRefundMessage(null);
      }, 1500);
    } catch (err) {
      setIsProcessingRefund(false);
      alert(`Refund failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateGatewayConfig({
      mode,
      keyId,
      keySecret,
      webhookSecret,
      merchantVpa,
    });
    setSettingsSaved(true);
    onRefreshData();
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleTriggerSimulatedWebhook = async () => {
    const randomTxn = transactions[0];
    await db.recordWebhookEvent({
      event: 'payment.captured',
      payload: { transaction: randomTxn },
    });
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.adminTitle}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-semibold">
              Admin Role Required
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t.adminDesc}
          </p>
        </div>

        {/* Environment status banner */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">Active Mode:</span>
            <span className="font-mono text-white font-semibold uppercase">{gatewayConfig.mode}</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
        {[
          { id: 'overview', label: t.tabOverview, icon: BarChart3 },
          { id: 'transactions', label: t.tabTransactions, icon: Receipt },
          { id: 'users', label: t.tabUsers, icon: Users },
          { id: 'refunds', label: t.tabRefunds, icon: RefreshCcw },
          { id: 'webhooks', label: t.tabWebhooks, icon: Webhook },
          { id: 'settings', label: t.tabSettings, icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Financial Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.totalPlatformVolume}
              </span>
              <div className="mt-2 text-2xl font-black text-white font-mono tabular-nums">
                {formatINR(totalVolume)}
              </div>
              <div className="mt-1 text-xs text-slate-500">Gross across all merchants</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.successRate}
              </span>
              <div className="mt-2 text-2xl font-black text-emerald-400 font-mono tabular-nums">
                {successRate}%
              </div>
              <div className="mt-1 text-xs text-slate-500">NPCI UPI Gateway health normal</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.activeUsersCount}
              </span>
              <div className="mt-2 text-2xl font-black text-white font-mono tabular-nums">
                {users.length}
              </div>
              <div className="mt-1 text-xs text-slate-500">Registered VPAs & Accounts</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.totalRefundsCount}
              </span>
              <div className="mt-2 text-2xl font-black text-purple-400 font-mono tabular-nums">
                {formatINR(totalRefunded)}
              </div>
              <div className="mt-1 text-xs text-slate-500">{refunds.length} successful reversals</div>
            </div>
          </div>

          {/* Quick status checks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Gateway Health & Compliance Invariants
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">NPCI UPI 2.0 Specs</div>
                  <div className="text-slate-400 mt-0.5">Compliant `upi://pay` URI & RRN generation</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Webhook Signature (HMAC)</div>
                  <div className="text-slate-400 mt-0.5">SHA-256 cryptographic verification active</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Idempotency & Reversals</div>
                  <div className="text-slate-400 mt-0.5">Double-spend and duplicate debit protection</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: All Transactions (with Refund Action) */}
      {activeTab === 'transactions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTxn}
                onChange={(e) => setSearchTxn(e.target.value)}
                placeholder="Search transactions across all users..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              Total {transactions.length} records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Txn ID / UTR</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payer</th>
                  <th className="py-3 px-4">Payee</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions
                  .filter(t => !searchTxn || t.id.includes(searchTxn) || t.payeeVpa.includes(searchTxn) || (t.payerVpa && t.payerVpa.includes(searchTxn)))
                  .map((txn) => {
                    const isSuccess = txn.status === 'SUCCESS';
                    const isRefunded = txn.status === 'REFUNDED' || txn.status === 'PARTIALLY_REFUNDED';
                    return (
                      <tr key={txn.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => onSelectTransaction(txn)}
                            className="font-mono text-white font-semibold hover:text-blue-400 cursor-pointer"
                          >
                            {txn.id}
                          </button>
                          {txn.upiRrn && <div className="font-mono text-[10px] text-slate-500">{txn.upiRrn}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono">
                          {txn.payerVpa || 'Anonymous'}
                        </td>
                        <td className="py-3 px-4 text-white font-mono">
                          {txn.payeeVpa}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                          {formatINR(txn.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] font-semibold ${
                            isSuccess ? 'text-emerald-400' 
                            : txn.status === 'PENDING' ? 'text-amber-400'
                            : isRefunded ? 'text-purple-400'
                            : 'text-red-400'
                          }`}>
                            {txn.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isSuccess && (
                            <button
                              onClick={() => handleOpenRefund(txn)}
                              className="px-2.5 py-1 text-[11px] font-medium text-purple-400 hover:text-white hover:bg-purple-600 rounded-lg border border-purple-500/40 transition-colors cursor-pointer"
                            >
                              {t.issueRefund}
                            </button>
                          )}
                          {isRefunded && (
                            <span className="text-[11px] text-purple-400 font-mono">Reversed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Registered Users */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Registered Users & Merchants</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">UPI VPA</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Wallet Balance</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-7 h-7 rounded-full bg-slate-800"
                      />
                      <div>
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                        u.role === 'admin' ? 'bg-purple-900/60 text-purple-300' : 'bg-blue-900/60 text-blue-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-medium">
                      {u.vpa}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      +91 {u.phone}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                      {formatINR(u.balance)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Refunds Management */}
      {activeTab === 'refunds' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Payment Refund Logs & Settlement</h3>
          </div>
          {refunds.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No refunds processed yet. You can issue refunds from the "All Transactions" tab.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Refund ID</th>
                    <th className="py-3 px-4">Txn ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Bank ARN</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Processed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {refunds.map((rf) => (
                    <tr key={rf.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-purple-400 font-semibold">{rf.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{rf.transactionId}</td>
                      <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">{formatINR(rf.amount)}</td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{rf.reason}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{rf.arn}</td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-semibold">{rf.status}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{new Date(rf.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Webhook Events Inspector */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Webhook className="w-5 h-5 text-blue-400" />
                <span>Gateway Webhooks Audit Stream</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {t.webhookDesc}
              </p>
            </div>
            <button
              onClick={handleTriggerSimulatedWebhook}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Inbound Event</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-800">
            {webhooks.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No webhook events logged yet. Make a payment or click "Simulate Inbound Event" above.
              </div>
            ) : (
              webhooks.map((evt) => (
                <div key={evt.id} className="p-4 space-y-2 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-400">{evt.event}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-400 text-[11px]">{evt.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {evt.status}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(evt.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500">X-Gateway-Signature (HMAC-SHA256): </span>
                    <span className="text-emerald-400">{evt.signature}</span>
                  </div>

                  <details className="text-xs text-slate-400 cursor-pointer">
                    <summary className="hover:text-white font-medium">View JSON Payload</summary>
                    <pre className="mt-2 p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
                      {JSON.stringify(evt.payload, null, 2)}
                    </pre>
                  </details>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: Gateway Settings (Sandbox / Production) */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Official Payment Gateway & Environment Config</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure credentials for Razorpay, Cashfree, or PhonePe PG API. Keys are stored safely in runtime environment.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Mode Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {t.gatewayMode}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('sandbox')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    mode === 'sandbox'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {t.sandboxMode}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('production')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    mode === 'production'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {t.productionMode}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.apiKeyId}
              </label>
              <input
                type="text"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.apiKeySecret}
              </label>
              <input
                type="password"
                value={keySecret}
                onChange={(e) => setKeySecret(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.webhookSecret}
              </label>
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.merchantUpiVpa}
              </label>
              <input
                type="text"
                value={merchantVpa}
                onChange={(e) => setMerchantVpa(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {settingsSaved && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{t.settingsSaved}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {t.saveSettings}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Process Refund Modal */}
      {selectedTxnForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 text-purple-400" />
                <span>{t.issueRefund}</span>
              </h3>
              <button
                onClick={() => setSelectedTxnForRefund(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">Transaction ID: <span className="font-mono text-white">{selectedTxnForRefund.id}</span></div>
              <div className="text-slate-400">Original Amount: <span className="font-mono font-bold text-white">{formatINR(selectedTxnForRefund.amount)}</span></div>
              <div className="text-slate-400">Payer UPI VPA: <span className="font-mono text-emerald-400">{selectedTxnForRefund.payerVpa}</span></div>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.refundAmount}
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedTxnForRefund.amount - (selectedTxnForRefund.refundedAmount || 0)}
                  step="any"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.refundReason}
                </label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  placeholder={t.reasonPlaceholder}
                  required
                />
              </div>

              {refundMessage && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{refundMessage}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTxnForRefund(null)}
                  className="flex-1 py-2.5 text-xs text-slate-400 hover:text-white rounded-xl bg-slate-800 transition-colors cursor-pointer"
                >
                  {t.close}
                </button>

                <button
                  type="submit"
                  disabled={isProcessingRefund}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {isProcessingRefund ? 'Processing...' : t.confirmRefund}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
