import React, { useState } from 'react';
import { User, Transaction, Language } from '../types/payment';
import { translations } from '../lib/i18n';
import { formatINR } from '../lib/upi';
import { SpendingTrendsChart } from './SpendingTrendsChart';
import { 
  Send, 
  QrCode, 
  PlusCircle, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  CreditCard, 
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';

interface DashboardProps {
  user: User;
  transactions: Transaction[];
  language: Language;
  onSendMoney: () => void;
  onReceiveMoney: () => void;
  onViewAllTransactions: () => void;
  onSelectTransaction: (txn: Transaction) => void;
  onAddMoney: (amount: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  transactions,
  language,
  onSendMoney,
  onReceiveMoney,
  onViewAllTransactions,
  onSelectTransaction,
  onAddMoney,
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('1000');

  const copyVpa = () => {
    navigator.clipboard.writeText(user.vpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Metrics calculation
  const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
  const successfulTxns = transactions.filter(t => t.status === 'SUCCESS');
  const successRate = transactions.length > 0 
    ? ((successfulTxns.length / transactions.length) * 100).toFixed(1) 
    : '100';

  const recentTxns = transactions.slice(0, 5);

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount);
    if (!isNaN(val) && val > 0) {
      onAddMoney(val);
      setShowAddMoneyModal(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Banner & Top Profile summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
              alt={user.name}
              className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {user.name}
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {user.role === 'admin' ? t.roleAdmin : t.roleUser}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span className="font-mono text-emerald-400 font-semibold">{user.vpa}</span>
              <button
                onClick={copyVpa}
                className="p-1 hover:text-white rounded transition-colors text-slate-500 hover:bg-slate-800 cursor-pointer"
                title="Copy UPI VPA"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span aria-hidden="true">·</span>
              <span>+91 {user.phone}</span>
            </div>
          </div>
        </div>

        {/* Quick VPA share badge */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              {t.myVpa}
            </div>
            <div className="text-sm font-mono text-white font-medium">
              {user.vpa}
            </div>
          </div>
          <button
            onClick={copyVpa}
            className="ml-3 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Balance Card & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Wallet / Account Balance Card */}
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t.availableBalance}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                NPCI Active
              </span>
            </div>
            <div className="mt-2 text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono tabular-nums">
              {formatINR(user.balance)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Linked Account: State Bank of India (SBI) · Account ending in •••• 4092
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onSendMoney}
              className="flex-1 min-w-[140px] px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{t.sendMoney}</span>
            </button>

            <button
              onClick={onReceiveMoney}
              className="flex-1 min-w-[140px] px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>{t.receiveMoney}</span>
            </button>

            <button
              onClick={() => setShowAddMoneyModal(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              title="Add money to test wallet"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">{t.addMoney}</span>
            </button>
          </div>
        </div>

        {/* Security & System Status Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>{t.securityBadgeTitle}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              {t.securityBadgeDesc}
            </p>
          </div>

          <div className="mt-6 space-y-3 pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">UPI Protocol</span>
              <span className="font-mono text-white font-medium">NPCI UPI 2.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Webhook Verification</span>
              <span className="font-mono text-emerald-400 font-medium">HMAC SHA-256</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Idempotency Guarantee</span>
              <span className="font-mono text-white font-medium">Enabled (Active)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t.monthlyVolume}
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {formatINR(totalVolume)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Audit verified across all channels
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t.successRate}
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {successRate}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {successfulTxns.length} of {transactions.length} payments settled
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t.totalTransactions}
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {transactions.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Includes UPI, QR & Refunds
          </div>
        </div>
      </div>

      {/* Spending Trends Data Visualization (Recharts) */}
      <SpendingTrendsChart
        transactions={transactions}
        currentUserId={user.id}
        currentUserVpa={user.vpa}
        language={language}
      />

      {/* Recent Transactions Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{t.recentActivity}</h2>
            <p className="text-xs text-slate-400">Real-time status updates</p>
          </div>
          <button
            onClick={onViewAllTransactions}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{t.viewAll}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTxns.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            {t.noTransactionsYet}
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentTxns.map((txn) => {
              const isOutgoing = txn.userId === user.id && txn.payerVpa === user.vpa;
              const isSuccess = txn.status === 'SUCCESS';
              const isPending = txn.status === 'PENDING';
              const isRefunded = txn.status === 'REFUNDED' || txn.status === 'PARTIALLY_REFUNDED';

              return (
                <div
                  key={txn.id}
                  onClick={() => onSelectTransaction(txn)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isRefunded
                        ? 'bg-purple-900/30 text-purple-400'
                        : isSuccess 
                          ? (isOutgoing ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-900/30 text-emerald-400')
                          : isPending
                            ? 'bg-amber-900/30 text-amber-400'
                            : 'bg-red-900/30 text-red-400'
                    }`}>
                      {isRefunded ? (
                        <RefreshCw className="w-5 h-5" />
                      ) : isSuccess ? (
                        isOutgoing ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />
                      ) : isPending ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-white">
                        {isOutgoing ? txn.payeeName : (txn.payerVpa || 'Customer')}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono">{txn.method === 'upi_qr' ? 'UPI QR' : 'UPI Intent'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {txn.upiRrn ? `UTR: ${txn.upiRrn}` : txn.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-base font-bold font-mono tabular-nums ${
                      isRefunded 
                        ? 'text-purple-400' 
                        : isSuccess 
                          ? (isOutgoing ? 'text-white' : 'text-emerald-400')
                          : 'text-slate-400'
                    }`}>
                      {isOutgoing && isSuccess ? '-' : '+'}{formatINR(txn.amount)}
                    </div>
                    <div className="mt-0.5">
                      <span className={`text-[11px] font-semibold ${
                        isSuccess 
                          ? 'text-emerald-400' 
                          : isPending 
                            ? 'text-amber-400' 
                            : isRefunded 
                              ? 'text-purple-400' 
                              : 'text-red-400'
                      }`}>
                        {txn.status === 'SUCCESS' ? t.statusSuccess
                          : txn.status === 'PENDING' ? t.statusPending
                          : txn.status === 'REFUNDED' ? t.statusRefunded
                          : txn.status === 'PARTIALLY_REFUNDED' ? t.statusPartiallyRefunded
                          : t.statusFailed}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>{t.addMoney}</span>
              </h3>
              <button
                onClick={() => setShowAddMoneyModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t.amountInr}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-mono text-lg font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xl font-bold focus:outline-none focus:border-blue-500"
                    placeholder="1000"
                    required
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex items-center gap-2">
                {['500', '1000', '2000', '5000'].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setDepositAmount(amt)}
                    className="flex-1 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(false)}
                  className="flex-1 py-2.5 text-xs font-medium text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {t.close}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-medium text-white rounded-xl bg-blue-600 hover:bg-blue-500 shadow-md transition-colors cursor-pointer"
                >
                  Deposit to Sandbox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
