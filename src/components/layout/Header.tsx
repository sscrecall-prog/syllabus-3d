import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePWA } from '../../hooks/usePWA';
import { haptics } from '../../utils/haptics';
import {
  Search,
  Flame,
  Sun,
  Moon,
  ChevronDown,
  Menu,
  ArrowLeft,
  GraduationCap,
  WifiOff,
  Download,
  Settings2,
  PanelLeftOpen,
  Sparkles,
  Lock,
  Plus,
  Trash2,
  Check,
  Target
} from 'lucide-react';
import { usePinLock } from '../../context/PinLockContext';
import { soundManager } from '../../utils/soundEffects';
import { EditExamTargetModal } from '../modals/EditExamTargetModal';
import { AddExamTargetModal } from '../modals/AddExamTargetModal';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenProfileSwitcher?: () => void;
  onOpenMobileMenu?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleDesktopSidebar?: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  currentViewTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSettings,
  onOpenProfileSwitcher,
  onOpenMobileMenu,
  isSidebarCollapsed = false,
  onToggleDesktopSidebar,
  canGoBack = false,
  onGoBack,
  currentViewTitle = 'SYLLABUS 3D'
}) => {
  const { currentExam, exams, setSelectedExamId, deleteExam, profile } = useSyllabus();
  const { user } = useAuth();
  const { isConfigured, lockApp } = usePinLock();
  const {
    isDark,
    toggleTheme: handleThemeToggle,
  } = useTheme();
  const { isInstallable, isInstalled, triggerInstall } = usePWA();
  const [isExamMenuOpen, setIsExamMenuOpen] = useState(false);
  const [isEditExamModalOpen, setIsEditExamModalOpen] = useState(false);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    soundManager.playClick();
    haptics.light();
    handleThemeToggle();
  };

  const getExamDaysRemaining = (examDateStr?: string, targetYr?: number) => {
    if (!examDateStr) return null;
    const now = new Date().getTime();
    let y = targetYr || 2026;
    let m = 9;
    let d = 15;
    if (examDateStr.includes('-')) {
      const parts = examDateStr.split('-').map(Number);
      if (parts.length >= 3 && !isNaN(parts[0])) {
        y = parts[0];
        m = parts[1] - 1;
        d = parts[2];
      }
    }
    const targetTime = new Date(y, m, d, 9, 0, 0).getTime();
    const diff = targetTime - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const rawExamName = currentExam?.name || 'Syllabus Exam';
  const hasTrailingYear = /\s+(20\d{2})$/.test(rawExamName);
  const trailingYearMatch = rawExamName.match(/\s+(20\d{2})$/)?.[1];
  const targetYear = currentExam?.targetYear || (trailingYearMatch ? Number(trailingYearMatch) : (currentExam?.examDate ? new Date(currentExam.examDate).getFullYear() : 2026));
  const examDisplayName = hasTrailingYear ? rawExamName.replace(/\s+20\d{2}$/, '') : rawExamName;
  const activeDaysRemaining = getExamDaysRemaining(currentExam?.examDate, targetYear);

  return (
    <header className="sticky top-0 z-30 bg-[#FAEED9]/90 dark:bg-[#090C15]/85 backdrop-blur-2xl border-b border-[#E6D3B1] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(56,55,13,0.04),0_4px_12px_-2px_rgba(56,55,13,0.03)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.6)] px-2 sm:px-6 py-2 sm:py-2.5 pt-safe pl-safe pr-safe transition-colors print:hidden">
      <div className="flex items-center justify-between gap-1 sm:gap-3 w-full min-w-0">
        
        {/* Left Side: Mobile Menu Button, Desktop Gemini Collapse Toggle, Back Nav & Exam Selector */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 sm:flex-initial">
          {/* Mobile Drawer Button (< md) */}
          <button
            onClick={() => {
              soundManager.playClick();
              haptics.light();
              onOpenMobileMenu?.();
            }}
            className="md:hidden h-9 w-9 rounded-xl bg-white dark:bg-[#18181D] border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-[#F5F5F7] hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-all cursor-pointer shrink-0 tap-bounce shadow-subtle-depth active:scale-95 flex items-center justify-center"
            title="Open Navigation Menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Desktop Sidebar Toggle (>= md): Appears when sidebar is collapsed */}
          {isSidebarCollapsed && onToggleDesktopSidebar && (
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                haptics.light();
                onToggleDesktopSidebar();
              }}
              className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white dark:bg-[#18181D] border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-[#F5F5F7] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-[#2563EB] dark:hover:border-[#7AA2F7] transition-all cursor-pointer shrink-0 shadow-subtle-depth active:scale-95 group animate-fade-in"
              title="Open sidebar (Ctrl+B)"
              aria-label="Open sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-[#191A17] dark:text-[#F5F5F7] group-hover:text-[#2563EB] dark:group-hover:text-[#7AA2F7] transition-colors group-hover:scale-110" />
              <span className="text-[12px] font-bold hidden lg:inline">Sidebar</span>
            </button>
          )}

          {/* Back Navigation Button */}
          {canGoBack && onGoBack && (
            <button
              onClick={() => {
                soundManager.playClick();
                haptics.light();
                onGoBack();
              }}
              className="flex items-center gap-1 sm:gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl bg-white dark:bg-[#18181D] border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-[#F5F5F7] hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-all cursor-pointer shrink-0 shadow-subtle-depth active:scale-95 group"
            >
              <ArrowLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs sm:text-[13px] font-extrabold">Back</span>
            </button>
          )}

          {/* Responsive Exam Selector (Mobile & Desktop) with Target Year & Live Countdown */}
          <div className="relative min-w-0">
            <button
              onClick={() => setIsExamMenuOpen(prev => !prev)}
              className="flex items-center gap-1 sm:gap-2 h-9 px-1.5 sm:px-3 rounded-xl bg-white dark:bg-[#18181D] border border-slate-200/80 dark:border-white/[0.08] hover:border-[#2563EB] dark:hover:border-[#7AA2F7] transition-all cursor-pointer text-xs sm:text-[13px] font-bold text-slate-900 dark:text-[#F5F5F7] shadow-subtle-depth active:scale-95 group min-w-0"
              title={`Switch Exam Target: ${rawExamName} (${targetYear})`}
            >
              <GraduationCap className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#2563EB] dark:text-[#7AA2F7] shrink-0 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="truncate max-w-[50px] min-[375px]:max-w-[70px] xs:max-w-[120px] sm:max-w-[190px] font-bold tracking-tight">
                  {examDisplayName}
                </span>
                <span className="px-1 sm:px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-black bg-[#EFF6FF] dark:bg-[#7AA2F7]/15 text-[#2563EB] dark:text-[#7AA2F7] border border-[#BFDBFE]/60 dark:border-[#7AA2F7]/30 shrink-0 tabular-nums leading-none">
                  {targetYear}
                </span>
                {activeDaysRemaining !== null && activeDaysRemaining > 0 && (
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0 tabular-nums">
                    ⏳ {activeDaysRemaining}d
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isExamMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExamMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 sm:w-84 rounded-2xl bg-white dark:bg-[#151624] border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-fade-in divide-y divide-slate-100 dark:divide-slate-800">
                {/* Header */}
                <div className="px-2.5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-600 dark:text-[#7AA2F7]" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Target Exams ({exams.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setIsExamMenuOpen(false);
                      setIsAddExamModalOpen(true);
                    }}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-blue-600 dark:text-[#7AA2F7] hover:bg-blue-50 dark:hover:bg-[#7AA2F7]/10 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Exam</span>
                  </button>
                </div>

                {/* Enrolled Exams List */}
                <div className="py-1.5 space-y-1 max-h-64 overflow-y-auto">
                  {exams.map(ex => {
                    const isCurrent = ex.id === currentExam?.id;
                    const exHasYear = /\s+(20\d{2})$/.test(ex.name);
                    const exYearMatch = ex.name.match(/\s+(20\d{2})$/)?.[1];
                    const exTargetYear = ex.targetYear || (exYearMatch ? Number(exYearMatch) : (ex.examDate ? new Date(ex.examDate).getFullYear() : 2026));
                    const exDisplayName = exHasYear ? ex.name.replace(/\s+20\d{2}$/, '') : ex.name;
                    const daysLeft = getExamDaysRemaining(ex.examDate, exTargetYear);
                    const totalSubjs = ex.subjects?.length || 0;

                    return (
                      <div
                        key={ex.id}
                        className={`w-full group rounded-xl p-2 sm:p-2.5 transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-50/90 dark:bg-[#7AA2F7]/15 border border-blue-200 dark:border-[#7AA2F7]/30 text-blue-700 dark:text-[#93C5FD]'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent text-slate-700 dark:text-slate-300'
                        }`}
                        onClick={() => {
                          soundManager.playClick();
                          setSelectedExamId(ex.id);
                          setIsExamMenuOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {isCurrent ? (
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            ) : (
                              <GraduationCap className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-bold truncate">
                                {exDisplayName}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/10 shrink-0 tabular-nums">
                                {exTargetYear}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              {daysLeft !== null && (
                                <span className={daysLeft <= 30 ? 'text-rose-500 font-bold' : ''}>
                                  📅 {daysLeft}d left
                                </span>
                              )}
                              <span>•</span>
                              <span>{totalSubjs} Subjects</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions for this Exam */}
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExamId(ex.id);
                              setIsExamMenuOpen(false);
                              setIsEditExamModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            title="Edit Target Date & Countdown"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                          {exams.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove "${ex.name}" from your active exam targets?`)) {
                                  deleteExam(ex.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove this exam"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Quick Actions */}
                <div className="p-1.5 space-y-1">
                  <button
                    type="button"
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-[#7AA2F7] hover:bg-blue-50 dark:hover:bg-[#7AA2F7]/10 flex items-center gap-2 transition-colors cursor-pointer"
                    onClick={() => {
                      soundManager.playClick();
                      setIsExamMenuOpen(false);
                      setIsAddExamModalOpen(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>+ Enroll New Exam Target...</span>
                  </button>

                  <button
                    type="button"
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                    onClick={() => {
                      soundManager.playClick();
                      setIsExamMenuOpen(false);
                      setIsEditExamModalOpen(true);
                    }}
                  >
                    <Settings2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Customize Active Exam & Timer...</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Tools */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {!isOnline && (
            <div
              className="h-9 flex items-center gap-1 px-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] sm:text-[11px] font-mono font-bold animate-pulse cursor-help shrink-0"
              title="100% Offline Ready: All syllabus topics, notes, PDF highlights, and flashcards are cached locally."
            >
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}


          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="h-9 w-9 md:w-auto p-0 md:px-3 rounded-xl bg-white dark:bg-[#162035] border border-slate-200/80 dark:border-slate-700/70 text-[#65675F] dark:text-slate-200 hover:text-[#191A17] dark:hover:text-white hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all flex items-center justify-center md:justify-start gap-1.5 cursor-pointer shadow-subtle-depth text-xs font-medium shrink-0 active:scale-95"
            title="Search Topics (Cmd + K)"
            aria-label="Search topics"
          >
            <Search className="w-4 h-4 text-[#2563EB] dark:text-[#93C5FD] shrink-0" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[11px] font-mono bg-[#EEEEE8] dark:bg-slate-700/80 rounded text-[#85877E] dark:text-slate-200 font-bold">⌘K</kbd>
          </button>

          {/* Streak Indicator */}
          <div className="h-9 flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 rounded-xl bg-white dark:bg-[#162035] border border-slate-200/80 dark:border-slate-700/70 shadow-subtle-depth shrink-0">
            <Flame className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#C49A3A] fill-[#C49A3A] shrink-0" />
            <span className="text-[11px] sm:text-xs tabular-nums font-black text-[#191A17] dark:text-white font-mono">
              {profile.currentStreak}d
            </span>
          </div>

          {/* Quick Safety PIN Lock Trigger */}
          {isConfigured && (
            <button
              onClick={() => {
                soundManager.playClick();
                haptics.medium();
                lockApp();
              }}
              className="h-9 w-9 rounded-xl bg-white dark:bg-[#18181D] border border-slate-200/80 dark:border-white/[0.08] text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer shadow-subtle-depth active:scale-90 shrink-0 flex items-center justify-center"
              title="Lock App Now (Safety PIN)"
              aria-label="Lock app now"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* Theme Toggle (Light <-> Dark) */}
          <button
            onClick={() => {
              soundManager.playClick();
              haptics.light();
              handleThemeToggle();
            }}
            className="h-9 w-9 rounded-xl bg-white dark:bg-[#18181D] border border-slate-200/80 dark:border-white/[0.08] text-[#64748B] hover:text-[#0F172A] dark:text-[#A1A1AA] dark:hover:text-white transition-all cursor-pointer shadow-subtle-depth active:scale-90 shrink-0 flex items-center justify-center"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#F59E0B]" />
            ) : (
              <Moon className="w-4 h-4 text-[#2563EB]" />
            )}
          </button>

          {/* User Profile Avatar / Switcher Trigger */}
          <button
            onClick={() => {
              soundManager.playClick();
              haptics.light();
              if (onOpenProfileSwitcher) {
                onOpenProfileSwitcher();
              } else {
                onOpenSettings();
              }
            }}
            className={`h-9 w-9 rounded-full bg-gradient-to-tr ${
              profile.avatarColor || 'from-[#2563EB] to-indigo-600'
            } border border-slate-200/80 dark:border-white/[0.08] text-white font-bold flex items-center justify-center text-xs shadow-sm cursor-pointer overflow-hidden active:scale-95 hover:border-[#2563EB] dark:hover:border-[#7AA2F7] transition-all shrink-0`}
            title={`Active Profile: ${profile.name || 'Aspirant'} (Click to switch)`}
            aria-label="Switch profile"
          >
            {(profile.avatarUrl || user?.avatarUrl) ? (
              <img
                src={profile.avatarUrl || user?.avatarUrl}
                alt={profile.name || user?.name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : profile.avatarEmoji ? (
              <span className="text-[13px] leading-none drop-shadow">{profile.avatarEmoji}</span>
            ) : (
              (profile.name || user?.name || 'A').charAt(0).toUpperCase()
            )}
          </button>
        </div>
      </div>

      {/* Edit Target Exam Modal */}
      <EditExamTargetModal
        isOpen={isEditExamModalOpen}
        onClose={() => setIsEditExamModalOpen(false)}
        onOpenAddModal={() => setIsAddExamModalOpen(true)}
      />

      {/* Add Target Exam Modal */}
      <AddExamTargetModal
        isOpen={isAddExamModalOpen}
        onClose={() => setIsAddExamModalOpen(false)}
      />
    </header>
  );
};

