import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Flame,
  Sun,
  Moon,
  ChevronDown,
  Menu,
  ArrowLeft,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

export type ThemeSystemMode = 'academic' | 'spatial';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenAddTopic?: () => void;
  onOpenFocus?: () => void;
  onOpenMobileMenu?: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  currentViewTitle?: string;
  themeSystem?: ThemeSystemMode;
  onToggleThemeSystem?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSettings,
  onOpenMobileMenu,
  canGoBack = false,
  onGoBack,
  currentViewTitle = 'SYLLABUS 3D',
  themeSystem = 'academic',
  onToggleThemeSystem
}) => {
  const { currentExam, exams, setSelectedExamId, profile } = useSyllabus();
  const { user } = useAuth();
  const [isExamMenuOpen, setIsExamMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    soundManager.playClick();
    setIsDarkMode(prev => !prev);
  };

  const examName = currentExam?.name || 'Academic Exam';

  return (
    <header className="sticky top-0 z-30 bg-[#F7F6F0]/95 dark:bg-[#0D0E0C]/95 backdrop-blur-md border-b border-[#D8D8CF] dark:border-[#30342B] px-3 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        
        {/* Left Side: Mobile Menu Button or Back Button */}
        <div className="flex items-center gap-2">
          {canGoBack && onGoBack ? (
            <button
              onClick={() => {
                soundManager.playClick();
                onGoBack();
              }}
              className="p-2 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-[#191A17] dark:text-[#F4F4ED] hover:bg-[#EEEEE8] dark:hover:bg-[#1D201A] transition-all cursor-pointer flex items-center gap-1.5"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold">{currentViewTitle}</span>
            </button>
          ) : (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-[#191A17] dark:text-[#F4F4ED] hover:bg-[#EEEEE8] dark:hover:bg-[#1D201A] transition-all cursor-pointer"
              title="Open Navigation Drawer"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Desktop Exam Selector */}
          <div className="hidden md:flex relative">
            <button
              onClick={() => setIsExamMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] hover:border-[#596B35] transition-all cursor-pointer text-xs font-bold text-[#191A17] dark:text-[#F4F4ED] shadow-subtle-depth"
            >
              <GraduationCap className="w-4 h-4 text-[#596B35] dark:text-[#A4B879]" />
              <span>{examName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#85877E]" />
            </button>

            {isExamMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-elevated-card p-1.5 z-40 animate-fade-in">
                {exams.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setSelectedExamId(ex.id);
                      setIsExamMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                      ex.id === currentExam?.id
                        ? 'bg-[#DCE8B7] dark:bg-[#354126] text-[#11120F] dark:text-[#F4F4ED] font-bold'
                        : 'hover:bg-[#EEEEE8] dark:hover:bg-[#1D201A] text-[#65675F] dark:text-[#A7AA9C]'
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
          
          {/* 1-CLICK MULTI-THEME SWITCHER PILL (ACADEMIC ⇄ SPATIAL GLASS) */}
          {onToggleThemeSystem && (
            <button
              onClick={() => {
                soundManager.playClick();
                onToggleThemeSystem();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer shadow-subtle-depth active:scale-95 ${
                themeSystem === 'spatial'
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-teal-500/10'
                  : 'bg-white dark:bg-[#151713] text-[#596B35] dark:text-[#A4B879] border-[#D8D8CF] dark:border-[#30342B] hover:border-[#596B35]'
              }`}
              title="Toggle Theme: Academic Olive ⇄ Spatial VisionOS Glass"
            >
              <Sparkles className={`w-3.5 h-3.5 ${themeSystem === 'spatial' ? 'text-cyan-400' : 'text-[#596B35]'}`} />
              <span className="hidden sm:inline">
                {themeSystem === 'spatial' ? '🔮 Spatial Glass' : '🌿 Academic'}
              </span>
            </button>
          )}

          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-[#65675F] dark:text-[#A7AA9C] hover:text-[#191A17] dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-subtle-depth text-xs font-medium"
            title="Search Topics (Cmd + K)"
          >
            <Search className="w-4 h-4 text-[#596B35] dark:text-[#A4B879]" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#EEEEE8] dark:bg-[#1D201A] rounded text-[#85877E]">⌘K</kbd>
          </button>

          {/* Streak Indicator */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth">
            <Flame className="w-4 h-4 text-[#C49A3A] fill-[#C49A3A]" />
            <span className="text-xs font-bold text-[#191A17] dark:text-[#F4F4ED] font-mono">
              {profile.currentStreak}d
            </span>
          </div>

          {/* Theme Toggle (Light / Dark) — hidden in spatial mode */}
          {themeSystem !== 'spatial' && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-[#65675F] hover:text-[#191A17] dark:text-[#A7AA9C] dark:hover:text-white transition-all cursor-pointer shadow-subtle-depth"
              title="Toggle Light/Dark Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-[#C49A3A]" /> : <Moon className="w-4 h-4 text-[#596B35]" />}
            </button>
          )}

          {/* User Profile Avatar */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-xl bg-[#11120F] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-[#DCE8B7] dark:text-[#A4B879] font-bold flex items-center justify-center text-xs shadow-sm cursor-pointer"
          >
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
          </button>
        </div>
      </div>
    </header>
  );
};
