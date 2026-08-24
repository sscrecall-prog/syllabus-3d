import React, { useState } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
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
  ExternalLink
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
    currentExam,
    exams
  } = useSyllabus();

  const { isInstalled, isOnline } = usePWA();
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [name, setName] = useState(profile.name);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name });
    soundManager.playClick();
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

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-brand-500" />
          <span>App Settings & Preferences</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize profile details, backup your syllabus data, or install the app for 100% offline access.
        </p>
      </div>

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
            className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm transition-all"
          >
            Save Changes
          </button>
        </form>
      </div>

      {/* Backup & Restore Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-brand-500" />
          <span>Data Backup & Sync (JSON)</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Save your complete syllabus progress, notes, mistakes, and revisions as a JSON file, or restore on another laptop or mobile.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all"
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
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Yes, Delete All Demo Data
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-xs font-bold transition-all"
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
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md"
              >
                Yes, Restore Demo Syllabus
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800 text-xs font-bold transition-all"
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
