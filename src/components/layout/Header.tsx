import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSyllabus } from '../../context/SyllabusContext';
import { Search, Sun, Moon, Flame, Zap, ChevronDown, Volume2, VolumeX, Plus } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenAddTopic?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenSettings, onOpenAddTopic }) => {
  const { toggleTheme, isDark } = useTheme();
  const { profile, updateProfile, exams, currentExam, setSelectedExamId } = useSyllabus();

  const toggleSound = () => {
    const next = !profile.soundEnabled;
    updateProfile({ soundEnabled: next });
    soundManager.setEnabled(next);
    if (next) soundManager.playClick();
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <img
          src="/logo.png"
          alt="SYLLABUS 3D"
          className="md:hidden w-8 h-8 rounded-xl object-cover shadow-sm shadow-brand-500/20 shrink-0"
        />
        <div className="relative min-w-0">
          <select
            value={profile.selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="appearance-none pl-2.5 sm:pl-3.5 pr-6 sm:pr-8 py-1 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 truncate max-w-[130px] sm:max-w-full"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
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
        className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all w-64 lg:w-80 group"
      >
        <Search className="w-4 h-4 group-hover:text-brand-500" />
        <span className="text-xs font-medium flex-1 text-left">
          Quick search topics...
        </span>
        <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
          Ctrl+K
        </kbd>
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Mobile Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          title="Search Syllabus"
        >
          <Search className="w-4 h-4" />
        </button>

        {onOpenAddTopic && (
          <button
            onClick={onOpenAddTopic}
            className="md:hidden p-2 rounded-xl bg-brand-500 text-white shadow-sm"
            title="Add Topic"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400">
          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-orange-500 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-bold">
            {profile.currentStreak}d
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400">
          <Zap className="w-4 h-4 fill-brand-500" />
          <span className="text-xs font-bold">
            {profile.xp} XP
          </span>
        </div>

        <button
          onClick={toggleSound}
          title={profile.soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          className="hidden xs:block p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
        >
          {profile.soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>

        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-[11px] sm:text-xs font-bold shadow-sm hover:scale-105 transition-transform shrink-0"
        >
          {profile.name.slice(0, 1).toUpperCase()}
        </button>
      </div>
    </header>
  );
};
