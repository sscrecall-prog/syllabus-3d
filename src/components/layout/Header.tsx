import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Sun, Moon, Flame, Zap, ChevronDown, Volume2, VolumeX, ExternalLink, Timer } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenAddTopic?: () => void;
  onOpenFocus?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenSettings, onOpenFocus }) => {
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
    <header className="sticky top-0 z-30 h-16 w-full bg-[#FAF8F5]/95 dark:bg-[#171717]/95 backdrop-blur-md border-b border-[#EBD3A0]/60 dark:border-[#2E2E2E] px-2 sm:px-6 md:px-8 flex items-center justify-between gap-1.5 sm:gap-2 transition-colors">
      {/* Left: Logo & Exam selector */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
        <img
          src="/logo.png"
          alt="SYLLABUS 3D"
          className="md:hidden w-7 h-7 object-contain drop-shadow-sm shrink-0"
        />

        <div className="relative inline-flex items-center min-w-0 max-w-[125px] sm:max-w-[200px]">
          <select
            value={profile.selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="appearance-none pl-2.5 pr-6 py-1 rounded-xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-xs sm:text-sm font-bold text-[#171717] dark:text-[#F5E6C8] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37] truncate w-full shadow-sm"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" />
        </div>

        {currentExam && currentExam.examDate && (
          <span className="hidden xl:inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F5E6C8]/40 dark:bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-xs font-semibold text-[#8C6D15] dark:text-[#D4AF37]">
            Target: {new Date(currentExam.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Desktop Search Bar */}
      <button
        onClick={onOpenSearch}
        className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#222222] border border-[#EBD3A0]/80 dark:border-[#383838] text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all w-48 xl:w-64 group cursor-pointer shadow-sm"
      >
        <Search className="w-4 h-4 group-hover:text-[#D4AF37] transition-colors" />
        <span className="text-xs font-medium flex-1 text-left truncate">
          Quick search topics...
        </span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] bg-[#F5E6C8]/40 dark:bg-[#171717] rounded border border-[#EBD3A0] dark:border-[#383838]">
          Ctrl+K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* 3D Focus Chamber Button */}
        {onOpenFocus && (
          <button
            onClick={onOpenFocus}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/15 to-[#B89327]/25 hover:from-[#D4AF37]/30 hover:to-[#B89327]/40 border border-[#D4AF37]/50 text-[#8C6D15] dark:text-[#D4AF37] text-xs font-extrabold shadow-sm transition-all cursor-pointer group shrink-0"
            title="Launch 3D Pomodoro Focus Chamber"
          >
            <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37] group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Focus Chamber</span>
          </button>
        )}

        {/* Mock Tracker Button */}
        <a
          href="https://mock-percentile-tracker.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-[#222222] hover:bg-[#F5E6C8]/30 dark:hover:bg-[#2A2A2A] border border-[#EBD3A0] dark:border-[#383838] hover:border-[#D4AF37] text-[#171717] dark:text-[#F5E6C8] text-xs font-bold transition-all shadow-sm group shrink-0"
          title="Open Mock Percentile Tracker"
        >
          <img
            src="/mock_tracker_logo.png"
            alt="Mock Tracker"
            className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain group-hover:scale-110 transition-transform"
          />
          <span className="hidden md:inline">Mock Tracker</span>
          <ExternalLink className="w-3 h-3 hidden md:inline text-[#D4AF37]" />
        </a>

        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-white dark:bg-[#222222] border border-[#EBD3A0]/60 dark:border-[#383838] text-[#6B7280] dark:text-[#F5E6C8] hover:border-[#D4AF37] shrink-0 cursor-pointer shadow-sm"
          title="Search Syllabus"
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Streak Badge */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#8C6D15] dark:text-[#D4AF37] shrink-0">
          <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#D4AF37] animate-pulse" />
          <span className="text-[10px] sm:text-xs font-bold">
            {profile.currentStreak}d
          </span>
        </div>

        {/* Sound Toggle (Desktop only) */}
        <button
          onClick={toggleSound}
          title={profile.soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          className="hidden md:block p-2 rounded-xl bg-white dark:bg-[#222222] border border-[#EBD3A0]/60 dark:border-[#383838] text-[#6B7280] dark:text-[#F5E6C8] hover:border-[#D4AF37] shrink-0 cursor-pointer shadow-sm"
        >
          {profile.soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[#D4AF37]" />
          ) : (
            <VolumeX className="w-4 h-4 text-[#6B7280]" />
          )}
        </button>

        {/* Dark Mode Toggle (Always Visible) */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-[#222222] border border-[#EBD3A0]/60 dark:border-[#383838] text-[#171717] dark:text-[#F5E6C8] hover:border-[#D4AF37] transition-colors shrink-0 cursor-pointer shadow-sm"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
          ) : (
            <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6B7280]" />
          )}
        </button>

        {/* Profile Avatar Button */}
        <button
          onClick={onOpenSettings}
          title="Settings & Profile"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B89327] flex items-center justify-center text-[#171717] text-[11px] sm:text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-transform shrink-0 cursor-pointer border border-[#FAF8F5]/30"
        >
          {(user?.name || profile.name).slice(0, 1).toUpperCase()}
        </button>
      </div>
    </header>
  );
};
