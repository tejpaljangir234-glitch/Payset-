import React, { useState } from 'react';
import { User, Language } from '../types/payment';
import { translations } from '../lib/i18n';
import { isValidEmail, isValidIndianPhone } from '../lib/upi';
import { User as UserIcon, Lock, Phone, Mail, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onRegister: (name: string, identifier: string, role?: 'user' | 'admin') => void;
  onSwitchUser: (userId: string) => void;
  allUsers: User[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  onRegister,
  onSwitchUser,
  allUsers,
}) => {
  const t = translations[language];

  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim();
    const isEmail = cleanId.includes('@');

    if (isEmail) {
      if (!isValidEmail(cleanId)) {
        setError('Please enter a valid email address');
        return;
      }
    } else {
      if (!isValidIndianPhone(cleanId)) {
        setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)');
        return;
      }
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      onRegister(name.trim(), cleanId, role);
      onClose();
    } else {
      // Find existing user by phone or email
      const found = allUsers.find(
        u => u.email.toLowerCase() === cleanId.toLowerCase() || u.phone === cleanId.replace(/\D/g, '')
      );
      if (found) {
        onSwitchUser(found.id);
        onClose();
      } else {
        // Create user on the fly if not found
        onRegister(name.trim() || 'New User', cleanId, 'user');
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {mode === 'signup' ? t.signup : t.login}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'signup' ? t.signupPrompt : t.loginPrompt}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'signup' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.signup}
          </button>
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.login}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.fullName}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.phoneOrEmail}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="9876543210 or name@example.com"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Indian mobile number (+91) or valid email address
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    role === 'user' ? 'bg-blue-600/20 text-blue-300 border-blue-500/50' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Regular User / Merchant
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    role === 'admin' ? 'bg-purple-600/20 text-purple-300 border-purple-500/50' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  System Admin
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-colors cursor-pointer"
            >
              <span>{mode === 'signup' ? 'Create Account & Generate UPI VPA' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Demo Switcher Section */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
            {t.orContinueWith}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {allUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  onSwitchUser(u.id);
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-white truncate">{u.name}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{u.vpa}</div>
                <span className="text-[9px] font-mono text-blue-400 font-semibold uppercase">{u.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
