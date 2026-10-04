import React from 'react';
import { Language, User } from '../types/payment';
import { translations } from '../lib/i18n';
import { 
  ShieldCheck, 
  Globe, 
  User as UserIcon, 
  LogOut, 
  ChevronDown, 
  Terminal, 
  LayoutDashboard, 
  Send, 
  QrCode, 
  History, 
  SlidersHorizontal 
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'send' | 'receive' | 'transactions' | 'admin' | 'docs';
  setCurrentTab: (tab: 'dashboard' | 'send' | 'receive' | 'transactions' | 'admin' | 'docs') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  allUsers: User[];
  isSandbox: boolean;
  onToggleSandbox: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  currentUser,
  onSwitchUser,
  allUsers,
  isSandbox,
  onToggleSandbox,
  onOpenAuth,
}) => {
  const t = translations[language];
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 text-white">
      {/* Top micro-bar for sandbox status & security note */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSandbox ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isSandbox ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
          </span>
          <span className="font-mono text-[11px]">
            {isSandbox ? 'NPCI UPI TEST GATEWAY (SANDBOX)' : 'NPCI UPI PRODUCTION GATEWAY'}
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">
            256-bit AES · ISO 20022 · RBI Compliant
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSandbox}
            className={`text-[11px] font-mono px-2 py-0.5 rounded cursor-pointer transition-colors ${
              isSandbox 
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40' 
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
            }`}
          >
            {isSandbox ? 'Mode: Sandbox' : 'Mode: Production'}
          </button>
        </div>
      </div>

      {/* Main 3-zone Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentTab('dashboard')} 
            className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-inner">
              ₹
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                PaySetu
                <span className="text-[10px] font-mono tracking-wider font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-1 py-0.2 rounded">
                  UPI 2.0
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              currentTab === 'dashboard' 
                ? 'text-white bg-slate-800' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t.navDashboard}</span>
          </button>

          <button
            onClick={() => setCurrentTab('send')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              currentTab === 'send' 
                ? 'text-white bg-slate-800' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{t.navSendUpi}</span>
          </button>

          <button
            onClick={() => setCurrentTab('receive')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              currentTab === 'receive' 
                ? 'text-white bg-slate-800' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{t.navReceiveQr}</span>
          </button>

          <button
            onClick={() => setCurrentTab('transactions')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              currentTab === 'transactions' 
                ? 'text-white bg-slate-800' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t.navTransactions}</span>
          </button>

          <button
            onClick={() => setCurrentTab('admin')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              currentTab === 'admin' 
                ? 'text-white bg-slate-800' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t.navAdmin}</span>
          </button>

          <button
            onClick={() => setCurrentTab('docs')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              currentTab === 'docs' 
                ? 'text-white bg-slate-800' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{t.navApiDocs}</span>
          </button>
        </nav>

        {/* Zone 3: Actions (Language & User Switcher) */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Toggle English / Hindi"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* User Profile & Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white transition-colors cursor-pointer"
            >
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full bg-slate-700"
              />
              <span className="font-medium max-w-[100px] truncate hidden sm:inline">
                {currentUser.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setUserDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs text-slate-400">{t.loggedInAs}</p>
                  <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                  <p className="text-xs font-mono text-emerald-400 truncate">{currentUser.vpa}</p>
                  <span className={`inline-block mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                    currentUser.role === 'admin' ? 'bg-purple-900/60 text-purple-300' : 'bg-blue-900/60 text-blue-300'
                  }`}>
                    {currentUser.role === 'admin' ? t.roleAdmin : t.roleUser}
                  </span>
                </div>

                <div className="py-1">
                  <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {t.orContinueWith}
                  </p>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => onSwitchUser(u.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        u.id === currentUser.id 
                          ? 'bg-blue-600/20 text-blue-300 font-semibold' 
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{u.vpa}</div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {u.role === 'admin' ? 'ADMIN' : 'USER'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 mt-1">
                  <button
                    onClick={onOpenAuth}
                    className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>{t.signup} / {t.login}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1 text-xs cursor-pointer ${
            currentTab === 'dashboard' ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">{t.navDashboard}</span>
        </button>

        <button
          onClick={() => setCurrentTab('send')}
          className={`flex flex-col items-center gap-1 p-1 text-xs cursor-pointer ${
            currentTab === 'send' ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Send className="w-5 h-5" />
          <span className="text-[10px]">{t.navSendUpi}</span>
        </button>

        <button
          onClick={() => setCurrentTab('receive')}
          className={`flex flex-col items-center gap-1 p-1 text-xs cursor-pointer ${
            currentTab === 'receive' ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px]">{t.navReceiveQr}</span>
        </button>

        <button
          onClick={() => setCurrentTab('transactions')}
          className={`flex flex-col items-center gap-1 p-1 text-xs cursor-pointer ${
            currentTab === 'transactions' ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px]">{t.navTransactions}</span>
        </button>

        <button
          onClick={() => setCurrentTab('admin')}
          className={`flex flex-col items-center gap-1 p-1 text-xs cursor-pointer ${
            currentTab === 'admin' ? 'text-blue-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[10px]">{t.navAdmin}</span>
        </button>
      </div>
    </header>
  );
};
