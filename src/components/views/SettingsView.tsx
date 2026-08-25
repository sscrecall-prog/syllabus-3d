import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Smartphone,
  CheckCircle2,
  Trash2,
  User,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Target,
  Clock,
  Check
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { usePWA } from '../../hooks/usePWA';
import { PWAInstallModal } from '../modals/PWAInstallModal';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    currentExam,
    updateCurrentExamDetails,
    exportData,
    importData,
    resetToDemo,
    clearAllDemoData
  } = useSyllabus();

  const { user, logout, updateUserSession } = useAuth();
  const { isInstalled, isOnline } = usePWA();
  const [showPwaModal, setShowPwaModal] = useState(false);
  
  // Profile state
  const [name, setName] = useState(user?.name || profile.name);
  const [profileSaved, setProfileSaved] = useState(false);

  // Exam Countdown Settings state
  const [examName, setExamName] = useState(currentExam?.name || 'SSC CGL 2026');
  const [examDate, setExamDate] = useState(currentExam?.examDate || '2026-09-15');
  const [targetYear, setTargetYear] = useState<number>(currentExam?.targetYear || 2026);
  const [examSaved, setExamSaved] = useState(false);

  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sync state when currentExam changes
  useEffect(() => {
    if (currentExam) {
      setExamName(currentExam.name);
      setExamDate(currentExam.examDate);
      setTargetYear(currentExam.targetYear);
    }
  }, [currentExam]);

  // Calculate live remaining days for preview
  const daysRemaining = (() => {
    const target = new Date(examDate).getTime();
    const now = new Date().getTime();
    const diff = target - now;
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  })();

  const handleSaveExamSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentExamDetails({
      name: examName,
      examDate: examDate,
      targetYear: Number(targetYear)
    });
    soundManager.playCompleteChime();
    setExamSaved(true);
    setTimeout(() => setExamSaved(false), 3000);
  };

  const handleApplyPresetExam = (namePreset: string, yearPreset: number, offsetDays: number) => {
    soundManager.playClick();
    setExamName(namePreset);
    setTargetYear(yearPreset);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + offsetDays);
    setExamDate(futureDate.toISOString().split('T')[0]);
  };

  const handleAddDays = (days: number) => {
    soundManager.playClick();
    const current = new Date(examDate);
    current.setDate(current.getDate() + days);
    setExamDate(current.toISOString().split('T')[0]);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name });
    updateUserSession({ name });
    soundManager.playClick();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
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
    <div className="space-y-6 sm:space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-serif flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-[#596B35] dark:text-[#A4B879]" />
            <span>App Settings & Preferences</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#65675F] dark:text-[#85877E] mt-1">
            Customize your target exam date, live countdown clock, profile details, and data backup.
          </p>
        </div>

        {/* Quick Logout Button */}
        {showLogoutConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-[#B94A48] hover:bg-[#A33D3B] text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              Confirm Log Out
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="px-3 py-2 rounded-xl bg-[#EEEEE8] dark:bg-[#1D201A] text-xs font-semibold text-[#65675F] dark:text-[#A7AA9C] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#151713] hover:bg-rose-500/10 hover:text-[#B94A48] text-[#65675F] dark:text-[#A7AA9C] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold transition-all cursor-pointer shadow-subtle-depth"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        )}
      </div>

      {/* 1. EXAM COUNTDOWN & SCHEDULE CUSTOMIZER (PRIMARY REQUEST) */}
      <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#EEEEE8] dark:border-[#1D201A]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#DCE8B7] dark:bg-[#354126] text-[#596B35] dark:text-[#A4B879] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#11120F] dark:text-[#F4F4ED] font-serif">
                Exam Countdown & Target Schedule
              </h3>
              <p className="text-[11px] text-[#65675F] dark:text-[#85877E]">
                Modify your target exam name and exam date to update the live 3D countdown clock.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-lg text-xs font-bold font-mono bg-[#EEEEE8] dark:bg-[#1D201A] text-[#596B35] dark:text-[#A4B879]">
            {daysRemaining} Days Left
          </span>
        </div>

        <form onSubmit={handleSaveExamSettings} className="space-y-4">
          
          {/* Preset Exam Shortcuts */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-[#85877E] uppercase tracking-wider font-mono">
              Quick Exam Presets
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'SSC CGL 2026', year: 2026, days: 90 },
                { label: 'SSC CHSL 2026', year: 2026, days: 120 },
                { label: 'SSC CPO 2026', year: 2026, days: 75 },
                { label: 'RRB NTPC 2026', year: 2026, days: 100 },
                { label: 'SBI PO 2026', year: 2026, days: 60 },
                { label: 'UPSC CSE 2026', year: 2026, days: 180 }
              ].map(p => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => handleApplyPresetExam(p.label, p.year, p.days)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F7F6F0] dark:bg-[#1D201A] hover:bg-[#DCE8B7] dark:hover:bg-[#354126] border border-[#D8D8CF] dark:border-[#30342B] text-[#191A17] dark:text-[#F4F4ED] transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Exam Name */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-[#191A17] dark:text-[#F4F4ED]">
                Target Exam Name
              </label>
              <input
                type="text"
                value={examName}
                onChange={e => setExamName(e.target.value)}
                placeholder="e.g. SSC CGL 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold text-[#191A17] dark:text-white focus:outline-none focus:border-[#596B35]"
              />
            </div>

            {/* Target Year */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191A17] dark:text-[#F4F4ED]">
                Academic Year
              </label>
              <input
                type="number"
                value={targetYear}
                onChange={e => setTargetYear(Number(e.target.value))}
                min={2025}
                max={2035}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold text-[#191A17] dark:text-white focus:outline-none focus:border-[#596B35]"
              />
            </div>
          </div>

          {/* Exam Date Picker & Quick Adjusters */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#191A17] dark:text-[#F4F4ED]">
              Exam Target Date (Live Countdown Sync)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold text-[#191A17] dark:text-white focus:outline-none focus:border-[#596B35] cursor-pointer"
              />

              <div className="flex items-center gap-2">
                {[
                  { label: '+30 Days', days: 30 },
                  { label: '+60 Days', days: 60 },
                  { label: '+90 Days', days: 90 },
                  { label: '+180 Days', days: 180 }
                ].map(b => (
                  <button
                    type="button"
                    key={b.label}
                    onClick={() => handleAddDays(b.days)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-[#EEEEE8] dark:bg-[#1D201A] hover:bg-[#DCE8B7] dark:hover:bg-[#354126] text-[#65675F] hover:text-[#11120F] transition-colors cursor-pointer"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Bar */}
          <div className="p-3.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#596B35] dark:text-[#A4B879]" />
              <span className="text-xs font-bold text-[#191A17] dark:text-[#F4F4ED]">
                Live Countdown Preview:
              </span>
              <span className="text-xs text-[#65675F] dark:text-[#85877E]">
                {new Date(examDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <span className="text-xs font-extrabold font-mono text-[#596B35] dark:text-[#A4B879]">
              {daysRemaining} Days Remaining
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-98"
            >
              Save Exam Schedule
            </button>

            {examSaved && (
              <span className="text-xs text-[#4F7A45] font-bold flex items-center gap-1">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Exam Countdown updated across App!</span>
              </span>
            )}
          </div>
        </form>
      </div>

      {/* 2. Authenticated User Profile */}
      <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-4">
        <h3 className="text-base font-bold text-[#11120F] dark:text-[#F4F4ED] font-serif flex items-center gap-2">
          <User className="w-4 h-4 text-[#596B35]" />
          <span>Aspirant Profile</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-[#191A17] dark:text-[#F4F4ED] mb-1.5">
              Your Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold text-[#191A17] dark:text-white focus:outline-none focus:border-[#596B35]"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Save Profile
            </button>

            {profileSaved && (
              <span className="text-xs text-[#4F7A45] font-bold">
                ✓ Name updated!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* 3. PWA Mobile App Status Card */}
      <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#DCE8B7] dark:bg-[#354126] text-[#596B35] dark:text-[#A4B879] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#191A17] dark:text-[#F4F4ED]">
                {isInstalled ? 'SYLLABUS 3D is Installed' : 'Install Mobile / Desktop App'}
              </h4>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${isOnline ? 'bg-[#4F7A45]/20 text-[#4F7A45]' : 'bg-[#C49A3A]/20 text-[#C49A3A]'}`}>
                {isOnline ? '● Offline Ready' : '○ Offline Mode'}
              </span>
            </div>
            <p className="text-xs text-[#65675F] dark:text-[#85877E] mt-0.5">
              Launch directly from your Home Screen with zero internet lag.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPwaModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
        >
          {isInstalled ? 'App Status' : 'Install PWA App 📲'}
        </button>
      </div>

      {/* 4. Data Backup & Export (JSON) */}
      <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-4">
        <h3 className="text-base font-bold text-[#11120F] dark:text-[#F4F4ED] font-serif flex items-center gap-2">
          <Download className="w-4 h-4 text-[#596B35]" />
          <span>Data Backup & Export (JSON)</span>
        </h3>
        <p className="text-xs text-[#65675F] dark:text-[#85877E]">
          Save your complete syllabus progress, notes, mistakes, and revisions as a JSON file, or restore on another device.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] hover:bg-[#DCE8B7] dark:hover:bg-[#354126] text-[#191A17] dark:text-[#F4F4ED] text-xs font-bold border border-[#D8D8CF] dark:border-[#30342B] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (.json)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] hover:bg-[#DCE8B7] dark:hover:bg-[#354126] text-[#191A17] dark:text-[#F4F4ED] text-xs font-bold border border-[#D8D8CF] dark:border-[#30342B] transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import Backup</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {importStatus === 'success' && (
          <p className="text-xs text-[#4F7A45] font-bold">
            ✓ Data backup successfully restored!
          </p>
        )}
        {importStatus === 'error' && (
          <p className="text-xs text-[#B94A48] font-bold">
            ⚠ Invalid JSON file format.
          </p>
        )}
      </div>

      {/* PWA Modal */}
      <PWAInstallModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />
    </div>
  );
};
