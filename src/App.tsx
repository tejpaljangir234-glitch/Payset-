/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from './lib/storage';
import { User, Transaction, Refund, WebhookEvent, GatewayConfig, Language } from './types/payment';
import { translations } from './lib/i18n';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { UPIPaymentModal } from './components/UPIPaymentModal';
import { ReceiveQRCode } from './components/ReceiveQRCode';
import { TransactionHistory } from './components/TransactionHistory';
import { PaymentStatusModal } from './components/PaymentStatusModal';
import { AdminPanel } from './components/AdminPanel';
import { ApiDocsModal } from './components/ApiDocsModal';
import { AuthModal } from './components/AuthModal';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('hi');
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'send' | 'receive' | 'transactions' | 'admin' | 'docs'>('dashboard');

  // Database entities
  const [currentUser, setCurrentUser] = useState<User>(() => db.getCurrentUser());
  const [allUsers, setAllUsers] = useState<User[]>(() => db.getUsers());
  const [transactions, setTransactions] = useState<Transaction[]>(() => db.getTransactions());
  const [refunds, setRefunds] = useState<Refund[]>(() => db.getRefunds());
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>(() => db.getWebhooks());
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig>(() => db.getGatewayConfig());
  const [isSandbox, setIsSandbox] = useState<boolean>(() => db.getGatewayConfig().mode === 'sandbox');

  // Modals
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = translations[language];

  const refreshAllData = () => {
    setCurrentUser(db.getCurrentUser());
    setAllUsers(db.getUsers());
    setTransactions(db.getTransactions());
    setRefunds(db.getRefunds());
    setWebhooks(db.getWebhooks());
    const config = db.getGatewayConfig();
    setGatewayConfig(config);
    setIsSandbox(config.mode === 'sandbox');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSwitchUser = (userId: string) => {
    const user = db.setCurrentUser(userId);
    if (user) {
      setCurrentUser(user);
      refreshAllData();
      showToast(`${language === 'en' ? 'Switched to' : 'बदलकर किया:'} ${user.name}`);
    }
  };

  const handleRegisterUser = (name: string, identifier: string, role: 'user' | 'admin' = 'user') => {
    const newUser = db.registerUser(name, identifier, role);
    setCurrentUser(newUser);
    refreshAllData();
    showToast(`${language === 'en' ? 'Welcome' : 'स्वागत है'} ${newUser.name}! UPI VPA: ${newUser.vpa}`);
  };

  const handleToggleSandbox = () => {
    const newMode = isSandbox ? 'production' : 'sandbox';
    db.updateGatewayConfig({ mode: newMode });
    setIsSandbox(!isSandbox);
    refreshAllData();
    showToast(`Switched to ${newMode.toUpperCase()} Mode`);
  };

  const handleAddMoney = (amount: number) => {
    db.updateUserBalance(currentUser.id, amount);
    refreshAllData();
    showToast(`₹${amount.toFixed(2)} added to ${currentUser.name} wallet!`);
  };

  const handlePaymentCompleted = (txn: Transaction) => {
    refreshAllData();
    setSelectedTransaction(txn);
    showToast(txn.status === 'SUCCESS' ? 'UPI Payment Successful!' : 'Payment Attempt Completed');
  };

  const handlePaymentReceived = (txn: Transaction) => {
    refreshAllData();
    setSelectedTransaction(txn);
    showToast(`Received ₹${txn.amount} via UPI QR!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Global Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        language={language}
        setLanguage={setLanguage}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        allUsers={allUsers}
        isSandbox={isSandbox}
        onToggleSandbox={handleToggleSandbox}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            user={currentUser}
            transactions={transactions.filter(t => t.userId === currentUser.id || t.payeeVpa === currentUser.vpa)}
            language={language}
            onSendMoney={() => setIsUpiModalOpen(true)}
            onReceiveMoney={() => setCurrentTab('receive')}
            onViewAllTransactions={() => setCurrentTab('transactions')}
            onSelectTransaction={(txn) => setSelectedTransaction(txn)}
            onAddMoney={handleAddMoney}
          />
        )}

        {currentTab === 'send' && (
          <div className="py-4">
            <UPIPaymentModal
              user={currentUser}
              language={language}
              isSandbox={isSandbox}
              isOpen={true}
              onClose={() => setCurrentTab('dashboard')}
              onPaymentComplete={handlePaymentCompleted}
            />
          </div>
        )}

        {currentTab === 'receive' && (
          <ReceiveQRCode
            user={currentUser}
            language={language}
            onPaymentReceived={handlePaymentReceived}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionHistory
            transactions={transactions.filter(t => t.userId === currentUser.id || t.payeeVpa === currentUser.vpa || currentUser.role === 'admin')}
            currentUserId={currentUser.id}
            currentUserVpa={currentUser.vpa}
            language={language}
            onSelectTransaction={(txn) => setSelectedTransaction(txn)}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPanel
            users={allUsers}
            transactions={transactions}
            refunds={refunds}
            webhooks={webhooks}
            gatewayConfig={gatewayConfig}
            language={language}
            onRefreshData={refreshAllData}
            onSelectTransaction={(txn) => setSelectedTransaction(txn)}
          />
        )}

        {currentTab === 'docs' && (
          <ApiDocsModal language={language} />
        )}
      </main>

      {/* Toast Notification Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* UPI Payment Modal (When triggered from Dashboard quick action) */}
      {isUpiModalOpen && (
        <UPIPaymentModal
          user={currentUser}
          language={language}
          isSandbox={isSandbox}
          isOpen={isUpiModalOpen}
          onClose={() => setIsUpiModalOpen(false)}
          onPaymentComplete={handlePaymentCompleted}
        />
      )}

      {/* Official Payment Status / Receipt Modal */}
      {selectedTransaction && (
        <PaymentStatusModal
          transaction={selectedTransaction}
          language={language}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {/* User Login & Signup Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          language={language}
          onRegister={handleRegisterUser}
          onSwitchUser={handleSwitchUser}
          allUsers={allUsers}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 text-slate-500 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-bold text-white">PaySetu Payments India</span>
            <span>·</span>
            <span>Official UPI & Payment Gateway Architecture</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>NPCI Unified Payments Interface 2.0</span>
            <span>·</span>
            <span>256-bit AES Encryption</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
