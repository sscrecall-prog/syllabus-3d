import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Settings,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  Server,
  ArrowDownToLine,
  ArrowUpFromLine,
  HelpCircle,
  KeyRound
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import {
  getFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  isFirebaseConfigured,
  FirebaseConfig
} from '../../services/firebase';

export const CloudServerSyncCard: React.FC = () => {
  const {
    cloudSyncStatus,
    lastCloudSyncAt,
    cloudSyncError,
    manualCloudSync,
    manualCloudRestore,
    exams
  } = useSyllabus();

  const { user, loginWithGoogle, logout } = useAuth();

  // Local UI State
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [isRestoringNow, setIsRestoringNow] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showConfigAccordion, setShowConfigAccordion] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Firebase Config Form State
  const [configForm, setConfigForm] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',
    storageBucket: '',
    messagingSenderId: ''
  });
  const [configSavedNotice, setConfigSavedNotice] = useState(false);
  const [isConfiguredState, setIsConfiguredState] = useState(false);

  useEffect(() => {
    setIsConfiguredState(isFirebaseConfigured());
    const existing = getFirebaseConfig();
    if (existing) {
      setConfigForm({
        apiKey: existing.apiKey || '',
        authDomain: existing.authDomain || '',
        projectId: existing.projectId || '',
        appId: existing.appId || '',
        storageBucket: existing.storageBucket || '',
        messagingSenderId: existing.messagingSenderId || ''
      });
    }
  }, []);

  const showNotice = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNoticeMessage({ type, text });
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  // Google Sign-In Action
  const handleGoogleSignIn = async () => {
    try {
      showNotice('Signing in with Google...', 'info');
      await loginWithGoogle();
      showNotice('Logged in successfully! Restoring your cloud syllabus data...', 'success');
    } catch (err: any) {
      showNotice(err?.message || 'Failed to sign in with Google.', 'error');
    }
  };

  // Manual Sync Action
  const handleSyncNow = async () => {
    if (!user) {
      showNotice('Please sign in with your Gmail account first.', 'error');
      return;
    }
    setIsSyncingNow(true);
    try {
      const res = await manualCloudSync();
      if (res.success) {
        showNotice('Successfully synced all syllabus data to cloud server!', 'success');
      } else {
        showNotice(res.error || 'Failed to sync to cloud server.', 'error');
      }
    } finally {
      setIsSyncingNow(false);
    }
  };

  // Manual Restore Action
  const handleRestoreNow = async () => {
    if (!user) {
      showNotice('Please sign in with your Gmail account first.', 'error');
      return;
    }
    const confirmed = window.confirm(
      'Restore all data from Cloud Server?\n\nThis will recover your saved syllabus progress, topics, custom notes, revisions, and targets from the cloud server.'
    );
    if (!confirmed) return;

    setIsRestoringNow(true);
    try {
      const res = await manualCloudRestore();
      if (res.success) {
        showNotice('Successfully recovered and restored all study data from cloud server!', 'success');
      } else {
        showNotice(res.error || 'No saved cloud data found for this account.', 'error');
      }
    } finally {
      setIsRestoringNow(false);
    }
  };

  // Save Custom Firebase Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configForm.apiKey || !configForm.projectId) {
      showNotice('API Key and Project ID are required.', 'error');
      return;
    }

    saveCustomFirebaseConfig(configForm);
    setIsConfiguredState(true);
    setConfigSavedNotice(true);
    setTimeout(() => setConfigSavedNotice(false), 3500);
    showNotice('Firebase Cloud Server configuration saved! Reloading backend...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  // Reset to Default Config
  const handleResetConfig = () => {
    if (window.confirm('Reset Firebase Cloud Server configuration to default?')) {
      clearCustomFirebaseConfig();
      setIsConfiguredState(isFirebaseConfigured());
      setConfigForm({
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',
        storageBucket: '',
        messagingSenderId: ''
      });
      showNotice('Configuration reset. Reloading...', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const formatSyncTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never synced';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[#F8FAFC] dark:bg-[#1F2335] border border-slate-200 dark:border-[#292E42] space-y-4 transition-all">
      {/* ── CARD HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#292E42]/60">
        <div className="flex items-center gap-3">
          {/* Cloud Server Icon Badge */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md text-white shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-[#C0CAF5] leading-tight">
                Cloud Server Database & Gmail Auto-Recovery
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Auto-Sync Active
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-[#A9B1D6]">
              Study data is stored securely on the cloud server. Log in with Gmail on any device to auto-recover all your notes and progress.
            </p>
          </div>
        </div>

        {/* Server Provider Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200/70 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-[11px] font-medium shrink-0 self-start sm:self-auto">
          <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{isConfiguredState ? 'Google Cloud Firestore' : 'Cloud Server Engine'}</span>
        </div>
      </div>

      {/* Notice Banner */}
      {noticeMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all ${
            noticeMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : noticeMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}
        >
          {noticeMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : noticeMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          ) : (
            <RefreshCw className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 animate-spin" />
          )}
          <span>{noticeMessage.text}</span>
        </div>
      )}

      {/* ── USER ACCOUNT & CONNECTION STATE ── */}
      {user ? (
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#16161E] border border-slate-200 dark:border-[#24283B] space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-inner">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-[#C0CAF5]">
                    {user.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    Gmail Connected
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-[#787C99] block font-mono">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Sync Status Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-[#24283B]/60 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#1A1E2E] border border-slate-100 dark:border-[#24283B]">
              <span className="text-[10px] text-slate-500 dark:text-[#787C99] block font-semibold">
                Sync Status
              </span>
              <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-[#C0CAF5]">
                {cloudSyncStatus === 'syncing' || isSyncingNow ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                    <span className="text-blue-600 dark:text-blue-400">Syncing to Server...</span>
                  </>
                ) : cloudSyncStatus === 'synced' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Cloud Synced & Protected</span>
                  </>
                ) : cloudSyncStatus === 'error' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-rose-600 dark:text-rose-400">Sync Error</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Local Vault Active</span>
                  </>
                )}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#1A1E2E] border border-slate-100 dark:border-[#24283B]">
              <span className="text-[10px] text-slate-500 dark:text-[#787C99] block font-semibold">
                Last Cloud Sync
              </span>
              <span className="font-bold text-slate-800 dark:text-[#C0CAF5] font-mono text-[11px]">
                {formatSyncTime(lastCloudSyncAt)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#1A1E2E] border border-slate-100 dark:border-[#24283B]">
              <span className="text-[10px] text-slate-500 dark:text-[#787C99] block font-semibold">
                Exams Stored in Cloud
              </span>
              <span className="font-bold text-slate-800 dark:text-[#C0CAF5] font-mono text-[11px]">
                {exams.length} Active Syllabus Exam{exams.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Sync & Restore Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncingNow || cloudSyncStatus === 'syncing'}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] dark:text-[#0B0B0D] text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <ArrowUpFromLine className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-bounce' : ''}`} />
              <span>{isSyncingNow ? 'Syncing...' : 'Sync to Cloud Server'}</span>
            </button>

            <button
              type="button"
              onClick={handleRestoreNow}
              disabled={isRestoringNow || cloudSyncStatus === 'syncing'}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#24283B] dark:hover:bg-[#2E334D] text-slate-800 dark:text-[#C0CAF5] text-xs font-bold transition-all border border-slate-200 dark:border-[#343B58] cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <ArrowDownToLine className={`w-3.5 h-3.5 ${isRestoringNow ? 'animate-spin' : ''}`} />
              <span>{isRestoringNow ? 'Restoring...' : 'Recover Data from Cloud'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── NOT LOGGED IN STATE (PROMPT GMAIL LOGIN) ── */
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#16161E] border border-slate-200 dark:border-[#24283B] space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-blue-600 dark:text-[#7AA2F7]" />
                <span className="text-xs sm:text-[14px] font-bold text-slate-900 dark:text-[#C0CAF5]">
                  Sign In with Gmail for Unlimited Cloud Auto-Recovery
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-[#A9B1D6] max-w-xl leading-relaxed">
                Connect your Google Account so your syllabus progress, chapters, PDF annotations, custom notes, revisions, and targets are saved directly to the server and restored automatically on any computer, tablet, or phone.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] dark:text-[#0B0B0D] text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 shrink-0"
            >
              {/* Google G Logo SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Google / Gmail</span>
            </button>
          </div>
        </div>
      )}

      {/* ── FIREBASE CLOUD SERVER BACKEND CONFIG ACCORDION ── */}
      <div className="rounded-xl border border-slate-200 dark:border-[#24283B] overflow-hidden bg-white dark:bg-[#16161E]">
        <button
          type="button"
          onClick={() => setShowConfigAccordion(!showConfigAccordion)}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 text-left text-xs font-bold text-slate-800 dark:text-[#C0CAF5] hover:bg-slate-50 dark:hover:bg-[#1C2030] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-slate-500 dark:text-[#787C99]" />
            <span>Firebase & Google Cloud Server Backend Configuration</span>
            {isConfiguredState ? (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Vault Safeguard
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#787C99]">
            <span className="text-[10px] font-medium hidden sm:inline">
              {showConfigAccordion ? 'Hide Server Settings' : 'Custom Server Setup'}
            </span>
            {showConfigAccordion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showConfigAccordion && (
          <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-[#24283B] space-y-3.5 bg-slate-50/50 dark:bg-[#13141C]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-[#A9B1D6]">
              <p className="text-[11px] leading-relaxed">
                Connect your own Google Firebase project to host your database permanently in Google Cloud Firestore.
              </p>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="text-blue-600 dark:text-[#7AA2F7] hover:underline flex items-center gap-1 text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to get free Firebase Keys (2 mins)</span>
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    API Key *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AIzaSy..."
                    value={configForm.apiKey}
                    onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1A1D2D] border border-slate-200 dark:border-[#292E42] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Project ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="my-syllabus-app-123"
                    value={configForm.projectId}
                    onChange={(e) => setConfigForm({ ...configForm, projectId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1A1D2D] border border-slate-200 dark:border-[#292E42] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    placeholder="my-syllabus-app-123.firebaseapp.com"
                    value={configForm.authDomain}
                    onChange={(e) => setConfigForm({ ...configForm, authDomain: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1A1D2D] border border-slate-200 dark:border-[#292E42] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    App ID
                  </label>
                  <input
                    type="text"
                    placeholder="1:1234567890:web:abcdef"
                    value={configForm.appId}
                    onChange={(e) => setConfigForm({ ...configForm, appId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1A1D2D] border border-slate-200 dark:border-[#292E42] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetConfig}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear Custom Keys
                </button>

                <div className="flex items-center gap-2">
                  {configSavedNotice && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    Save & Activate Server
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── 2-MINUTE SETUP GUIDE MODAL ── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16161E] border border-slate-200 dark:border-[#24283B] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#24283B]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-[#7AA2F7]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#C0CAF5]">
                  Free Google Cloud Firebase Setup Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-[#A9B1D6] space-y-3 leading-relaxed">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Create a Project:</strong> Visit{' '}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-[#7AA2F7] underline inline-flex items-center gap-0.5"
                  >
                    Firebase Console <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  and click &quot;Add Project&quot; (it&apos;s 100% free forever on Spark Plan).
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Enable Google Sign-In:</strong> Go to
                  Authentication → Sign-in method → Add &quot;Google&quot; provider and save.
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Create Firestore Database:</strong> Go to
                  Firestore Database → Create Database in test mode or production mode.
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  4
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Copy Credentials:</strong> Click Project Settings
                  (gear icon) → Your Apps → &quot;Add Web App&quot; → Copy the apiKey and projectId into the fields
                  above!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              Got it, close guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
