import React, { useState } from 'react';
import { User, Transaction, Language, PaymentMethod } from '../types/payment';
import { translations } from '../lib/i18n';
import { buildUpiUri, buildAppUpiUri, isValidUpiId } from '../lib/upi';
import { db } from '../lib/storage';
import { 
  Send, 
  ShieldCheck, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Zap,
  ArrowRight,
  Info
} from 'lucide-react';

interface UPIPaymentModalProps {
  user: User;
  language: Language;
  isSandbox: boolean;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (txn: Transaction) => void;
}

export const UPIPaymentModal: React.FC<UPIPaymentModalProps> = ({
  user,
  language,
  isSandbox,
  isOpen,
  onClose,
  onPaymentComplete,
}) => {
  const t = translations[language];

  const [payeeVpa, setPayeeVpa] = useState('swiggy.order@icici');
  const [payeeName, setPayeeName] = useState('Swiggy Food Delivery');
  const [amount, setAmount] = useState('450');
  const [note, setNote] = useState('Order #98213 - Dinner');
  const [method, setMethod] = useState<PaymentMethod>('upi_intent');
  const [simulationScenario, setSimulationScenario] = useState<'SUCCESS' | 'PENDING' | 'FAILED'>('SUCCESS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [vpaError, setVpaError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayeeVpaChange = (val: string) => {
    setPayeeVpa(val);
    if (val && !isValidUpiId(val)) {
      setVpaError(language === 'en' ? 'Invalid UPI ID format (e.g. name@bank)' : 'अमान्य UPI ID प्रारूप (उदा. name@bank)');
    } else {
      setVpaError(null);
    }
  };

  const handleQuickPayee = (name: string, vpa: string) => {
    setPayeeName(name);
    setPayeeVpa(vpa);
    setVpaError(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidUpiId(payeeVpa)) {
      setVpaError(language === 'en' ? 'Please enter a valid UPI ID' : 'कृपया वैध UPI ID दर्ज करें');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert(language === 'en' ? 'Please enter a valid amount' : 'कृपया मान्य राशि दर्ज करें');
      return;
    }

    if (numAmount > user.balance && simulationScenario !== 'FAILED') {
      const proceed = confirm(
        language === 'en' 
          ? `Insufficient wallet balance (₹${user.balance.toFixed(2)}). Continue in sandbox?` 
          : `अपर्याप्त वॉलेट बैलेंस (₹${user.balance.toFixed(2)})। क्या सैंडबॉक्स में जारी रखें?`
      );
      if (!proceed) return;
    }

    setIsProcessing(true);

    try {
      // 1. Create Gateway Order
      const order = db.createOrder({
        userId: user.id,
        amount: numAmount,
        description: note,
      });

      // 2. Simulate NPCI Network Latency (1.2 seconds)
      await new Promise(res => setTimeout(res, 1200));

      // 3. Process Payment & Generate Cryptographic HMAC Signature
      const { transaction } = await db.processPayment({
        orderId: order.id,
        userId: user.id,
        amount: numAmount,
        method: method,
        payeeVpa: payeeVpa.trim(),
        payeeName: payeeName.trim() || 'Merchant UPI',
        payerVpa: user.vpa,
        statusSimulation: simulationScenario,
      });

      setIsProcessing(false);
      onClose();
      onPaymentComplete(transaction);
    } catch (err) {
      setIsProcessing(false);
      alert(`Payment error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Generate UPI URI
  const rawUpiUri = buildUpiUri({
    pa: payeeVpa || 'merchant@icici',
    pn: payeeName || 'Merchant',
    am: amount || '0',
    tn: note,
    mc: '6012',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {t.payViaUpiTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {t.payViaUpiDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Quick Beneficiary Shortcuts */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Recent / Popular Merchants
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { name: 'Swiggy Food', vpa: 'swiggy.order@icici' },
              { name: 'Zomato Online', vpa: 'zomato@hdfcbank' },
              { name: 'Sharma General', vpa: 'kirana.store@paytm' },
            ].map((merchant) => (
              <button
                type="button"
                key={merchant.vpa}
                onClick={() => handleQuickPayee(merchant.name, merchant.vpa)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  payeeVpa === merchant.vpa 
                    ? 'bg-blue-600/20 border-blue-500/60 text-white' 
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-semibold truncate">{merchant.name}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{merchant.vpa}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Payment Form */}
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {/* Beneficiary VPA Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.enterUpiId}
            </label>
            <input
              type="text"
              value={payeeVpa}
              onChange={(e) => handlePayeeVpaChange(e.target.value)}
              placeholder={t.upiIdPlaceholder}
              className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white font-mono text-sm focus:outline-none transition-colors ${
                vpaError ? 'border-red-500' : 'border-slate-700 focus:border-blue-500'
              }`}
              required
            />
            {vpaError && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{vpaError}</span>
              </p>
            )}
          </div>

          {/* Amount Input with presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.amountInr}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-mono text-xl font-bold">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-2xl font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Quick Amounts */}
            <div className="mt-2 flex items-center gap-2">
              {['100', '250', '500', '1000', '2000'].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className="flex-1 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Remarks / Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.paymentNote}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.notePlaceholder}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Pay via UPI App Intent shortcuts */}
          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t.popularUpiApps}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'gpay', label: 'GPay', color: 'from-blue-600 to-indigo-600' },
                { id: 'phonepe', label: 'PhonePe', color: 'from-purple-600 to-indigo-700' },
                { id: 'paytm', label: 'Paytm', color: 'from-cyan-600 to-blue-700' },
                { id: 'bhim', label: 'BHIM', color: 'from-emerald-600 to-teal-700' },
              ].map((app) => (
                <a
                  key={app.id}
                  href={buildAppUpiUri(app.id as any, rawUpiUri)}
                  onClick={() => setMethod('upi_intent')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center gap-1 group transition-all text-center cursor-pointer"
                >
                  <div className={`w-6 h-6 rounded-md bg-gradient-to-tr ${app.color} flex items-center justify-center text-[10px] font-black text-white shadow`}>
                    {app.label[0]}
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 group-hover:text-white">
                    {app.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Sandbox Test Scenario Selector */}
          {isSandbox && (
            <div className="p-3.5 bg-slate-950 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Zap className="w-3.5 h-3.5" />
                <span>{t.sandboxSimulation}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSimulationScenario('SUCCESS')}
                  className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border text-center transition-all cursor-pointer ${
                    simulationScenario === 'SUCCESS' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Force Success
                </button>

                <button
                  type="button"
                  onClick={() => setSimulationScenario('PENDING')}
                  className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border text-center transition-all cursor-pointer ${
                    simulationScenario === 'PENDING' 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Bank Delay
                </button>

                <button
                  type="button"
                  onClick={() => setSimulationScenario('FAILED')}
                  className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border text-center transition-all cursor-pointer ${
                    simulationScenario === 'FAILED' 
                      ? 'bg-red-500/20 text-red-300 border-red-500/50' 
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Force Fail
                </button>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.processingPayment}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t.payNow} (₹{amount || '0'})</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>NPCI Unified Payments Interface · Secured with HMAC-SHA256</span>
        </div>
      </div>
    </div>
  );
};
