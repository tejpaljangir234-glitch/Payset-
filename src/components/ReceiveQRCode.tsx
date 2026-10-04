import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { User, Transaction, Language } from '../types/payment';
import { translations } from '../lib/i18n';
import { buildUpiUri, formatINR } from '../lib/upi';
import { db } from '../lib/storage';
import { 
  QrCode, 
  Copy, 
  Check, 
  Download, 
  Play, 
  Loader2, 
  ShieldCheck, 
  Smartphone,
  Sparkles
} from 'lucide-react';

interface ReceiveQRCodeProps {
  user: User;
  language: Language;
  onPaymentReceived: (txn: Transaction) => void;
}

export const ReceiveQRCode: React.FC<ReceiveQRCodeProps> = ({
  user,
  language,
  onPaymentReceived,
}) => {
  const t = translations[language];

  const [amount, setAmount] = useState<string>('500');
  const [note, setNote] = useState<string>('Payment to ' + user.name);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Generate UPI URI
  const upiUri = buildUpiUri({
    pa: user.vpa,
    pn: user.name,
    am: amount || '',
    cu: 'INR',
    tn: note,
    mc: '6012',
  });

  // Render QR Code onto image Data URL
  useEffect(() => {
    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url: string) => {
        setQrDataUrl(url);
      })
      .catch((err: unknown) => {
        console.error('QR code generation error:', err);
      });
  }, [upiUri]);

  const copyUpiLink = () => {
    navigator.clipboard.writeText(upiUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `UPI_QR_${user.vpa}_${Date.now()}.png`;
    a.click();
  };

  // Simulate an incoming customer payment via QR code
  const handleSimulatePayment = async () => {
    const numAmount = parseFloat(amount) || 100;
    setIsSimulating(true);

    try {
      // 1. Create Order
      const order = db.createOrder({
        userId: user.id,
        amount: numAmount,
        description: note || 'Customer QR Payment',
      });

      // 2. Wait 1.5 seconds simulating customer scanning & entering UPI PIN in GPay/PhonePe
      await new Promise(r => setTimeout(r, 1400));

      // 3. Process payment with customer details
      const customerVpas = [
        'customer99@okhdfcbank',
        'priya.singh@ybl',
        'amit.kumar@icici',
        'vikram88@paytm',
      ];
      const randomCustomerVpa = customerVpas[Math.floor(Math.random() * customerVpas.length)];

      const { transaction } = await db.processPayment({
        orderId: order.id,
        userId: user.id,
        amount: numAmount,
        method: 'upi_qr',
        payeeVpa: user.vpa,
        payeeName: user.name,
        payerVpa: randomCustomerVpa,
        statusSimulation: 'SUCCESS',
      });

      setIsSimulating(false);
      onPaymentReceived(transaction);
    } catch (e) {
      setIsSimulating(false);
      alert('Simulation error: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <QrCode className="w-6 h-6 text-emerald-400" />
          <span>{t.receiveQrTitle}</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {t.receiveQrDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Dynamic QR Code Presentation Card */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xl space-y-6">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              BHARAT UPI QR
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Instant Settlement
            </span>
          </div>

          {/* QR Container */}
          <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-slate-700/50 relative group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Dynamic UPI QR Code"
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            )}
            
            {/* Center UPI Logo Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center font-bold text-slate-900 text-xs font-mono">
                ₹ UPI
              </div>
            </div>
          </div>

          {/* Payee Info & Amount */}
          <div className="space-y-1">
            <div className="text-lg font-bold text-white">{user.name}</div>
            <div className="text-xs font-mono text-emerald-400">{user.vpa}</div>
            {amount && parseFloat(amount) > 0 && (
              <div className="text-2xl font-black font-mono text-white pt-2 tabular-nums">
                {formatINR(parseFloat(amount))}
              </div>
            )}
            {note && <p className="text-xs text-slate-400 italic">"{note}"</p>}
          </div>

          {/* Quick Actions */}
          <div className="w-full flex items-center gap-3 pt-2">
            <button
              onClick={copyUpiLink}
              className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied URI' : t.copyUpiLink}</span>
            </button>

            <button
              onClick={downloadQr}
              className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>{t.downloadQr}</span>
            </button>
          </div>
        </div>

        {/* Right: Customization & Simulation Controls */}
        <div className="lg:col-span-6 space-y-6">
          {/* Customization Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Customize Payment Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.customAmountOptional}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-mono text-lg font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter fixed amount (e.g. 500)"
                    className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Amount Quick Chips */}
              <div className="flex items-center gap-2">
                {['100', '200', '500', '1000', '2500'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className="flex-1 py-1 text-xs font-mono rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 cursor-pointer"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.customNoteOptional}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Consultation fee, Freelance project"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Real-time Sandbox Simulation Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Sparkles className="w-5 h-5" />
              <span>Test Payer Payment Simulator</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              In test/sandbox mode, click below to simulate an external customer scanning this QR with Google Pay or PhonePe. The system will process the payment, fire a webhook, and generate an official receipt!
            </p>

            <button
              onClick={handleSimulatePayment}
              disabled={isSimulating}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.simulatingPayment}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{t.simulateCustomerPayment} (₹{amount || '100'})</span>
                </>
              )}
            </button>
          </div>

          {/* Supported Apps banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              {t.scanAnyUpiApp}
            </span>
            <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-300">
              <span className="px-2 py-1 bg-slate-800 rounded">Google Pay</span>
              <span className="px-2 py-1 bg-slate-800 rounded">PhonePe</span>
              <span className="px-2 py-1 bg-slate-800 rounded">Paytm</span>
              <span className="px-2 py-1 bg-slate-800 rounded">BHIM</span>
              <span className="px-2 py-1 bg-slate-800 rounded">CRED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
