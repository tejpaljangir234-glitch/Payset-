import React, { useState } from 'react';
import { Transaction, Language, TransactionStatus } from '../types/payment';
import { translations } from '../lib/i18n';
import { formatINR } from '../lib/upi';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Download,
  Calendar
} from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  currentUserId: string;
  currentUserVpa: string;
  language: Language;
  onSelectTransaction: (txn: Transaction) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  currentUserId,
  currentUserVpa,
  language,
  onSelectTransaction,
}) => {
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Filter transactions
  const filtered = transactions.filter((txn) => {
    // Search
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      txn.id.toLowerCase().includes(q) ||
      txn.orderId.toLowerCase().includes(q) ||
      (txn.upiRrn && txn.upiRrn.toLowerCase().includes(q)) ||
      txn.payeeVpa.toLowerCase().includes(q) ||
      txn.payeeName.toLowerCase().includes(q) ||
      (txn.payerVpa && txn.payerVpa.toLowerCase().includes(q))
    );

    // Status Filter
    const matchesStatus = statusFilter === 'ALL' || (
      statusFilter === 'REFUNDED' 
        ? (txn.status === 'REFUNDED' || txn.status === 'PARTIALLY_REFUNDED')
        : txn.status === statusFilter
    );

    // Method Filter
    const matchesMethod = methodFilter === 'ALL' || txn.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const headers = ['Transaction ID', 'Order ID', 'Date', 'Method', 'Payer VPA', 'Payee VPA', 'Amount', 'Status', 'UTR / RRN'];
    const rows = filtered.map(t => [
      t.id,
      t.orderId,
      t.createdAt,
      t.method,
      t.payerVpa || '',
      t.payeeVpa,
      t.amount,
      t.status,
      t.upiRrn || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PaySetu_Transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t.transactionsTitle}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {t.transactionsDesc}
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: t.filterAll },
              { id: 'SUCCESS', label: t.filterSuccess },
              { id: 'PENDING', label: t.filterPending },
              { id: 'FAILED', label: t.filterFailed },
              { id: 'REFUNDED', label: t.filterRefunded },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id 
                    ? 'bg-blue-600 text-white font-semibold' 
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No matching transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t.colTxnId}</th>
                  <th className="py-3.5 px-4">{t.colDate}</th>
                  <th className="py-3.5 px-4">{t.colMethod}</th>
                  <th className="py-3.5 px-4">{t.colParty}</th>
                  <th className="py-3.5 px-4">{t.colAmount}</th>
                  <th className="py-3.5 px-4">{t.colStatus}</th>
                  <th className="py-3.5 px-4 text-right">{t.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((txn) => {
                  const isOutgoing = txn.userId === currentUserId && txn.payerVpa === currentUserVpa;
                  const isSuccess = txn.status === 'SUCCESS';
                  const isPending = txn.status === 'PENDING';
                  const isRefunded = txn.status === 'REFUNDED' || txn.status === 'PARTIALLY_REFUNDED';

                  return (
                    <tr 
                      key={txn.id}
                      onClick={() => onSelectTransaction(txn)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-white font-semibold group-hover:text-blue-400 transition-colors">
                          {txn.id}
                        </div>
                        {txn.upiRrn && (
                          <div className="font-mono text-[10px] text-slate-500">
                            UTR: {txn.upiRrn}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        <div>{new Date(txn.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {txn.method === 'upi_qr' ? 'UPI QR' : txn.method === 'upi_intent' ? 'UPI Intent' : txn.method.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white truncate max-w-[180px]">
                          {isOutgoing ? txn.payeeName : (txn.payerVpa || 'Customer')}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate max-w-[180px]">
                          {isOutgoing ? txn.payeeVpa : `To: ${txn.payeeVpa}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-sm tabular-nums whitespace-nowrap">
                        <span className={
                          isRefunded 
                            ? 'text-purple-400' 
                            : isSuccess 
                              ? (isOutgoing ? 'text-white' : 'text-emerald-400')
                              : 'text-slate-500'
                        }>
                          {isOutgoing && isSuccess ? '-' : '+'}{formatINR(txn.amount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(txn);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg border border-blue-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{t.viewReceipt}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
