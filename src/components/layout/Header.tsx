import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Search,
  Flame,
  Sun,
  Moon,
  ChevronDown,
  Menu,
  ArrowLeft,
  GraduationCap,
  WifiOff
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;onOpenMobileMenu?: () => void;
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
  const { currentExam, exams, setSelectedExamId, profile } = useSyllabus();
  const { user } = useAuth();
  const { toggleTheme: handleThemeToggle, isDark, isOled } = useTheme();
  const [isExamMenuOpen, setIsExamMenuOpen] = useState(false);
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
    handleThemeToggle();
  };

  const examName = currentExam?.name || 'Syllabus Exam';

  return (
    <header className="sticky top-0 z-30 bg-[#F7F6F0]/95 dark:bg-[#0B0B0D]/95 backdrop-blur-md border-b border-[#D8D8CF] dark:border-[#272730] px-3 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        
        {/* Left Side: Mobile Menu Button & Global Back Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-[#191A17] dark:text-[#F5F5F7] hover:bg-[#EEEEE8] dark:hover:bg-[#1D201A] transition-all cursor-pointer shrink-0"
            title="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {canGoBack && onGoBack && (
            <button
              onClick={() => {
                soundManager.playClick();
                onGoBack();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-[#191A17] dark:text-[#F5F5F7] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#1A1B26] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 group shrink-0"
              title="Navigate Back (Previous Step)"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-extrabold">Back</span>
            </button>
          )}

          {/* Desktop Exam Selector */}
          <div className="hidden md:flex relative">
            <button
              onClick={() => setIsExamMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] transition-all cursor-pointer text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] shadow-subtle-depth"
            >
              <GraduationCap className="w-4 h-4 text-[#596B35] dark:text-[#8B5CF6]" />
              <span>{examName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#85877E]" />
            </button>

            {isExamMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-elevated-card p-1.5 z-40 animate-fade-in">
                {exams.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setSelectedExamId(ex.id);
                      setIsExamMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                      ex.id === currentExam?.id
                        ? 'bg-[#DCE8B7] dark:bg-[#8B5CF6]/20 text-[#11120F] dark:text-[#F5F5F7] font-bold'
                        : 'hover:bg-[#EEEEE8] dark:hover:bg-[#1D201A] text-[#65675F] dark:text-[#A1A1AA]'
                    }`}
                  >
                    <span>{ex.name}</span>
                    <span className="text-[10px] text-[#85877E]">{ex.targetYear}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {!isOnline && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold animate-pulse cursor-help"
              title="100% Offline Ready: All syllabus topics, notes, PDF highlights, and flashcards are cached locally."
            >
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">100% Offline Mode Active</span>
              <span className="sm:hidden">Offline</span>
            </div>
          )}

          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-subtle-depth text-xs font-medium"
            title="Search Topics (Cmd + K)"
          >
            <Search className="w-4 h-4 text-[#596B35] dark:text-[#8B5CF6]" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#EEEEE8] dark:bg-[#23232A] rounded text-[#85877E]">⌘K</kbd>
          </button>

          {/* Streak Indicator */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth">
            <Flame className="w-4 h-4 text-[#C49A3A] fill-[#C49A3A]" />
            <span className="text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] font-mono">
              {profile.currentStreak}d
            </span>
          </div>

          {/* Theme Toggle (Light / Dark / OLED) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-[#65675F] hover:text-[#191A17] dark:text-[#A1A1AA] dark:hover:text-white transition-all cursor-pointer shadow-subtle-depth active:scale-90"
            title={isOled ? "Current: OLED Pure Black (Click for Light)" : isDark ? "Current: Tokyo Night (Click for OLED)" : "Current: Light (Click for Dark)"}
          >
            {isOled ? (
              <span className="text-[11px] font-mono font-black text-cyan-400">OL</span>
            ) : isDark ? (
              <Sun className="w-4 h-4 text-[#C49A3A]" />
            ) : (
              <Moon className="w-4 h-4 text-[#596B35]" />
            )}
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-xl bg-[#11120F] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-[#DCE8B7] dark:text-[#7AA2F7] font-bold flex items-center justify-center text-xs shadow-sm cursor-pointer overflow-hidden active:scale-95 hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all"
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
    </header>
  );
};
