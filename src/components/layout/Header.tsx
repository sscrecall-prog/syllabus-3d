import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Sun, Moon, Flame, Menu, ChevronDown, Volume2, VolumeX, ExternalLink, Timer } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenAddTopic?: () => void;
  onOpenFocus?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSettings,
  onOpenFocus,
  onOpenMobileMenu
}) => {
  const { toggleTheme, isDark } = useTheme();
  const { profile, updateProfile, exams, currentExam, setSelectedExamId } = useSyllabus();
  const { user } = useAuth();

  const toggleSound = () => {
    const next = !profile.soundEnabled;
    updateProfile({ soundEnabled: next });
    soundManager.setEnabled(next);
    if (next) soundManager.playClick();
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-[#FAF8F5]/95 dark:bg-[#171717]/95 backdrop-blur-md border-b border-[#EBD3A0]/60 dark:border-[#2E2E2E] px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2 transition-colors">
      
      {/* 1. MOBILE-ONLY LEFT HEADER (3-Line Menu + Logo + Clean App Name) */}
      <div className="flex md:hidden items-center gap-2.5 min-w-0">
        {/* 3-Line Menu Button */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-[#171717] dark:text-[#F5E6C8] hover:border-[#D4AF37] active:scale-95 transition-all cursor-pointer shadow-sm shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 stroke-[2.5] text-[#D4AF37]" />
        </button>

        {/* App Logo & App Name */}
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="SYLLABUS 3D"
            className="w-7 h-7 object-contain drop-shadow-sm shrink-0"
          />
          <span className="text-xs font-black tracking-wider text-[#171717] dark:text-[#F5E6C8] uppercase font-mono">
            SYLLABUS 3D
          </span>
        </div>
      </div>

      {/* 2. DESKTOP-ONLY LEFT HEADER (Logo & Exam Selector & Target Date) - UNTOUCHED FOR WEBSITE */}
      <div className="hidden md:flex items-center gap-2 sm:gap-3 min-w-0 shrink">
        <div className="relative inline-flex items-center min-w-0 max-w-[140px] sm:max-w-[210px]">
          <select
            value={profile.selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 rounded-xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-xs sm:text-sm font-extrabold text-[#171717] dark:text-[#F5E6C8] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37] truncate w-full shadow-sm"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6D15] dark:text-[#D4AF37]" />
        </div>

        {currentExam && currentExam.examDate && (
          <span className="hidden xl:inline-flex items-center px-3 py-1 rounded-xl bg-[#F5E6C8]/60 dark:bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-bold text-[#8C6D15] dark:text-[#D4AF37]">
            Target: {new Date(currentExam.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Desktop Search Bar (Website view only) */}
      <button
        onClick={onOpenSearch}
        className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-[#4B5563] dark:text-[#A3A3A3] hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all w-52 xl:w-72 group cursor-pointer shadow-sm"
      >
        <Search className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform stroke-[2.2]" />
        <span className="text-xs font-semibold flex-1 text-left truncate">
          Quick search topics...
        </span>
        <kbd className="px-2 py-0.5 text-[10px] font-bold text-[#6B7280] dark:text-[#D4AF37] bg-[#FAF8F5] dark:bg-[#171717] rounded-lg border border-[#EBD3A0] dark:border-[#383838]">
          Ctrl+K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Desktop-only Focus Chamber */}
        {onOpenFocus && (
          <button
            onClick={onOpenFocus}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-[#B89327]/30 hover:from-[#D4AF37]/35 hover:to-[#B89327]/45 border border-[#D4AF37]/60 text-[#8C6D15] dark:text-[#D4AF37] text-xs font-black shadow-sm transition-all cursor-pointer group shrink-0"
            title="Launch 3D Pomodoro Focus Chamber"
          >
            <Timer className="w-4 h-4 text-[#D4AF37] group-hover:rotate-12 transition-transform stroke-[2.2]" />
            <span>Focus Chamber</span>
          </button>
        )}

        {/* Desktop-only Mock Tracker */}
        <a
          href="https://mock-percentile-tracker.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#222222] hover:bg-[#F5E6C8]/30 dark:hover:bg-[#2A2A2A] border border-[#EBD3A0] dark:border-[#383838] hover:border-[#D4AF37] text-[#171717] dark:text-[#F5E6C8] text-xs font-bold transition-all shadow-sm group shrink-0"
          title="Open Mock Percentile Tracker"
        >
          <img
            src="/mock_tracker_logo.png"
            alt="Mock Tracker"
            className="w-4 h-4 object-contain group-hover:scale-110 transition-transform"
          />
          <span>Mock Tracker</span>
          <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
        </a>

        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="p-2 rounded-xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-[#171717] dark:text-[#F5E6C8] hover:border-[#D4AF37] shrink-0 cursor-pointer shadow-sm"
          title="Search Syllabus"
        >
          <Search className="w-4 h-4 text-[#D4AF37] stroke-[2.2]" />
        </button>

        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#8C6D15] dark:text-[#D4AF37] shrink-0">
          <Flame className="w-4 h-4 fill-[#D4AF37] animate-pulse" />
          <span className="text-xs font-black font-mono">
            {profile.currentStreak}d
          </span>
        </div>

        {/* Sound Toggle (Desktop) */}
        <button
          onClick={toggleSound}
          className="hidden sm:block p-2 rounded-xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-[#4B5563] dark:text-[#F5E6C8] hover:border-[#D4AF37] transition-all cursor-pointer shadow-sm"
          title={profile.soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
        >
          {profile.soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[#D4AF37] stroke-[2.2]" />
          ) : (
            <VolumeX className="w-4 h-4 text-[#6B7280] stroke-[2.2]" />
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-[#4B5563] dark:text-[#F5E6C8] hover:border-[#D4AF37] transition-all cursor-pointer shadow-sm"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-[#D4AF37] stroke-[2.2]" />
          ) : (
            <Moon className="w-4 h-4 text-[#4B5563] stroke-[2.2]" />
          )}
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenSettings}
          className="flex items-center pl-0.5 cursor-pointer group"
          title="Account Settings"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#B89327] text-[#171717] font-black flex items-center justify-center text-xs shadow-md border-2 border-white dark:border-[#333333] group-hover:scale-105 transition-transform">
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </button>
      </div>
    </header>
  );
};
