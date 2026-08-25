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
    <header className="sticky top-0 z-30 h-16 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-2 sm:px-6 md:px-8 flex items-center justify-between gap-1.5 sm:gap-2">
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
            className="appearance-none pl-2.5 pr-6 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 truncate w-full"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        {currentExam && currentExam.examDate && (
          <span className="hidden xl:inline-flex items-center px-2.5 py-1 rounded-lg bg-brand-50/50 dark:bg-brand-950/50 border border-brand-200/60 dark:border-brand-800/60 text-xs font-medium text-brand-600 dark:text-brand-400">
            Target: {new Date(currentExam.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Desktop Search Bar */}
      <button
        onClick={onOpenSearch}
        className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all w-48 xl:w-64 group cursor-pointer"
      >
        <Search className="w-4 h-4 group-hover:text-brand-500" />
        <span className="text-xs font-medium flex-1 text-left truncate">
          Quick search topics...
        </span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
          Ctrl+K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* 3D Focus Chamber Button */}
        {onOpenFocus && (
          <button
            onClick={onOpenFocus}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-pink-500/15 hover:from-cyan-500/25 hover:to-pink-500/25 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 text-xs font-extrabold shadow-sm transition-all cursor-pointer group shrink-0"
            title="Launch 3D Pomodoro Focus Chamber"
          >
            <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Focus Chamber</span>
          </button>
        )}

        {/* Mock Tracker Button */}
        <a
          href="https://mock-percentile-tracker.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-500/30 hover:border-blue-500/60 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all shadow-sm group shrink-0"
          title="Open Mock Percentile Tracker"
        >
          <img
            src="/mock_tracker_logo.png"
            alt="Mock Tracker"
            className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain group-hover:scale-110 transition-transform"
          />
          <span className="hidden md:inline">Mock Tracker</span>
          <ExternalLink className="w-3 h-3 hidden md:inline text-blue-500" />
        </a>

        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 shrink-0 cursor-pointer"
          title="Search Syllabus"
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Streak Badge */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 shrink-0">
          <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-500 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-bold">
            {profile.currentStreak}d
          </span>
        </div>

        {/* Sound Toggle (Desktop only) */}
        <button
          onClick={toggleSound}
          title={profile.soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          className="hidden md:block p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 shrink-0 cursor-pointer"
        >
          {profile.soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Dark Mode Toggle (Always Visible) */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
          )}
        </button>

        {/* Profile Avatar Button */}
        <button
          onClick={onOpenSettings}
          title="Settings & Profile"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-[11px] sm:text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-transform shrink-0 cursor-pointer"
        >
          {(user?.name || profile.name).slice(0, 1).toUpperCase()}
        </button>
      </div>
    </header>
  );
};
