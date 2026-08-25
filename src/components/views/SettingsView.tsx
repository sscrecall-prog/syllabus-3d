import React, { useState } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  Smartphone,
  CheckCircle2,
  Trash2,
  Flame,
  User,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Cloud,
  RefreshCw,
  Server,
  Key,
  Check,
  QrCode,
  ArrowRight,
  Copy
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { usePWA } from '../../hooks/usePWA';
import { PWAInstallModal } from '../modals/PWAInstallModal';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    exportData,
    importData,
    resetToDemo,
    clearAllDemoData,
    syncStatus,
    lastSyncedAt,
    syncWithCloud,
    generatePairCode,
    importByPairCode,
    cloudConfig,
    updateCloudConfig
  } = useSyllabus();

  const { user, logout, updateUserSession } = useAuth();
  const { isInstalled, isOnline } = usePWA();
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [name, setName] = useState(user?.name || profile.name);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 6-Digit Device Pairing State
  const [generatedPairCode, setGeneratedPairCode] = useState<string | null>(null);
  const [inputPairCode, setInputPairCode] = useState('');
  const [isPairingLoading, setIsPairingLoading] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);
  const [pairSuccess, setPairSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name });
    updateUserSession({ name });
    soundManager.playClick();
  };

  const handleGenerateCode = async () => {
    setIsPairingLoading(true);
    setPairError(null);
    try {
      const code = await generatePairCode();
      setGeneratedPairCode(code);
    } catch (e: any) {
      setPairError('Failed to generate code. Check internet connection.');
    } finally {
      setIsPairingLoading(false);
    }
  };

  const handlePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPairCode.trim()) return;
    setIsPairingLoading(true);
    setPairError(null);
    setPairSuccess(false);

    try {
      const success = await importByPairCode(inputPairCode.trim());
      if (success) {
        setPairSuccess(true);
        setInputPairCode('');
      } else {
        setPairError('Invalid or expired 6-digit sync code.');
      }
    } catch (e: any) {
      setPairError(e.message || 'Error connecting to sync server.');
    } finally {
      setIsPairingLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedPairCode) {
      navigator.clipboard.writeText(generatedPairCode);
      setCopiedCode(true);
      soundManager.playClick();
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleExport = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syllabus_3d_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playCompleteChime();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = importData(content);
        if (success) {
          setImportStatus('success');
          soundManager.playCompleteChime();
        } else {
          setImportStatus('error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = async () => {
    soundManager.playClick();
    await logout();
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-brand-500" />
            <span>App Settings & Preferences</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time cross-device sync between Mobile and PC, account details, and backup options.
          </p>
        </div>

        {/* Quick Logout Button */}
        {showLogoutConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Confirm Log Out
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        )}
      </div>

      {/* 1. PROFESSIONAL REAL-TIME CLOUD SYNC & 6-DIGIT DEVICE PAIR HUB */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Real-Time Cross-Device Sync (PC ⇄ Mobile)
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Live Synced'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Every topic, note, revision, and study timer automatically syncs across all your devices.
              </p>
            </div>
          </div>

          <button
            onClick={() => syncWithCloud()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-cyan-500/25 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>Force Sync Now</span>
          </button>
        </div>

        {/* 6-DIGIT INSTANT DEVICE PAIRING ROOM */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <QrCode className="w-4 h-4" />
            <span>Instant 6-Digit Device Link (Sync in 3 Seconds)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step A: Generate on PC */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-300 block">
                Option A: On your PC (Send to Mobile)
              </span>
              <p className="text-[11px] text-slate-400 leading-snug">
                Click below to generate a temporary 6-digit sync PIN for this device.
              </p>

              {generatedPairCode ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">PAIR PIN:</span>
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-white">
                      {generatedPairCode.slice(0, 3)} {generatedPairCode.slice(3)}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={isPairingLoading}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>Generate 6-Digit Sync PIN</span>
                </button>
              )}
            </div>

            {/* Step B: Enter on Mobile */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-300 block">
                Option B: On your Mobile (Receive from PC)
              </span>
              <p className="text-[11px] text-slate-400 leading-snug">
                Type the 6-digit PIN from your PC to immediately import all your syllabus data.
              </p>

              <form onSubmit={handlePairSubmit} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={7}
                    value={inputPairCode}
                    onChange={(e) => setInputPairCode(e.target.value)}
                    placeholder="Enter 6-digit PIN"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono font-bold text-white text-center tracking-widest focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={isPairingLoading || !inputPairCode.trim()}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    {isPairingLoading ? 'Syncing...' : 'Link Device'}
                  </button>
                </div>

                {pairSuccess && (
                  <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All PC data successfully linked & synced!
                  </p>
                )}
                {pairError && (
                  <p className="text-xs text-rose-400 font-bold animate-fade-in">
                    ⚠ {pairError}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Sync Status Details */}
        <div className="pt-2 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Linked User Account:</span>
            <span className="font-bold text-white font-mono">{user?.email || 'Active Account'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Last Sync Time:</span>
            <span className="font-bold text-cyan-400">
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
            </span>
          </div>
        </div>
      </div>

      {/* Authenticated User Account Card */}
      {user && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-md shrink-0">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {user.name}
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{user.provider === 'google' ? 'Google Auth' : 'Verified Account'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PWA Mobile App Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-white">
                {isInstalled ? 'SYLLABUS 3D is Installed' : 'Install Native Mobile / Desktop App'}
              </h4>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {isOnline ? '● Offline Ready' : '○ Offline Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Launch directly from your Home Screen with zero internet lag.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPwaModal(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/30 transition-all cursor-pointer shrink-0"
        >
          {isInstalled ? 'App Status' : 'Install PWA App 📲'}
        </button>
      </div>

      {/* Profile Details Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-brand-500" />
          <span>Aspirant Profile</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            Save Changes
          </button>
        </form>
      </div>

      {/* Backup & Restore Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-brand-500" />
          <span>Data Backup & Export (JSON)</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Save your complete syllabus progress, notes, mistakes, and revisions as a JSON file, or restore on another device.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (.json)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import Backup</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {importStatus === 'success' && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            ✓ Data backup successfully restored!
          </p>
        )}
        {importStatus === 'error' && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
            ⚠ Invalid JSON file format.
          </p>
        )}
      </div>

      {/* Danger Zone: Clean Slate & Reset Demo */}
      <div className="p-6 rounded-3xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          <span>Danger Zone: Clean Slate & Reset</span>
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Clear demo topics to start with a fresh blank canvas, or restore the default SSC CGL 2026 dataset.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {showClearConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  clearAllDemoData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Yes, Delete All Demo Data
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer"
            >
              Clear All Demo Data (Start Blank)
            </button>
          )}

          {showResetConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  resetToDemo();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Yes, Restore Demo Syllabus
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800 text-xs font-bold transition-all cursor-pointer"
            >
              Restore Demo Syllabus
            </button>
          )}
        </div>
      </div>

      <PWAInstallModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />
    </div>
  );
};
