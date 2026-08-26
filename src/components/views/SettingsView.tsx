import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import { useTimer } from '../../context/TimerContext';
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
  Check,
  Palette,
  Shield,
  PictureInPicture2,
  Play,
  Star,
  Trophy,
  Flame,
  TrendingUp,
  BookOpen,
  Award,
  Zap,
  ChevronRight,
  Database,
  HardDrive,
  Lock,
  Eye,
  EyeOff,
  Moon,
  Sun
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { usePWA } from '../../hooks/usePWA';
import { PWAInstallModal } from '../modals/PWAInstallModal';
import { ThemeSystemMode } from '../layout/Header';

interface SettingsViewProps {
  themeSystem?: ThemeSystemMode;
  onSetThemeSystem?: (theme: ThemeSystemMode) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeSystem = 'academic',
  onSetThemeSystem
}) => {
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
  const [testLaunched, setTestLaunched] = useState(false);
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
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleExport = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'syllabus_3d_backup_' + new Date().toISOString().slice(0, 10) + '.json';
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
        if (success) { setImportStatus('success'); soundManager.playCompleteChime(); }
        else { setImportStatus('error'); }
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = async () => { soundManager.playClick(); await logout(); };

  /* ── Toggle Helper ── */
  const ToggleSwitch: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => { soundManager.playClick(); onChange(e.target.checked); }}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-slate-300 dark:bg-[#333] rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-teal-500 peer-checked:to-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm transition-all" />
    </label>
  );

  /* ── Level Progress Ring ── */
  const xpPercent = Math.min((profile.xp % 1000) / 10, 100);
  const ringSize = 80;
  const ringStroke = 5;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (xpPercent / 100) * ringCircumference;

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 max-w-4xl mx-auto">

      {/* ═══════════════════════════════════════════════════
          1. PROFILE HERO CARD
          ═══════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-[28px] bg-white/60 dark:bg-[#161616]/80 backdrop-blur-2xl border border-white/30 dark:border-[#2A2A2A] shadow-2xl shadow-[#D4AF37]/5">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-[#D4AF37]/15 to-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-gradient-to-tr from-teal-500/10 to-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar + Level Ring */}
            <div className="relative shrink-0">
              <svg width={ringSize} height={ringSize} className="transform -rotate-90">
                <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="currentColor" className="text-slate-200 dark:text-[#2A2A2A]" strokeWidth={ringStroke} />
                <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="url(#profileGrad)" strokeWidth={ringStroke} strokeLinecap="round" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} className="transition-all duration-1000" />
                <defs>
                  <linearGradient id="profileGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A22E] flex items-center justify-center text-white text-xl font-black shadow-lg shadow-[#D4AF37]/30">
                  {(user?.name || profile.name || 'S').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-black shadow-md">
                Lv.{profile.level}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-[#F5E6C8] tracking-tight">
                  {user?.name || profile.name || 'Student'}
                </h2>
                <p className="text-xs font-semibold text-[#6B7280] flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-purple-500" />
                  <span>{profile.levelTitle}</span>
                  <span className="w-1 h-1 rounded-full bg-[#6B7280]/40" />
                  <span className="font-mono text-[#D4AF37]">{profile.xp} XP</span>
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">{profile.currentStreak}d Streak</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{overallStats.completedCount}/{overallStats.totalTopics} Topics</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{overallStats.totalStudyHours.toFixed(0)}h Study</span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="shrink-0">
              {showLogoutConfirm ? (
                <div className="flex items-center gap-2">
                  <button onClick={handleLogout} className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors">
                    Confirm
                  </button>
                  <button onClick={() => setShowLogoutConfirm(false)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1E1E1E] text-xs font-semibold text-[#6B7280] cursor-pointer">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/70 dark:bg-[#1A1A1A]/70 hover:bg-rose-500/10 hover:text-rose-500 text-[#6B7280] border border-white/40 dark:border-[#2A2A2A] text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Edit Name */}
          <form onSubmit={handleSaveProfile} className="mt-5 pt-4 border-t border-slate-200/60 dark:border-[#252525]">
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">Display Name</label>
            <div className="flex items-center gap-2.5 max-w-md">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-[#1A1A1A]/70 border border-slate-200/60 dark:border-[#2A2A2A] text-xs font-bold text-[#171717] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/50 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A22E] text-[#171717] text-xs font-black shadow-md shadow-[#D4AF37]/20 hover:shadow-lg transition-all cursor-pointer active:scale-[0.97]"
              >
                {profileSaved ? '✓ Saved!' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          2. VISUAL THEME SELECTOR
          ═══════════════════════════════════════════════════ */}
      <div className="rounded-[24px] bg-white/60 dark:bg-[#161616]/80 backdrop-blur-2xl border border-white/30 dark:border-[#2A2A2A] shadow-lg overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#171717] dark:text-[#F5E6C8]">Visual Theme System</h3>
              <p className="text-[11px] text-[#6B7280]">Choose your preferred design language</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Academic Olive */}
          <div
            onClick={() => { if (onSetThemeSystem) { soundManager.playClick(); onSetThemeSystem('academic'); } }}
            className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 active:scale-[0.98] ${
              themeSystem === 'academic'
                ? 'border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/5 to-amber-500/5 shadow-md shadow-[#D4AF37]/10'
                : 'border-slate-200/60 dark:border-[#2A2A2A] bg-white/50 dark:bg-[#1A1A1A]/50 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#171717] dark:text-[#F5E6C8]">🌿 Academic Olive</span>
              {themeSystem === 'academic' && (
                <span className="px-2.5 py-0.5 text-[9px] font-black rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C9A22E] text-[#171717] shadow-sm">ACTIVE</span>
              )}
            </div>
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              Warm neutral paper, deep charcoal typography, and olive accents. Built for long 6–8hr study sessions.
            </p>
            <div className="flex gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#F7F6F0] border border-slate-200" />
              <span className="w-5 h-5 rounded-full bg-[#596B35]" />
              <span className="w-5 h-5 rounded-full bg-[#11120F]" />
              <span className="w-5 h-5 rounded-full bg-[#D8D8CF]" />
            </div>
          </div>

          {/* Spatial VisionOS Glass */}
          <div
            onClick={() => { if (onSetThemeSystem) { soundManager.playCompleteChime(); onSetThemeSystem('spatial'); } }}
            className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 active:scale-[0.98] ${
              themeSystem === 'spatial'
                ? 'border-cyan-400 bg-gradient-to-br from-cyan-500/10 to-purple-500/5 shadow-md shadow-cyan-500/10'
                : 'border-slate-200/60 dark:border-[#2A2A2A] bg-white/50 dark:bg-[#1A1A1A]/50 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#171717] dark:text-[#F5E6C8]">🔮 Spatial Glass</span>
              {themeSystem === 'spatial' && (
                <span className="px-2.5 py-0.5 text-[9px] font-black rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-sm">ACTIVE</span>
              )}
            </div>
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              Frosted glass panels, holographic glow, and cosmic ambient depth. Futuristic VisionOS-inspired.
            </p>
            <div className="flex gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700" />
              <span className="w-5 h-5 rounded-full bg-cyan-400" />
              <span className="w-5 h-5 rounded-full bg-purple-500" />
              <span className="w-5 h-5 rounded-full bg-teal-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          3. EXAM COUNTDOWN CONFIGURATOR
          ═══════════════════════════════════════════════════ */}
      <div className="rounded-[24px] bg-white/60 dark:bg-[#161616]/80 backdrop-blur-2xl border border-white/30 dark:border-[#2A2A2A] shadow-lg overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/20 flex items-center justify-center text-teal-500">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#171717] dark:text-[#F5E6C8]">Exam Countdown & Target</h3>
              <p className="text-[11px] text-[#6B7280]">Set your exam date to sync the live countdown clock</p>
            </div>
          </div>
          <div className={`px-3.5 py-1.5 rounded-xl text-xs font-black font-mono ${
            daysRemaining <= 30 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
            daysRemaining <= 90 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          }`}>
            {daysRemaining}d left
          </div>
        </div>

        <form onSubmit={handleSaveExamSettings} className="p-5 sm:p-6 space-y-5">
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
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
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/70 dark:bg-[#1A1A1A]/70 hover:bg-[#D4AF37]/15 hover:text-[#D4AF37] border border-slate-200/60 dark:border-[#2A2A2A] text-[#6B7280] transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Exam Name</label>
              <input
                type="text" value={examName} onChange={e => setExamName(e.target.value)}
                placeholder="e.g. SSC CGL 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-[#1A1A1A]/70 border border-slate-200/60 dark:border-[#2A2A2A] text-xs font-bold text-[#171717] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Year</label>
              <input
                type="number" value={targetYear} onChange={e => setTargetYear(Number(e.target.value))} min={2025} max={2035}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-[#1A1A1A]/70 border border-slate-200/60 dark:border-[#2A2A2A] text-xs font-bold text-[#171717] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Date + Quick Adjusters */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Exam Date</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-[#1A1A1A]/70 border border-slate-200/60 dark:border-[#2A2A2A] text-xs font-bold text-[#171717] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/50 focus:outline-none cursor-pointer"
              />
              <div className="flex items-center gap-2">
                {[{ label: '+30d', days: 30 }, { label: '+60d', days: 60 }, { label: '+90d', days: 90 }, { label: '+180d', days: 180 }].map(b => (
                  <button
                    type="button" key={b.label}
                    onClick={() => handleAddDays(b.days)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 dark:bg-[#1E1E1E] hover:bg-[#D4AF37]/15 hover:text-[#D4AF37] text-[#6B7280] transition-all cursor-pointer"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/5 to-emerald-500/5 border border-teal-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-500" />
              <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8]">Countdown:</span>
              <span className="text-xs text-[#6B7280]">
                {new Date(examDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <span className="text-xs font-black font-mono text-teal-600 dark:text-teal-400">
              {daysRemaining} Days
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A22E] text-[#171717] text-xs font-black shadow-md shadow-[#D4AF37]/20 hover:shadow-lg transition-all cursor-pointer active:scale-[0.97]"
            >
              Save Schedule
            </button>
            {examSaved && (
              <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Countdown synced across app!</span>
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ═══════════════════════════════════════════════════
          4. FLOATING BACKGROUND TIMER
          ═══════════════════════════════════════════════════ */}
      <div className="rounded-[24px] bg-white/60 dark:bg-[#161616]/80 backdrop-blur-2xl border border-white/30 dark:border-[#2A2A2A] shadow-lg overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center text-teal-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#171717] dark:text-[#F5E6C8]">Floating Timer</h3>
              <p className="text-[11px] text-[#6B7280]">Always-visible draggable countdown pill</p>
            </div>
          </div>
          <button
            onClick={() => { soundManager.playClick(); showFloatingOverlay(); setTestLaunched(true); setTimeout(() => setTestLaunched(false), 2500); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500/15 to-emerald-500/10 hover:from-teal-500/25 hover:to-emerald-500/15 border border-teal-500/25 text-teal-600 dark:text-teal-400 text-xs font-bold transition-all cursor-pointer active:scale-[0.97]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{testLaunched ? 'Visible!' : 'Preview'}</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-3">
          {/* Toggle Items */}
          {[
            { label: 'Floating Timer Enabled', desc: 'Show compact draggable pill when focus timer is active', checked: settings.enabled, key: 'enabled' as const },
            { label: 'Show in Background', desc: 'Auto-launch Android overlay or Picture-in-Picture', checked: settings.showWhenBackgrounded, key: 'showWhenBackgrounded' as const },
            { label: 'Pause / Resume Button', desc: 'Quick 1-tap circular control on the floating pill', checked: settings.showPauseButton, key: 'showPauseButton' as const },
            { label: 'Remember Position', desc: 'Keep floating timer where you placed it across sessions', checked: settings.rememberPosition, key: 'rememberPosition' as const },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-[#1A1A1A]/50 border border-slate-200/50 dark:border-[#252525] hover:border-teal-500/20 transition-all">
              <div className="pr-3">
                <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8] block">{item.label}</span>
                <span className="text-[10px] text-[#6B7280]">{item.desc}</span>
              </div>
              <ToggleSwitch
                checked={item.checked}
                onChange={val => updateSettings({ [item.key]: val })}
              />
            </div>
          ))}

          {/* Size & Opacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-[#1A1A1A]/50 border border-slate-200/50 dark:border-[#252525] space-y-2">
              <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8] block">Widget Size</span>
              <div className="flex gap-2">
                {(['standard', 'compact'] as const).map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => { soundManager.playClick(); updateSettings({ size: s }); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      settings.size === s
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm'
                        : 'bg-white/70 dark:bg-[#1E1E1E] text-[#6B7280] border border-slate-200/60 dark:border-[#2A2A2A]'
                    }`}
                  >
                    {s === 'standard' ? 'Standard (360dp)' : 'Compact (320dp)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-[#1A1A1A]/50 border border-slate-200/50 dark:border-[#252525] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8]">Opacity</span>
                <span className="text-xs font-mono font-bold text-teal-500">{Math.round((settings.opacity || 0.95) * 100)}%</span>
              </div>
              <input
                type="range" min="50" max="100"
                value={Math.round((settings.opacity || 0.95) * 100)}
                onChange={e => updateSettings({ opacity: Number(e.target.value) / 100 })}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Android Permission */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/5 to-cyan-500/5 border border-teal-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 block">Native Overlay & PiP</span>
              <span className="text-[10px] text-[#6B7280]">Grant overlay permission on Android for floating above apps</span>
            </div>
            <button
              onClick={() => { soundManager.playClick(); openPermissionModal(); }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 hover:shadow-lg active:scale-[0.97] transition-all shrink-0 cursor-pointer"
            >
              Check Permissions
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          5. PWA INSTALL STATUS
          ═══════════════════════════════════════════════════ */}
      <div className="rounded-[24px] bg-white/60 dark:bg-[#161616]/80 backdrop-blur-2xl border border-white/30 dark:border-[#2A2A2A] shadow-lg overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-[#171717] dark:text-[#F5E6C8]">
                  {isInstalled ? 'App Installed ✓' : 'Install Mobile / Desktop App'}
                </h4>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {isOnline ? '● Online' : '○ Offline'}
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Launch directly from Home Screen with zero-lag offline access
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPwaModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer shrink-0 active:scale-[0.97]"
          >
            {isInstalled ? 'App Status' : 'Install App 📲'}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          6. DATA BACKUP & EXPORT
          ═══════════════════════════════════════════════════ */}
      <div className="rounded-[24px] bg-white/60 dark:bg-[#161616]/80 backdrop-blur-2xl border border-white/30 dark:border-[#2A2A2A] shadow-lg overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#171717] dark:text-[#F5E6C8]">Data Backup & Export</h3>
              <p className="text-[11px] text-[#6B7280]">Save your complete progress as JSON or restore from backup</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 dark:bg-[#1A1A1A]/70 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 text-[#171717] dark:text-[#F5E6C8] text-xs font-bold border border-slate-200/60 dark:border-[#2A2A2A] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span>Export Backup (.json)</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 dark:bg-[#1A1A1A]/70 hover:bg-blue-500/10 hover:border-blue-500/30 text-[#171717] dark:text-[#F5E6C8] text-xs font-bold border border-slate-200/60 dark:border-[#2A2A2A] transition-all cursor-pointer">
              <Upload className="w-4 h-4 text-blue-500" />
              <span>Import Backup</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          {importStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Backup restored successfully!</span>
            </div>
          )}
          {importStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Invalid JSON format. Please check your file.</span>
            </div>
          )}

          {/* Danger Zone */}
          <div className="pt-3 border-t border-slate-200/50 dark:border-[#252525]">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-2">⚠ Danger Zone</p>
            <div className="flex flex-wrap gap-2">
              {showResetConfirm ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => { resetToDemo(); setShowResetConfirm(false); }} className="px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-sm">
                    Yes, Reset All
                  </button>
                  <button onClick={() => setShowResetConfirm(false)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1E1E1E] text-xs font-semibold text-[#6B7280] cursor-pointer">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/70 dark:bg-[#1A1A1A]/70 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 text-[#6B7280] border border-slate-200/60 dark:border-[#2A2A2A] text-xs font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Demo</span>
                </button>
              )}

              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => { clearAllDemoData(); setShowClearConfirm(false); }} className="px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-sm">
                    Yes, Clear All
                  </button>
                  <button onClick={() => setShowClearConfirm(false)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1E1E1E] text-xs font-semibold text-[#6B7280] cursor-pointer">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/70 dark:bg-[#1A1A1A]/70 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 text-[#6B7280] border border-slate-200/60 dark:border-[#2A2A2A] text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Data</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PWA Modal */}
      <PWAInstallModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />
    </div>
  );
};
