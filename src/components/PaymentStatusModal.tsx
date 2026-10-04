import React from 'react';
import { Transaction, Language } from '../types/payment';
import { translations } from '../lib/i18n';
import { formatINR } from '../lib/upi';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RefreshCw, 
  Printer, 
  Share2, 
  ShieldCheck, 
  Copy, 
  Check,
  ArrowLeft
} from 'lucide-react';

interface PaymentStatusModalProps {
  transaction: Transaction | null;
  language: Language;
  onClose: () => void;
}

export const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
  transaction,
  language,
  onClose,
}) => {
  const t = translations[language];
  const [copiedUtr, setCopiedUtr] = React.useState(false);

  if (!transaction) return null;

  const isSuccess = transaction.status === 'SUCCESS';
  const isPending = transaction.status === 'PENDING';
  const isFailed = transaction.status === 'FAILED';
  const isRefunded = transaction.status === 'REFUNDED' || transaction.status === 'PARTIALLY_REFUNDED';

  const copyUtr = () => {
    if (transaction.upiRrn) {
      navigator.clipboard.writeText(transaction.upiRrn);
      setCopiedUtr(true);
      setTimeout(() => setCopiedUtr(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 text-white relative">
        {/* Close Cross */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          ✕
        </button>

        {/* Status Icon & Banner */}
        <div className="text-center pt-2 space-y-3">
          <div className="flex justify-center">
            {isSuccess && (
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            )}
            {isPending && (
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>
            )}
            {isFailed && (
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-500/10">
                <XCircle className="w-10 h-10" />
              </div>
            )}
            {isRefunded && (
              <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <RefreshCw className="w-10 h-10" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {isSuccess && t.paymentSuccessful}
              {isPending && t.paymentPending}
              {isFailed && t.paymentFailed}
              {isRefunded && t.paymentRefunded}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isSuccess && 'Funds successfully credited to beneficiary bank account.'}
              {isPending && 'Bank authorization pending. Status will update via webhook.'}
              {isFailed && (transaction.failureReason || 'Transaction declined by issuer bank.')}
              {isRefunded && 'Amount refunded to original payment method.'}
            </p>
          </div>

          {/* Amount Display */}
          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white py-2 tabular-nums">
            {formatINR(transaction.amount)}
          </div>
        </div>

        {/* Official Receipt Ledger Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4.5 space-y-3 text-xs">
          {transaction.upiRrn && (
            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">{t.utrNumber}</span>
              <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-semibold">
                <span>{transaction.upiRrn}</span>
                <button
                  onClick={copyUtr}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                  title="Copy UTR"
                >
                  {copiedUtr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
            <span className="text-slate-400">{t.orderRef}</span>
            <span className="font-mono text-white">{transaction.orderId}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
            <span className="text-slate-400">{t.gatewayId}</span>
            <span className="font-mono text-slate-300">{transaction.gatewayTxnId}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
            <span className="text-slate-400">{t.paidTo}</span>
            <div className="text-right">
              <div className="font-medium text-white">{transaction.payeeName}</div>
              <div className="text-[10px] font-mono text-slate-400">{transaction.payeeVpa}</div>
            </div>
          </div>

          {transaction.payerVpa && (
            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">{t.paidBy}</span>
              <span className="font-mono text-slate-300">{transaction.payerVpa}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
            <span className="text-slate-400">{t.colMethod}</span>
            <span className="font-mono text-white uppercase">{transaction.method.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">{t.paymentTime}</span>
            <span className="text-slate-300 font-mono">
              {new Date(transaction.createdAt).toLocaleString()}
            </span>
          </div>

          {transaction.refundedAmount && transaction.refundedAmount > 0 && (
            <div className="flex items-center justify-between py-1 text-purple-400 font-semibold border-t border-slate-800/80 pt-2">
              <span>Total Refunded</span>
              <span className="font-mono">{formatINR(transaction.refundedAmount)}</span>
            </div>
          )}
        </div>

        {/* Bank & NPCI Trust Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{t.verifiedByNpci}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>{t.downloadReceiptPdf}</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            <span>{t.backToDashboard}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
