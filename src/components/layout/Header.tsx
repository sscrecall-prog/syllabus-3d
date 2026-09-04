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
  Check,
  Download,
  Settings2
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { EditExamTargetModal } from '../modals/EditExamTargetModal';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenMobileMenu?: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  currentViewTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSettings,
  onOpenMobileMenu,
  canGoBack = false,
  onGoBack,
  currentViewTitle = 'SYLLABUS 3D'
}) => {
  const { currentExam, exams, setSelectedExamId, profile, lastSavedAt, isAutoSaving } = useSyllabus();
  const { user } = useAuth();
  const { toggleTheme: handleThemeToggle, isDark, isOled } = useTheme();
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

  const examName = currentExam?.name || 'Syllabus Exam';

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B0B0D]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#272730] px-2.5 sm:px-6 py-2 sm:py-2.5 pt-safe transition-colors select-none">
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full min-w-0">
        
        {/* Left Side: Mobile Menu Button, Back Nav & Exam Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {canGoBack && onGoBack ? (
            <button
              onClick={() => {
                soundManager.playClick();
                haptics.light();
                onGoBack();
              }}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-[#191A17] dark:text-[#F5F5F7] hover:bg-[#2563EB] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#1A1B26] transition-all cursor-pointer flex items-center gap-1 shadow-sm tap-bounce group shrink-0 min-h-[40px]"
              title="Navigate Back (Previous Step)"
            >
              <ArrowLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs sm:text-[13px] font-extrabold">Back</span>
            </button>
          ) : (
            <button
              onClick={() => {
                soundManager.playClick();
                haptics.light();
                onOpenMobileMenu?.();
              }}
              className="md:hidden p-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-[#191A17] dark:text-[#F5F5F7] hover:bg-[#EEEEE8] dark:hover:bg-[#1D201A] transition-all cursor-pointer shrink-0 tap-bounce touch-target-min flex items-center justify-center"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Responsive Exam Selector (Mobile & Desktop) */}
          <div className="relative min-w-0">
            <button
              onClick={() => setIsExamMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all cursor-pointer text-xs sm:text-[13px] font-bold text-[#191A17] dark:text-[#F5F5F7] shadow-subtle-depth shrink-0 active:scale-95"
              title="Switch Exam Target"
            >
              <GraduationCap className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#596B35] dark:text-[#8B5CF6] shrink-0" />
              <span className="whitespace-nowrap font-bold tracking-tight">{examName}</span>
              <ChevronDown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#85877E] shrink-0" />
            </button>

            {isExamMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-elevated-card p-1.5 z-40 animate-fade-in">
                <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#85877E] dark:text-[#71717A]">
                  Target Exam
                </div>
                {exams.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedExamId(ex.id);
                      setIsExamMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-[13px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      ex.id === currentExam?.id
                        ? 'bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#11120F] dark:text-[#F5F5F7] font-bold'
                        : 'hover:bg-[#EEEEE8] dark:hover:bg-[#1D201A] text-[#65675F] dark:text-[#A1A1AA]'
                    }`}
                  >
                    <span>{ex.name}</span>
                    <span className="text-[11px] font-mono text-[#85877E]">{ex.targetYear}</span>
                  </button>
                ))}
                <div className="my-1 border-t border-[#EEEEE8] dark:border-[#272730]" />
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setIsExamMenuOpen(false);
                    setIsEditExamModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#596B35] dark:text-[#7AA2F7] hover:bg-[#596B35]/10 dark:hover:bg-[#7AA2F7]/10 flex items-center gap-2 transition-colors cursor-pointer"
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
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] sm:text-[11px] font-mono font-bold animate-pulse cursor-help shrink-0"
              title="100% Offline Ready: All syllabus topics, notes, PDF highlights, and flashcards are cached locally."
            >
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle-depth text-xs font-medium shrink-0"
            title="Search Topics (Cmd + K)"
          >
            <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#596B35] dark:text-[#8B5CF6] shrink-0" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[11px] font-mono bg-[#EEEEE8] dark:bg-[#23232A] rounded text-[#85877E]">⌘K</kbd>
          </button>

          {/* Streak Indicator */}
          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth shrink-0">
            <Flame className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#C49A3A] fill-[#C49A3A] shrink-0" />
            <span className="text-[11px] sm:text-xs tabular-nums font-black text-[#191A17] dark:text-[#F5F5F7] font-mono">
              {profile.currentStreak}d
            </span>
          </div>

          {/* Real-Time Auto-Save Sync Indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-300 select-none cursor-help shrink-0 ${
              isAutoSaving
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 scale-105 shadow-xs'
                : 'bg-white dark:bg-[#18181D] border-[#D8D8CF] dark:border-[#272730] text-[#65675F] dark:text-[#A1A1AA]'
            }`}
            title={`All notes, targets, PDF highlights, and study metrics are continuously auto-saved. (Last saved: ${lastSavedAt})`}
          >
            <Check className={`w-3.5 h-3.5 stroke-[2.5] ${isAutoSaving ? 'text-emerald-500 animate-bounce' : 'text-emerald-500 dark:text-emerald-400'}`} />
            <span className="text-[11px] font-mono font-bold tracking-tight">
              {isAutoSaving ? 'Saving...' : `Saved ${lastSavedAt}`}
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
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#596B35] to-[#455328] dark:from-[#7AA2F7] dark:to-[#5B8BF5] text-white dark:text-[#0B0B0D] text-xs font-black shadow-xs hover:opacity-95 transition-all cursor-pointer shrink-0 active:scale-95"
              title="Install Syllabus 3D App on device"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Install App</span>
            </button>
          )}

          {/* Theme Toggle (Light / Dark / OLED) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] text-[#64748B] hover:text-[#0F172A] dark:text-[#A1A1AA] dark:hover:text-white transition-all cursor-pointer shadow-subtle-depth active:scale-90 shrink-0"
            title={isOled ? "Current: OLED Pure Black (Click for Pure White)" : isDark ? "Current: Tokyo Night (Click for OLED)" : "Current: Pure White (Click for Dark)"}
          >
            {isOled ? (
              <span className="text-[11px] font-mono font-black text-cyan-400">OL</span>
            ) : isDark ? (
              <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#F59E0B]" />
            ) : (
              <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#2563EB]" />
            )}
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onOpenSettings}
            className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl bg-[#11120F] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-[#DCE8B7] dark:text-[#7AA2F7] font-bold flex items-center justify-center text-xs shadow-sm cursor-pointer overflow-hidden active:scale-95 hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all shrink-0"
            title="App Settings & Profile"
          >
            {(profile.avatarUrl || user?.avatarUrl) ? (
              <img
                src={profile.avatarUrl || user?.avatarUrl}
                alt={user?.name || profile.name || 'User'}
                className="w-full h-full object-cover"
              />
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

