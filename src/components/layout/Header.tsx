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
  Sparkles
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { EditExamTargetModal } from '../modals/EditExamTargetModal';

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
  const { currentExam, exams, setSelectedExamId, profile } = useSyllabus();
  const { user } = useAuth();
  const {
    theme,
    toggleTheme: handleThemeToggle,
    revertToPreviousTheme,
    isLuxury,
    isGlass,
    isDark,
    isOled,
    isSepia,
    previousTheme
  } = useTheme();
  const { isInstallable, isInstalled, triggerInstall } = usePWA();
  const [isExamMenuOpen, setIsExamMenuOpen] = useState(false);
  const [isEditExamModalOpen, setIsEditExamModalOpen] = useState(false);
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

  const rawExamName = currentExam?.name || 'Syllabus Exam';
  const hasTrailingYear = /\s+(20\d{2})$/.test(rawExamName);
  const trailingYearMatch = rawExamName.match(/\s+(20\d{2})$/)?.[1];
  const targetYear = currentExam?.targetYear || (trailingYearMatch ? Number(trailingYearMatch) : (currentExam?.examDate ? new Date(currentExam.examDate).getFullYear() : 2026));
  const examDisplayName = hasTrailingYear ? rawExamName.replace(/\s+20\d{2}$/, '') : rawExamName;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B0B0D]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#272730] px-2.5 sm:px-6 py-2 sm:py-2.5 pt-safe pl-safe pr-safe transition-colors print:hidden">
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full min-w-0">
        
        {/* Left Side: Mobile Menu Button, Desktop Gemini Collapse Toggle, Back Nav & Exam Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
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

          {/* Responsive Exam Selector (Mobile & Desktop) with Target Year */}
          <div className="relative min-w-0">
            <button
              onClick={() => setIsExamMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 sm:gap-2 h-9 px-2.5 sm:px-3 rounded-xl bg-white dark:bg-[#18181D] border border-slate-200/80 dark:border-white/[0.08] hover:border-[#2563EB] dark:hover:border-[#7AA2F7] transition-all cursor-pointer text-xs sm:text-[13px] font-bold text-slate-900 dark:text-[#F5F5F7] shadow-subtle-depth shrink-0 active:scale-95 group"
              title={`Switch Exam Target: ${rawExamName} (${targetYear})`}
            >
              <GraduationCap className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#2563EB] dark:text-[#7AA2F7] shrink-0 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-[220px] font-bold tracking-tight">
                  {examDisplayName}
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-black bg-[#EFF6FF] dark:bg-[#7AA2F7]/15 text-[#2563EB] dark:text-[#7AA2F7] border border-[#BFDBFE]/60 dark:border-[#7AA2F7]/30 shrink-0 tabular-nums leading-none">
                  {targetYear}
                </span>
              </div>
              <ChevronDown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 shrink-0" />
            </button>

            {isExamMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 rounded-2xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-elevated-card p-1.5 z-40 animate-fade-in">
                <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#85877E] dark:text-slate-400">
                  Target Exam
                </div>
                {exams.map(ex => {
                  const exHasYear = /\s+(20\d{2})$/.test(ex.name);
                  const exYearMatch = ex.name.match(/\s+(20\d{2})$/)?.[1];
                  const exTargetYear = ex.targetYear || (exYearMatch ? Number(exYearMatch) : (ex.examDate ? new Date(ex.examDate).getFullYear() : 2026));
                  const exDisplayName = exHasYear ? ex.name.replace(/\s+20\d{2}$/, '') : ex.name;

                  return (
                    <button
                      key={ex.id}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedExamId(ex.id);
                        setIsExamMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[13px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        ex.id === currentExam?.id
                          ? 'bg-[#EFF6FF] dark:bg-[#7AA2F7]/20 text-[#2563EB] dark:text-[#7AA2F7] font-bold'
                          : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1E2030] text-[#65675F] dark:text-[#A1A1AA]'
                      }`}
                    >
                      <span className="truncate mr-2">{exDisplayName}</span>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/60 dark:bg-black/20 text-[#2563EB] dark:text-[#7AA2F7] border border-[#BFDBFE]/40 dark:border-[#7AA2F7]/20 shrink-0 tabular-nums">
                        {exTargetYear}
                      </span>
                    </button>
                  );
                })}
                <div className="my-1 border-t border-[#EEEEE8] dark:border-[#272730]" />
                <button
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#2563EB] dark:text-[#7AA2F7] hover:bg-[#2563EB]/10 dark:hover:bg-[#7AA2F7]/10 flex items-center gap-2 transition-colors cursor-pointer"
                  onClick={() => {
                    soundManager.playClick();
                    setIsExamMenuOpen(false);
                    setIsEditExamModalOpen(true);
                  }}
                >
                  <Settings2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Customize Target Exam...</span>
                </button>
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
            className="h-9 p-2 sm:px-3 rounded-xl bg-white dark:bg-[#18181D] border border-slate-200/80 dark:border-white/[0.08] text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle-depth text-xs font-medium shrink-0 active:scale-95"
            title="Search Topics (Cmd + K)"
            aria-label="Search topics"
          >
            <Search className="w-4 h-4 text-[#2563EB] dark:text-[#8B5CF6] shrink-0" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[11px] font-mono bg-[#EEEEE8] dark:bg-[#23232A] rounded text-[#85877E]">⌘K</kbd>
          </button>

          {/* Streak Indicator */}
          <div className="h-9 flex items-center gap-1 px-2.5 rounded-xl bg-white dark:bg-[#18181D] border border-slate-200/80 dark:border-white/[0.08] shadow-subtle-depth shrink-0">
            <Flame className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#C49A3A] fill-[#C49A3A] shrink-0" />
            <span className="text-[11px] sm:text-xs tabular-nums font-black text-[#191A17] dark:text-[#F5F5F7] font-mono">
              {profile.currentStreak}d
            </span>
          </div>

          {/* PWA Install Button (Shown when installable on desktop/mobile) */}
          {isInstallable && !isInstalled && (
            <button
              onClick={async () => {
                haptics.medium();
                soundManager.playClick();
                await triggerInstall();
              }}
              className="h-9 hidden sm:flex items-center gap-1.5 px-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] dark:from-[#7AA2F7] dark:to-[#5B8BF5] text-white dark:text-[#0B0B0D] text-xs font-black shadow-xs hover:opacity-95 transition-all cursor-pointer shrink-0 active:scale-95"
              title="Install Syllabus 3D App on device"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Install App</span>
            </button>
          )}

          {/* Fluid Glass Theme Active & 1-Click Revert Pill */}
          {isGlass && (
            <div className="h-9 flex items-center gap-1.5 px-2.5 rounded-xl bg-white/80 dark:bg-[#1E2030]/80 backdrop-blur-md border border-purple-300/70 dark:border-purple-500/40 shadow-2xs animate-fade-in shrink-0">
              <span className="text-[11px] font-black bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-300 bg-clip-text text-transparent flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">Fluid Glass</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  haptics.success();
                  revertToPreviousTheme();
                }}
                className="px-2 py-0.5 rounded-lg bg-white/90 border border-purple-200 hover:bg-purple-50 text-[10px] font-bold text-purple-900 cursor-pointer shadow-xs active:scale-95 transition-all"
                title={`Revert back to previous theme (${previousTheme})`}
              >
                ↩ Revert
              </button>
            </div>
          )}

          {/* Luxury Theme Active & 1-Click Revert Pill */}
          {isLuxury && (
            <div className="h-9 flex items-center gap-1.5 px-2.5 rounded-xl bg-[#FBF0E6] border border-[#E2CEBE] shadow-2xs animate-fade-in shrink-0">
              <span className="text-[11px] font-bold text-[#B88746] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Luxury</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  haptics.success();
                  revertToPreviousTheme();
                }}
                className="px-2 py-0.5 rounded-lg bg-white border border-[#E2CEBE] hover:bg-[#F6ECE0] text-[10px] font-bold text-[#2C221E] cursor-pointer shadow-xs active:scale-95 transition-all"
                title={`Revert back to previous theme (${previousTheme})`}
              >
                ↩ Revert
              </button>
            </div>
          )}

          {/* Theme Toggle (Cycle: Fluid Glass -> Dark -> OLED -> Light -> Sepia -> Luxury) */}
          <button
            onClick={() => {
              soundManager.playClick();
              haptics.light();
              handleThemeToggle();
            }}
            className="h-9 w-9 rounded-xl bg-white dark:bg-[#18181D] border border-slate-200/80 dark:border-white/[0.08] text-[#64748B] hover:text-[#0F172A] dark:text-[#A1A1AA] dark:hover:text-white transition-all cursor-pointer shadow-subtle-depth active:scale-90 shrink-0 flex items-center justify-center"
            title={
              isGlass
                ? "Current: Fluid Glass (Click for Tokyo Night Dark)"
                : isLuxury
                ? "Current: Luxury Theme (Click for Fluid Glass)"
                : isOled
                ? "Current: OLED Pure Black (Click for Pure White)"
                : isDark
                ? "Current: Tokyo Night (Click for OLED)"
                : isSepia
                ? "Current: Sepia (Click for Luxury)"
                : "Current: Pure White (Click for Sepia)"
            }
            aria-label="Toggle theme"
          >
            {isGlass ? (
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            ) : isLuxury ? (
              <Sparkles className="w-4 h-4 text-[#B88746]" />
            ) : isOled ? (
              <span className="text-[11px] font-mono font-black text-cyan-400">OL</span>
            ) : isDark ? (
              <Sun className="w-4 h-4 text-[#F59E0B]" />
            ) : isSepia ? (
              <span className="text-[11px] font-mono font-black text-[#8B6914]">SE</span>
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
            className={`h-9 w-9 rounded-xl bg-gradient-to-tr ${
              profile.avatarColor || 'from-[#2563EB] to-indigo-600'
            } border border-slate-200/80 dark:border-white/[0.08] text-white font-bold flex items-center justify-center text-xs shadow-sm cursor-pointer overflow-hidden active:scale-95 hover:border-[#2563EB] dark:hover:border-[#7AA2F7] transition-all shrink-0`}
            title={`Active Profile: ${profile.name || 'Aspirant'} (Click to switch)`}
            aria-label="Switch profile"
          >
            {(profile.avatarUrl || user?.avatarUrl) ? (
              <img
                src={profile.avatarUrl || user?.avatarUrl}
                alt={user?.name || profile.name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : profile.avatarEmoji ? (
              <span className="text-[13px] leading-none drop-shadow">{profile.avatarEmoji}</span>
            ) : (
              (user?.name || profile.name || 'A').charAt(0).toUpperCase()
            )}
          </button>
        </div>
      </div>

      {/* Edit Target Exam Modal */}
      <EditExamTargetModal
        isOpen={isEditExamModalOpen}
        onClose={() => setIsEditExamModalOpen(false)}
      />
    </header>
  );
};

