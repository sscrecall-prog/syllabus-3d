import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import { useTimer } from '../../context/TimerContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Download,
  Upload,
  RotateCcw,
  Smartphone,
  CheckCircle2,
  Trash2,
  LogOut,
  Target,
  Clock,
  Check,
  Palette,
  Play,
  Flame,
  Moon,
  Sun,
  Database,
  Edit2,
  Save,
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  Sliders,
  Award,
  Camera,
  User,
  Image as ImageIcon,
  HardDrive,
  FileCheck2,
  RefreshCw,
  BookOpen,
  Zap
} from 'lucide-react';
import { soundManager, AudioSettings } from '../../utils/soundEffects';
import { usePWA } from '../../hooks/usePWA';
import { PWAInstallModal } from '../modals/PWAInstallModal';

type SettingsTab = 'exam' | 'appearance' | 'sound' | 'timer' | 'data';

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
    clearAllDemoData,
    exams,
    plannerTasks,
    revisions,
    top3Targets,
    reflectionsHistory,
    lastSavedAt,
    isAutoSaving
  } = useSyllabus();

  const { user, logout, updateUserSession } = useAuth();
  const { updateSettings, showFloatingOverlay, settings } = useTimer();
  const { theme, setTheme } = useTheme();
  const { isInstalled,} = usePWA();
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

  // Approximate local storage usage in KB
  const storageUsageKb = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    try {
      let total = 0;
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += (localStorage[x].length + x.length) * 2;
        }
      }
      return Math.max(1, Math.round(total / 1024));
    } catch {
      return 12;
    }
  }, [exams, profile, plannerTasks, revisions, top3Targets, reflectionsHistory]);

  // Sound & Motivation Audio state
  const [audioConfig, setAudioConfig] = useState<AudioSettings>(() => soundManager.getSettings());

  const handleUpdateAudio = (partial: Partial<AudioSettings>) => {
    soundManager.updateSettings(partial);
    const updated = soundManager.getSettings();
    setAudioConfig(updated);
  };

  // Avatar Upload State & Handlers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarNotice, setAvatarNotice] = useState(false);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // High quality client-side resize to 256x256 WebP/JPEG
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          updateProfile({ avatarUrl: compressedDataUrl });
          updateUserSession({ avatarUrl: compressedDataUrl });
          soundManager.playCompleteChime();
          setAvatarNotice(true);
          setTimeout(() => setAvatarNotice(false), 3000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    soundManager.playClick();
    updateProfile({ avatarUrl: undefined });
    updateUserSession({ avatarUrl: undefined });
    setAvatarNotice(true);
    setTimeout(() => setAvatarNotice(false), 3000);
  };

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
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-20 max-w-4xl mx-auto select-none font-sans animate-fade-in">
      
      {/* ═══════════════════════════════════════════════════
          1. EXECUTIVE PROFILE & LEVEL STRIP
          ═══════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        {/* Top ambient accent glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#596B35] dark:via-[#7AA2F7] to-transparent opacity-60" />

        {/* Hidden File Input for Avatar Photo */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
          onChange={handleAvatarFileChange}
        />

        {/* Left: Avatar + Name + Level Badges */}
        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
          {/* Avatar Squircle with Dual Ring */}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#596B35] to-[#2E371B] dark:from-[#7AA2F7] dark:to-[#3D5BA9] text-white dark:text-[#0B0B0D] flex items-center justify-center text-xl sm:text-2xl font-black shadow-md cursor-pointer overflow-hidden relative border-2 border-white dark:border-[#272730] active:scale-95 transition-transform"
              title="Click to Upload Profile Photo"
            >
              {(profile.avatarUrl || user?.avatarUrl) ? (
                <img
                  src={profile.avatarUrl || user?.avatarUrl}
                  alt={user?.name || profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(user?.name || profile.name || 'A').charAt(0).toUpperCase()}</span>
              )}

              {/* Hover Blur Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity backdrop-blur-xs">
                <Camera className="w-4 h-4 mb-0.5" />
                <span>Upload</span>
              </div>
            </button>

            {/* Floating Camera Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black border-2 border-white dark:border-[#18181D] flex items-center justify-center shadow-xs cursor-pointer active:scale-90 hover:scale-110 transition-transform"
              title="Change Profile Photo"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            {isEditingName ? (
              <form onSubmit={handleSaveProfile} className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] dark:bg-[#14151F] border border-[#D8D8CF] dark:border-[#272730] text-sm font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black text-xs font-black shadow-xs cursor-pointer"
                >
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight uppercase truncate">
                  {user?.name || profile.name || 'Aspirant'}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 rounded-lg hover:bg-[#FAF9F5] dark:hover:bg-[#242533] text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer transition-colors"
                  title="Edit Name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {(profile.avatarUrl || user?.avatarUrl) && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 cursor-pointer transition-colors"
                    title="Remove Photo and use initial letter"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            )}

            {/* Micro-Badges Strip (No Raw Emojis!) */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#65675F] dark:text-[#A1A1AA] flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                <Zap className="w-3 h-3 fill-current" />
                <span>Lvl {profile.level} • {profile.levelTitle}</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25">
                <Flame className="w-3 h-3 fill-current" />
                <span>{profile.currentStreak}d Streak</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <CheckCircle2 className="w-3 h-3" />
                <span>{overallStats.completedCount}/{overallStats.totalTopics} Topics ({overallStats.completionPercentage}%)</span>
              </span>
            </div>

            {avatarNotice && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-fade-in pt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Profile picture updated!</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Logout Action */}
        <div className="shrink-0 w-full sm:w-auto flex justify-end">
          {showLogoutConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shadow-xs cursor-pointer"
              >
                Confirm Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3.5 py-2 rounded-xl bg-[#FAF9F5] dark:bg-[#20212E] text-xs font-bold text-[#65675F] dark:text-[#A1A1AA] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF9F5] dark:bg-[#20212E] hover:bg-rose-500/15 hover:text-rose-500 dark:hover:bg-rose-500/20 text-[#65675F] dark:text-[#A1A1AA] border border-[#D8D8CF] dark:border-[#272730] text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          2. SEGMENTED CATEGORY NAVIGATION TABS
          ═══════════════════════════════════════════════════ */}
      <div className="p-1.5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'exam' as SettingsTab, label: 'Exam Target', icon: Target },
          { id: 'appearance' as SettingsTab, label: 'Appearance', icon: Palette },
          { id: 'sound' as SettingsTab, label: 'Sound & Audio', icon: Volume2 },
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
              className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                isActive
                  ? 'bg-[#11120F] dark:bg-white text-white dark:text-black shadow-xs font-black'
                  : 'text-[#65675F] dark:text-[#94A3B8] hover:bg-[#FAF9F5] dark:hover:bg-[#20212E] hover:text-[#11120F] dark:hover:text-white'
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
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-4 animate-fade-in relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEEEE8] dark:border-[#242533] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-tight">
                  Exam Target & Live Countdown
                </h3>
                <p className="text-xs text-[#65675F] dark:text-[#94A3B8] font-medium">
                  Configure your target exam name and exam date to sync the live flip clock.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0 self-start sm:self-auto">
              <Clock className="w-3.5 h-3.5" />
              <span>{daysRemaining} Days Left</span>
            </span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold text-[#85877E] uppercase tracking-wider block flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Quick Exam Presets</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'SSC CGL 2026', year: 2026, days: 90 },
                { label: 'SSC CHSL 2026', year: 2026, days: 120 },
                { label: 'SSC CPO 2026', year: 2026, days: 75 },
                { label: 'RRB NTPC 2026', year: 2026, days: 100 },
                { label: 'SBI PO 2026', year: 2026, days: 60 },
                { label: 'UPSC CSE 2026', year: 2026, days: 180 }
              ].map(p => {
                const isSelected = examName.toLowerCase() === p.label.toLowerCase();
                return (
                  <button
                    type="button"
                    key={p.label}
                    onClick={() => handleApplyPresetExam(p.label, p.year, p.days)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
                      isSelected
                        ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs font-black'
                        : 'bg-[#FAF9F5] dark:bg-[#14151F] text-[#65675F] dark:text-[#94A3B8] border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] dark:hover:border-[#7AA2F7]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveExamSettings} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-[#85877E] uppercase tracking-wider block">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  placeholder="e.g. SSC CGL 2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#14151F] border border-[#D8D8CF] dark:border-[#272730] text-xs sm:text-sm font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-[#85877E] uppercase tracking-wider block">
                  Target Year
                </label>
                <input
                  type="number"
                  value={targetYear}
                  onChange={e => setTargetYear(Number(e.target.value))}
                  min={2025}
                  max={2035}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#14151F] border border-[#D8D8CF] dark:border-[#272730] text-xs sm:text-sm font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
                />
              </div>
            </div>

            {/* Exam Date & Quick Increment Buttons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-[#85877E] uppercase tracking-wider block">
                Exam Date
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-[#FAF9F5] dark:bg-[#14151F] border border-[#D8D8CF] dark:border-[#272730] text-xs sm:text-sm font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] cursor-pointer"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[{ label: '+30d', days: 30 }, { label: '+60d', days: 60 }, { label: '+90d', days: 90 }, { label: '+180d', days: 180 }].map(b => (
                    <button
                      type="button"
                      key={b.label}
                      onClick={() => handleAddDays(b.days)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#FAF9F5] dark:bg-[#14151F] hover:bg-[#11120F] hover:text-white dark:hover:bg-white dark:hover:text-black text-[#65675F] dark:text-[#94A3B8] border border-[#D8D8CF] dark:border-[#272730] transition-colors cursor-pointer active:scale-95"
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
                className="px-5 py-2.5 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-emerald-400 text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Schedule</span>
              </button>
              {examSaved && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 animate-fade-in font-mono">
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
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#EEEEE8] dark:border-[#242533] pb-3">
            <div>
              <h3 className="text-sm font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-wide">
                Color Theme & Palette
              </h3>
              <p className="text-[11px] text-[#65675F] dark:text-[#94A3B8]">
                Switch between high-contrast Tokyo Night Dark, Pure OLED, Sepia, and Paper Light mode.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-[#FAF9F5] dark:bg-[#20212E] border border-[#D8D8CF] dark:border-[#272730] text-[#11120F] dark:text-[#F5F5F7] capitalize">
              {theme === 'dark' ? 'Tokyo Night' : theme === 'oled' ? 'Pure OLED' : theme === 'sepia' ? 'Sepia Parchment' : 'Paper Light'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {/* Tokyo Night Dark */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setTheme('dark');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                theme === 'dark'
                  ? 'bg-[#1F2335] border-[#7AA2F7] ring-2 ring-[#7AA2F7]/30 shadow-sm'
                  : 'bg-[#F7F6F0] dark:bg-[#18181D] border-[#D8D8CF] dark:border-[#272730] opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-xl bg-[#16161E] border border-[#292E42] flex items-center justify-center text-[#7AA2F7] shrink-0">
                  <Moon className="w-5 h-5" />
                </div>
                {theme === 'dark' && <Check className="w-4 h-4 text-[#7AA2F7]" />}
              </div>
              <div>
                <span className="text-[13px] font-extrabold text-[#11120F] dark:text-white block">
                  Tokyo Night Dark
                </span>
                <span className="text-[11px] text-[#85877E] dark:text-[#94A3B8] block mt-0.5">
                  Deep dark glassmorphism for focused study
                </span>
              </div>
            </button>

            {/* Pure OLED Pitch Black (Eye-Comfort) */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setTheme('oled');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                theme === 'oled'
                  ? 'bg-[#0A0B10] border-[#7AA2F7] ring-2 ring-[#7AA2F7]/40 shadow-sm'
                  : 'bg-[#F7F6F0] dark:bg-[#18181D] border-[#D8D8CF] dark:border-[#272730] opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-xl bg-black border border-[#292E42] flex items-center justify-center text-cyan-400 shrink-0">
                  <span className="text-xs font-mono font-bold">OLED</span>
                </div>
                {theme === 'oled' && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <div>
                <span className="text-[13px] font-extrabold text-[#11120F] dark:text-white block">
                  Pure OLED Black
                </span>
                <span className="text-[11px] text-[#85877E] dark:text-[#94A3B8] block mt-0.5">
                  100% pitch black for zero eye fatigue & battery saving
                </span>
              </div>
            </button>

            {/* Classic Paper Light */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setTheme('light');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                theme === 'light'
                  ? 'bg-[#FAF8F5] border-[#596B35] ring-2 ring-[#596B35]/30 shadow-sm'
                  : 'bg-[#F7F6F0] dark:bg-[#18181D] border-[#D8D8CF] dark:border-[#272730] opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#D8D8CF] flex items-center justify-center text-[#596B35] shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                {theme === 'light' && <Check className="w-4 h-4 text-[#596B35]" />}
              </div>
              <div>
                <span className="text-[13px] font-extrabold text-[#11120F] dark:text-white block">
                  Classic Paper Light
                </span>
                <span className="text-[11px] text-[#85877E] dark:text-[#94A3B8] block mt-0.5">
                  Warm academic paper tones for daylight reading
                </span>
              </div>
            </button>

            {/* Sepia — Eye-Soothing Warm Parchment */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setTheme('sepia');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                theme === 'sepia'
                  ? 'bg-[#FBF7F0] border-[#8B6914] ring-2 ring-[#8B6914]/30 shadow-sm'
                  : 'bg-[#F7F6F0] dark:bg-[#18181D] border-[#D8D8CF] dark:border-[#272730] opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-xl bg-[#F5F0E8] border border-[#D5C9AD] flex items-center justify-center text-[#8B6914] shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                {theme === 'sepia' && <Check className="w-4 h-4 text-[#8B6914]" />}
              </div>
              <div>
                <span className="text-[13px] font-extrabold text-[#11120F] dark:text-white block">
                  Sepia Parchment
                </span>
                <span className="text-[11px] text-[#85877E] dark:text-[#94A3B8] block mt-0.5">
                  Eye-soothing warm tones for long study sessions
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* TAB: SOUND & MOTIVATION AUDIO */}
      {activeTab === 'sound' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-5 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEEEE8] dark:border-[#242533] pb-3.5">
            <div>
              <h3 className="text-sm font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-wide flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#596B35] dark:text-[#7AA2F7]" />
                <span>Audio & Motivation Effects</span>
              </h3>
              <p className="text-[11px] text-[#65675F] dark:text-[#94A3B8]">
                Configure audio cues, Tibetan focus bell, and library silent mode.
              </p>
            </div>

            {/* Master Mute / Silent Mode Button */}
            <button
              onClick={() => {
                handleUpdateAudio({ masterEnabled: !audioConfig.masterEnabled });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-xs ${
                audioConfig.masterEnabled
                  ? 'bg-[#11120F] dark:bg-white text-white dark:text-black font-black'
                  : 'bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-black'
              }`}
            >
              {audioConfig.masterEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audio Enabled</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Library Silent Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Master Volume Slider */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#10111A] border border-[#D8D8CF] dark:border-[#24283B] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-bold text-[#11120F] dark:text-white">
                <Sliders className="w-4 h-4 text-[#596B35] dark:text-[#7AA2F7]" />
                <span>Master Volume</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#596B35] dark:text-[#7AA2F7]">
                {Math.round(audioConfig.masterVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              disabled={!audioConfig.masterEnabled}
              value={audioConfig.masterVolume}
              onChange={e => handleUpdateAudio({ masterVolume: parseFloat(e.target.value) })}
              className="w-full accent-[#596B35] dark:accent-[#7AA2F7] cursor-pointer disabled:opacity-40"
            />
          </div>

          {/* Individual Audio Channels */}
          <div className="space-y-3 pt-1">
            <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#85877E] font-mono">
              Individual Audio Channels
            </h4>

            {/* Channel 1: UI Clicks */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#292E42] flex items-center justify-center text-[#596B35] dark:text-[#7AA2F7] shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-[#11120F] dark:text-white block">
                    UI Click & Navigation Taps
                  </span>
                  <span className="text-[11px] text-[#85877E] dark:text-[#A9B1D6]">
                    Tactile audio feedback when switching tabs and buttons
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => soundManager.playClick()}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white dark:bg-[#16161E] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#0B0B0D] text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42] transition-colors cursor-pointer"
                >
                  ▶ Test
                </button>
                <ToggleSwitch
                  checked={audioConfig.clickSound && audioConfig.masterEnabled}
                  onChange={val => handleUpdateAudio({ clickSound: val })}
                />
              </div>
            </div>

            {/* Channel 2: Pomodoro Bell */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#292E42] flex items-center justify-center text-amber-500 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-[#11120F] dark:text-white block">
                    Pomodoro Session Alert Bell
                  </span>
                  <span className="text-[11px] text-[#85877E] dark:text-[#A9B1D6]">
                    Gentle Tibetan singing bell when focus session starts & completes
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => soundManager.playPomodoroBell()}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white dark:bg-[#16161E] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#0B0B0D] text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42] transition-colors cursor-pointer"
                >
                  ▶ Test
                </button>
                <ToggleSwitch
                  checked={audioConfig.pomodoroBell && audioConfig.masterEnabled}
                  onChange={val => handleUpdateAudio({ pomodoroBell: val })}
                />
              </div>
            </div>

            {/* Channel 3: Target Completion Chime */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#292E42] flex items-center justify-center text-emerald-500 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-[#11120F] dark:text-white block">
                    Target Mastery Celebration Chime
                  </span>
                  <span className="text-[11px] text-[#85877E] dark:text-[#A9B1D6]">
                    Euphoric harmonic chime when completing a topic or daily target
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => soundManager.playCompleteChime()}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white dark:bg-[#16161E] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#0B0B0D] text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42] transition-colors cursor-pointer"
                >
                  ▶ Test
                </button>
                <ToggleSwitch
                  checked={audioConfig.chimeSound && audioConfig.masterEnabled}
                  onChange={val => handleUpdateAudio({ chimeSound: val })}
                />
              </div>
            </div>

            {/* Channel 4: Level Up / Streak Milestone */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#292E42] flex items-center justify-center text-purple-500 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-[#11120F] dark:text-white block">
                    Level Up & Streak Milestone Fanfare
                  </span>
                  <span className="text-[11px] text-[#85877E] dark:text-[#A9B1D6]">
                    Special victory fanfare on leveling up or reaching streak milestones
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => soundManager.playLevelUp()}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white dark:bg-[#16161E] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#0B0B0D] text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42] transition-colors cursor-pointer"
                >
                  ▶ Test
                </button>
                <ToggleSwitch
                  checked={audioConfig.levelUpSound && audioConfig.masterEnabled}
                  onChange={val => handleUpdateAudio({ levelUpSound: val })}
                />
              </div>
            </div>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#596B35] hover:bg-[#47572a] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-[13px] font-bold transition-all cursor-pointer active:scale-95"
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
                  <span className="text-[13px] font-bold text-[#11120F] dark:text-[#C0CAF5] block">{item.label}</span>
                  <span className="text-[11px] text-[#85877E] dark:text-[#787C99]">{item.desc}</span>
                </div>
                <ToggleSwitch
                  checked={item.checked}
                  onChange={val => updateSettings({ [item.key]: val })}
                />
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] space-y-1.5">
                <span className="text-[13px] font-bold text-[#11120F] dark:text-[#C0CAF5] block">Widget Width</span>
                <div className="flex gap-2">
                  {(['standard', 'compact'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        updateSettings({ size: s });
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
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
                  <span className="text-[13px] font-bold text-[#11120F] dark:text-[#C0CAF5]">Opacity</span>
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
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B] shadow-subtle-depth space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#EEEEE8] dark:border-[#24283B] pb-3">
            <div>
              <h3 className="text-sm font-black text-[#11120F] dark:text-[#C0CAF5] font-serif uppercase tracking-wide">
                1-Click Backup & Local Auto-Save Sync
              </h3>
              <p className="text-[11px] text-[#65675F] dark:text-[#A9B1D6]">
                All your syllabus data is continuously auto-saved. You can also export a 1-click JSON backup file.
              </p>
            </div>
          </div>

          {/* Live Auto-Save Sync Telemetry Card */}
          <div className="p-4 rounded-2xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <span className="text-[13px] font-bold text-[#11120F] dark:text-[#C0CAF5] block leading-tight">
                    Continuous Local Auto-Save: Active
                  </span>
                  <span className="text-[11px] text-[#85877E] dark:text-[#787C99]">
                    Zero risk of progress loss — synced instantly on every note, target, or score edit.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold shrink-0 self-start sm:self-auto">
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>Last Synced: {lastSavedAt}</span>
              </div>
            </div>

            {/* Storage Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#D8D8CF]/50 dark:border-[#292E42]/50 text-center font-mono">
              <div className="p-2 rounded-xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B]">
                <span className="text-[11px] text-[#85877E] dark:text-[#787C99] block font-sans font-bold">Topics & Notes</span>
                <span className="text-[13px] font-bold text-[#11120F] dark:text-[#C0CAF5]">{overallStats.totalTopics} Topics</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B]">
                <span className="text-[11px] text-[#85877E] dark:text-[#787C99] block font-sans font-bold">SRS Flashcards</span>
                <span className="text-[13px] font-bold text-[#11120F] dark:text-[#C0CAF5]">{revisions.length} Cards</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B]">
                <span className="text-[11px] text-[#85877E] dark:text-[#787C99] block font-sans font-bold">Targets & Reflections</span>
                <span className="text-[13px] font-bold text-[#11120F] dark:text-[#C0CAF5]">{top3Targets.length + reflectionsHistory.length} Entries</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#24283B]">
                <span className="text-[11px] text-[#85877E] dark:text-[#787C99] block font-sans font-bold">Total Stored Data</span>
                <span className="text-[13px] font-bold text-[#596B35] dark:text-[#7AA2F7]">~{storageUsageKb} KB</span>
              </div>
            </div>
          </div>

          {/* Backup Action Buttons */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#596B35] hover:bg-[#47572a] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-[13px] font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export Full Backup (.json)</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-[#EEEEE8] dark:hover:bg-[#24283B] text-[#11120F] dark:text-[#C0CAF5] text-[13px] font-bold border border-[#D8D8CF] dark:border-[#292E42] transition-all cursor-pointer active:scale-95">
              <Upload className="w-4 h-4 text-[#596B35] dark:text-[#7AA2F7]" />
              <span>Restore Backup File</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={() => setShowPwaModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-[#EEEEE8] dark:hover:bg-[#24283B] text-[#11120F] dark:text-[#C0CAF5] text-[13px] font-bold border border-[#D8D8CF] dark:border-[#292E42] transition-all cursor-pointer active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-[#596B35] dark:text-[#7AA2F7]" />
              <span>{isInstalled ? 'App Installed ✓' : 'Install PWA App 📲'}</span>
            </button>
          </div>

          {importStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                ✓ Full backup restored successfully! All topics, notes, PDF highlights, reflections & settings synced.
              </span>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 animate-fade-in">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span className="text-[13px] font-bold text-rose-600 dark:text-rose-400">
                Invalid backup format. Please select a valid Syllabus 3D backup JSON file.
              </span>
            </div>
          )}

          {/* Danger Zone */}
          <div className="pt-3 border-t border-[#EEEEE8] dark:border-[#24283B] space-y-2">
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block font-mono">
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
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white text-[13px] font-bold cursor-pointer shadow-xs"
                  >
                    Yes, Reset Demo
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] text-[13px] font-bold text-[#65675F] dark:text-[#A9B1D6] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-rose-500/15 hover:text-rose-500 text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42] text-[13px] font-bold transition-colors cursor-pointer"
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
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-[13px] font-bold cursor-pointer shadow-xs"
                  >
                    Yes, Delete Everything
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] text-[13px] font-bold text-[#65675F] dark:text-[#A9B1D6] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-rose-500/15 hover:text-rose-500 text-[#65675F] dark:text-[#A9B1D6] border border-[#D8D8CF] dark:border-[#292E42] text-[13px] font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Start Fresh (Blank Canvas)</span>
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

