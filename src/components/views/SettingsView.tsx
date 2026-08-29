import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import { useTimer } from '../../context/TimerContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Smartphone,
  CheckCircle2,
  Trash2,
  Calendar,
  LogOut,
  Target,
  Clock,
  Check,
  Palette,
  Shield,
  PictureInPicture2,
  Play,
  Flame,
  Star,
  Zap,
  Moon,
  Sun,
  Database,
  Edit2,
  Save
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { usePWA } from '../../hooks/usePWA';
import { PWAInstallModal } from '../modals/PWAInstallModal';

type SettingsTab = 'exam' | 'appearance' | 'timer' | 'data';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    currentExam,
    updateCurrentExamDetails,
    overallStats,
    exportData,
    importData,
    resetToDemo,
    clearAllDemoData
  } = useSyllabus();

  const { user, logout, updateUserSession } = useAuth();
  const { settings, updateSettings, showFloatingOverlay, openPermissionModal } = useTimer();
  const { theme, setTheme } = useTheme();
  const { isInstalled, isOnline } = usePWA();
  const [showPwaModal, setShowPwaModal] = useState(false);

  const [activeTab, setActiveTab] = useState<SettingsTab>('exam');

  // Profile Edit State
  const [name, setName] = useState(user?.name || profile.name);
  const [isEditingName, setIsEditingName] = useState(false);
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
  const [testLaunched, setTestLaunched] = useState(false);

  useEffect(() => {
    if (currentExam) {
      setExamName(currentExam.name);
      setExamDate(currentExam.examDate);
      setTargetYear(currentExam.targetYear);
    }
  }, [currentExam]);

  // Calculate live remaining days
  const daysRemaining = (() => {
    const target = new Date(examDate).getTime();
    const now = new Date().getTime();
    const diff = target - now;
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  })();

  const handleSaveExamSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentExamDetails({ name: examName, examDate: examDate, targetYear: Number(targetYear) });
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
    setIsEditingName(false);
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
    reader.onload = evt => {
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

  const ToggleSwitch: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => {
          soundManager.playClick();
          onChange(e.target.checked);
        }}
        className="sr-only peer"
      />
      <div className="w-10 h-5 bg-[#D8D8CF] dark:bg-[#292E42] rounded-full peer peer-checked:bg-[#596B35] dark:peer-checked:bg-[#7AA2F7] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-[#0B0B0D] after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-xs transition-colors" />
    </label>
  );

  return (
    <div className="space-y-4 sm:space-y-5 pb-20 max-w-4xl mx-auto select-none font-sans animate-fade-in">
      
      {/* ═══════════════════════════════════════════════════
          1. COMPACT PROFILE & LEVEL STRIP
          ═══════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B] shadow-subtle-depth flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Avatar + Name + Level Pill */}
        <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#596B35] to-[#3B4723] dark:from-[#7AA2F7] dark:to-[#415C9E] text-white dark:text-[#0B0B0D] flex items-center justify-center text-lg font-black shrink-0 shadow-md">
            {(user?.name || profile.name || 'A').charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            {isEditingName ? (
              <form onSubmit={handleSaveProfile} className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-xl bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#11120F] dark:text-[#C0CAF5] tracking-tight truncate font-serif">
                  {user?.name || profile.name || 'Aspirant'}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 rounded-lg hover:bg-[#F7F6F0] dark:hover:bg-[#1F2335] text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer transition-colors"
                  title="Edit Name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] font-mono text-[#65675F] dark:text-[#A9B1D6] flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#354126] dark:text-[#7AA2F7]">
                Lvl {profile.level} • {profile.levelTitle}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                <Flame className="w-3.5 h-3.5 fill-current" />
                {profile.currentStreak}d Streak
              </span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {overallStats.completedCount}/{overallStats.totalTopics} Topics ({overallStats.completionPercentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Logout Action */}
        <div className="shrink-0 w-full sm:w-auto flex justify-end">
          {showLogoutConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] text-xs font-bold text-[#65675F] dark:text-[#A9B1D6] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-rose-500/15 hover:text-rose-500 dark:hover:bg-rose-500/20 text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          2. CONCISE CATEGORY NAVIGATION TABS
          ═══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between p-1 rounded-2xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B] shadow-xs gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'exam' as SettingsTab, label: 'Exam Target', icon: Target },
          { id: 'appearance' as SettingsTab, label: 'Appearance', icon: Palette },
          { id: 'timer' as SettingsTab, label: 'Focus & Timer', icon: Clock },
          { id: 'data' as SettingsTab, label: 'Backup & App', icon: Database }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playClick();
                setActiveTab(tab.id);
              }}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                isActive
                  ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-sm'
                  : 'text-[#65675F] dark:text-[#A9B1D6] hover:bg-[#F7F6F0] dark:hover:bg-[#1F2335]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════
          3. TAB CONTENT SECTIONS
          ═══════════════════════════════════════════════════ */}

      {/* TAB 1: EXAM TARGET & COUNTDOWN CONFIG */}
      {activeTab === 'exam' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B] shadow-subtle-depth space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#EEEEE8] dark:border-[#24283B] pb-3">
            <div>
              <h3 className="text-sm font-black text-[#11120F] dark:text-[#C0CAF5] font-serif uppercase tracking-wide">
                Exam Target & Live Countdown
              </h3>
              <p className="text-[11px] text-[#65675F] dark:text-[#A9B1D6]">
                Configure your target exam name and exam date to sync the live flip clock.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#354126] dark:text-[#7AA2F7]">
              {daysRemaining} Days Left
            </span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#85877E] uppercase tracking-wider block font-mono">
              Quick Exam Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
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
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#0B0B0D] text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42] transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveExamSettings} className="space-y-3.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-[#85877E] uppercase tracking-wider block font-mono">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  placeholder="e.g. SSC CGL 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#85877E] uppercase tracking-wider block font-mono">
                  Target Year
                </label>
                <input
                  type="number"
                  value={targetYear}
                  onChange={e => setTargetYear(Number(e.target.value))}
                  min={2025}
                  max={2035}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
                />
              </div>
            </div>

            {/* Exam Date & Adjusters */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#85877E] uppercase tracking-wider block font-mono">
                Exam Date
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  {[{ label: '+30d', days: 30 }, { label: '+60d', days: 60 }, { label: '+90d', days: 90 }, { label: '+180d', days: 180 }].map(b => (
                    <button
                      type="button"
                      key={b.label}
                      onClick={() => handleAddDays(b.days)}
                      className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#0B0B0D] text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42] transition-colors cursor-pointer"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#11120F] hover:bg-[#596B35] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Schedule</span>
              </button>
              {examSaved && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Countdown synced across app!</span>
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: APPEARANCE & THEME */}
      {activeTab === 'appearance' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B] shadow-subtle-depth space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#EEEEE8] dark:border-[#24283B] pb-3">
            <div>
              <h3 className="text-sm font-black text-[#11120F] dark:text-[#C0CAF5] font-serif uppercase tracking-wide">
                Color Theme & Palette
              </h3>
              <p className="text-[11px] text-[#65675F] dark:text-[#A9B1D6]">
                Switch between high-contrast Tokyo Night Dark and Classic Paper Light mode.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#354126] dark:text-[#7AA2F7] capitalize">
              {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setTheme('dark');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                theme === 'dark'
                  ? 'bg-[#1F2335] border-[#7AA2F7] ring-2 ring-[#7AA2F7]/30 shadow-sm'
                  : 'bg-[#F7F6F0] dark:bg-[#16161E] border-[#D8D8CF] dark:border-[#292E42] opacity-70 hover:opacity-100'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#16161E] border border-[#292E42] flex items-center justify-center text-[#7AA2F7] shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#11120F] dark:text-white block">
                    Tokyo Night Dark
                  </span>
                  {theme === 'dark' && <Check className="w-4 h-4 text-[#7AA2F7]" />}
                </div>
                <span className="text-[10px] text-[#85877E] dark:text-[#A9B1D6] block mt-0.5">
                  Deep dark glassmorphism for night study sessions
                </span>
              </div>
            </button>

            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setTheme('light');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                theme === 'light'
                  ? 'bg-[#FAF8F5] border-[#596B35] ring-2 ring-[#596B35]/30 shadow-sm'
                  : 'bg-[#F7F6F0] dark:bg-[#16161E] border-[#D8D8CF] dark:border-[#292E42] opacity-70 hover:opacity-100'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-[#D8D8CF] flex items-center justify-center text-[#596B35] shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#11120F] dark:text-white block">
                    Classic Paper Light
                  </span>
                  {theme === 'light' && <Check className="w-4 h-4 text-[#596B35]" />}
                </div>
                <span className="text-[10px] text-[#85877E] dark:text-[#A9B1D6] block mt-0.5">
                  Warm academic paper tones for bright daylight reading
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: FOCUS CHAMBER & FLOATING TIMER */}
      {activeTab === 'timer' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B] shadow-subtle-depth space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#EEEEE8] dark:border-[#24283B] pb-3">
            <div>
              <h3 className="text-sm font-black text-[#11120F] dark:text-[#C0CAF5] font-serif uppercase tracking-wide">
                Floating Timer & Picture-in-Picture
              </h3>
              <p className="text-[11px] text-[#65675F] dark:text-[#A9B1D6]">
                Control the draggable timer overlay that stays active while studying notes.
              </p>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                showFloatingOverlay();
                setTestLaunched(true);
                setTimeout(() => setTestLaunched(false), 2500);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#596B35] hover:bg-[#47572a] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{testLaunched ? 'Visible!' : 'Preview Pill'}</span>
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              { label: 'Floating Timer Enabled', desc: 'Show compact draggable pill when focus timer is active', checked: settings.enabled, key: 'enabled' as const },
              { label: 'Auto-launch on Background', desc: 'Minimize to Picture-in-Picture when switching browser tabs', checked: settings.showWhenBackgrounded, key: 'showWhenBackgrounded' as const },
              { label: 'Quick Pause / Resume Controls', desc: '1-tap control button directly on the floating pill', checked: settings.showPauseButton, key: 'showPauseButton' as const },
              { label: 'Remember Draggable Position', desc: 'Keep the floating timer at the exact spot you placed it', checked: settings.rememberPosition, key: 'rememberPosition' as const }
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-2xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42]">
                <div className="pr-3">
                  <span className="text-xs font-bold text-[#11120F] dark:text-[#C0CAF5] block">{item.label}</span>
                  <span className="text-[10px] text-[#85877E] dark:text-[#787C99]">{item.desc}</span>
                </div>
                <ToggleSwitch
                  checked={item.checked}
                  onChange={val => updateSettings({ [item.key]: val })}
                />
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] space-y-1.5">
                <span className="text-xs font-bold text-[#11120F] dark:text-[#C0CAF5] block">Widget Width</span>
                <div className="flex gap-2">
                  {(['standard', 'compact'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        updateSettings({ size: s });
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        settings.size === s
                          ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-xs'
                          : 'bg-white dark:bg-[#16161E] text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42]'
                      }`}
                    >
                      {s === 'standard' ? 'Standard (360px)' : 'Compact (320px)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#11120F] dark:text-[#C0CAF5]">Opacity</span>
                  <span className="text-xs font-mono font-bold text-[#596B35] dark:text-[#7AA2F7]">
                    {Math.round((settings.opacity || 0.95) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={Math.round((settings.opacity || 0.95) * 100)}
                  onChange={e => updateSettings({ opacity: Number(e.target.value) / 100 })}
                  className="w-full accent-[#596B35] dark:accent-[#7AA2F7] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP, RESTORE & STORAGE */}
      {activeTab === 'data' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B] shadow-subtle-depth space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#EEEEE8] dark:border-[#24283B] pb-3">
            <div>
              <h3 className="text-sm font-black text-[#11120F] dark:text-[#C0CAF5] font-serif uppercase tracking-wide">
                Data Backup & Device Storage
              </h3>
              <p className="text-[11px] text-[#65675F] dark:text-[#A9B1D6]">
                Export your syllabus progress to JSON or install the offline web application.
              </p>
            </div>
          </div>

          {/* Backup Action Buttons */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#596B35] hover:bg-[#47572a] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export Backup (.json)</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-[#EEEEE8] dark:hover:bg-[#24283B] text-[#11120F] dark:text-[#C0CAF5] text-xs font-bold border border-[#D8D8CF] dark:border-[#292E42] transition-all cursor-pointer active:scale-95">
              <Upload className="w-4 h-4 text-[#596B35] dark:text-[#7AA2F7]" />
              <span>Import Backup</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={() => setShowPwaModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-[#EEEEE8] dark:hover:bg-[#24283B] text-[#11120F] dark:text-[#C0CAF5] text-xs font-bold border border-[#D8D8CF] dark:border-[#292E42] transition-all cursor-pointer active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-[#596B35] dark:text-[#7AA2F7]" />
              <span>{isInstalled ? 'App Installed ✓' : 'Install PWA App 📲'}</span>
            </button>
          </div>

          {importStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Backup restored successfully! All topics and chapters synced.
              </span>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Invalid JSON format. Please verify your backup file.
              </span>
            </div>
          )}

          {/* Danger Zone */}
          <div className="pt-3 border-t border-[#EEEEE8] dark:border-[#24283B] space-y-2">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block font-mono">
              ⚠ Danger Zone
            </span>
            <div className="flex flex-wrap gap-2">
              {showResetConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      resetToDemo();
                      setShowResetConfirm(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-xs"
                  >
                    Yes, Reset Demo
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] text-xs font-bold text-[#65675F] dark:text-[#A9B1D6] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-rose-500/15 hover:text-rose-500 text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Data</span>
                </button>
              )}

              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      clearAllDemoData();
                      setShowClearConfirm(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-xs"
                  >
                    Yes, Wipe All Data
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] text-xs font-bold text-[#65675F] dark:text-[#A9B1D6] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-rose-500/15 hover:text-rose-500 text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Custom Data</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Modal */}
      <PWAInstallModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />
    </div>
  );
};
