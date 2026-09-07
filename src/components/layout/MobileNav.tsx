import React from 'react';
import {
  CalendarCheck,
  BookOpen,
  Plus,
  Compass
} from 'lucide-react';
import { AppView } from './Sidebar';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';
import { useSyllabus } from '../../context/SyllabusContext';

interface MobileNavProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAddTopic?: () => void;
  onOpenFocus?: () => void;
  onOpenMobileMenu?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeView,
  onSelectView,
  onOpenAddTopic,
  onOpenFocus,
  onOpenMobileMenu
}) => {
  const { isDark, isOled, isSepia, isLuxury, isGlass } = useTheme();
  const { dueRevisions } = useSyllabus();

  const isHubActive = ['platforms', 'revision', 'weak', 'mindmap', 'analytics', 'settings'].includes(activeView);

  return (
    <nav className="md:hidden fixed bottom-2.5 left-3 right-3 sm:left-6 sm:right-6 max-w-md mx-auto z-40 select-none pb-[calc(env(safe-area-inset-bottom,0px))] pointer-events-none animate-slide-up">
      <div
        className={`pointer-events-auto flex items-center justify-between px-2 py-1.5 rounded-3xl backdrop-blur-2xl border transition-all duration-300 relative ${
          isGlass
            ? 'bg-[#080E24]/80 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white ring-1 ring-white/15'
            : isLuxury
            ? 'bg-[#FAF7F2]/95 border-[#EADBCE] shadow-[0_12px_40px_rgba(200,155,91,0.18)]'
            : isOled
            ? 'bg-black/95 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
            : isSepia
            ? 'bg-[#FBF7F0]/95 border-[#D5C9AD] shadow-[0_10px_30px_rgba(59,48,34,0.12)]'
            : isDark
            ? 'bg-[#12131F]/95 border-[#272A3D] shadow-[0_12px_40px_rgba(0,0,0,0.55)]'
            : 'bg-white/95 border-slate-200/90 shadow-[0_10px_35px_rgba(15,23,42,0.08)]'
        }`}
      >
        {/* Top Subtle Ambient Glass Shine Bevel */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-blue-500/25 dark:via-[#7AA2F7]/35 to-transparent pointer-events-none" />

        {/* Item 1: Home Dashboard */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            haptics.light();
            onSelectView('overview');
          }}
          className={`flex-1 min-h-[46px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl tap-bounce cursor-pointer relative group transition-all duration-200 ${
            activeView === 'overview'
              ? 'text-blue-600 dark:text-[#7AA2F7] font-black'
              : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
          title="Home Dashboard"
          aria-label="Home Dashboard"
          aria-current={activeView === 'overview' ? 'page' : undefined}
        >
          {activeView === 'overview' && (
            <span className="absolute inset-0 bg-blue-600/10 dark:bg-[#7AA2F7]/15 border border-blue-500/20 dark:border-[#7AA2F7]/30 rounded-2xl -z-10 shadow-xs transition-all duration-300" />
          )}
          <img
            src="/dashboard_icon_3d.png"
            alt="Dashboard"
            className={`w-5 h-5 object-contain transition-all duration-300 ${
              activeView === 'overview' ? 'scale-[1.15] -translate-y-0.5 drop-shadow-sm' : 'opacity-85 group-hover:scale-105'
            }`}
          />
          <span className="text-[11px] mt-0.5 tracking-tight font-sans">Home</span>
          {activeView === 'overview' ? (
            <div className="flex items-center justify-center mt-0.5">
              <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 dark:bg-[#7AA2F7] opacity-75" />
                <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-600 dark:bg-[#7AA2F7] shadow-[0_0_6px_#2563EB] dark:shadow-[0_0_8px_#7AA2F7]" />
              </span>
            </div>
          ) : (
            <span className="h-1.5 mt-0.5" />
          )}
        </button>

        {/* Item 2: Syllabus Explorer */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            haptics.light();
            onSelectView('syllabus');
          }}
          className={`flex-1 min-h-[46px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl tap-bounce cursor-pointer relative group transition-all duration-200 ${
            activeView === 'syllabus'
              ? 'text-blue-600 dark:text-[#7AA2F7] font-black'
              : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
          title="Syllabus Explorer"
          aria-label="Syllabus Explorer"
          aria-current={activeView === 'syllabus' ? 'page' : undefined}
        >
          {activeView === 'syllabus' && (
            <span className="absolute inset-0 bg-blue-600/10 dark:bg-[#7AA2F7]/15 border border-blue-500/20 dark:border-[#7AA2F7]/30 rounded-2xl -z-10 shadow-xs transition-all duration-300" />
          )}
          <BookOpen
            className={`w-5 h-5 transition-all duration-300 ${
              activeView === 'syllabus' ? 'scale-[1.15] -translate-y-0.5 stroke-[2.5]' : 'stroke-[2] group-hover:scale-105'
            }`}
          />
          <span className="text-[11px] mt-0.5 tracking-tight font-sans">Syllabus</span>
          {activeView === 'syllabus' ? (
            <div className="flex items-center justify-center mt-0.5">
              <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 dark:bg-[#7AA2F7] opacity-75" />
                <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-600 dark:bg-[#7AA2F7] shadow-[0_0_6px_#2563EB] dark:shadow-[0_0_8px_#7AA2F7]" />
              </span>
            </div>
          ) : (
            <span className="h-1.5 mt-0.5" />
          )}
        </button>

        {/* Center Primary Action Button (Add Target & Focus) */}
        <div className="flex items-center justify-center px-1">
          <div className="relative group">
            {/* Ambient Breathing Aura Animation */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-[#7AA2F7] dark:via-[#9D7CD8] dark:to-[#BB9AF7] opacity-40 blur-sm animate-pulse group-hover:opacity-75 transition-opacity" />
            
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                haptics.medium();
                if (onOpenAddTopic) onOpenAddTopic();
              }}
              className={`relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#4F46E5] dark:from-[#7AA2F7] dark:to-[#8B5CF6] text-white dark:text-[#0B0C15] shadow-lg shadow-blue-600/30 dark:shadow-[#7AA2F7]/35 flex items-center justify-center tap-bounce cursor-pointer ring-4 transition-all duration-300 active:scale-90 ${
                isOled
                  ? 'ring-black'
                  : isDark
                  ? 'ring-[#12131F]'
                  : 'ring-white'
              }`}
              title="Add Custom Study Target"
              aria-label="Quick actions"
            >
              <Plus className="w-5 h-5 stroke-[2.8] transition-transform duration-300 group-hover:rotate-90 group-active:scale-90" />
            </button>
          </div>
        </div>

        {/* Item 3: Planner */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            haptics.light();
            onSelectView('planner');
          }}
          className={`flex-1 min-h-[46px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl tap-bounce cursor-pointer relative group transition-all duration-200 ${
            activeView === 'planner'
              ? 'text-blue-600 dark:text-[#7AA2F7] font-black'
              : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
          title="Daily Planner"
          aria-label="Study Planner"
          aria-current={activeView === 'planner' ? 'page' : undefined}
        >
          {activeView === 'planner' && (
            <span className="absolute inset-0 bg-blue-600/10 dark:bg-[#7AA2F7]/15 border border-blue-500/20 dark:border-[#7AA2F7]/30 rounded-2xl -z-10 shadow-xs transition-all duration-300" />
          )}
          <CalendarCheck
            className={`w-5 h-5 transition-all duration-300 ${
              activeView === 'planner' ? 'scale-[1.15] -translate-y-0.5 stroke-[2.5]' : 'stroke-[2] group-hover:scale-105'
            }`}
          />
          <span className="text-[11px] mt-0.5 tracking-tight font-sans">Planner</span>
          {activeView === 'planner' ? (
            <div className="flex items-center justify-center mt-0.5">
              <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 dark:bg-[#7AA2F7] opacity-75" />
                <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-600 dark:bg-[#7AA2F7] shadow-[0_0_6px_#2563EB] dark:shadow-[0_0_8px_#7AA2F7]" />
              </span>
            </div>
          ) : (
            <span className="h-1.5 mt-0.5" />
          )}
        </button>

        {/* Item 4: More / Hub Drawer */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            haptics.light();
            if (onOpenMobileMenu) {
              onOpenMobileMenu();
            } else if (onOpenFocus) {
              onOpenFocus();
            }
          }}
          className={`flex-1 min-h-[46px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl tap-bounce cursor-pointer relative group transition-all duration-200 ${
            isHubActive
              ? 'text-blue-600 dark:text-[#7AA2F7] font-black'
              : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
          title="More Sections & Tools"
          aria-label="Analytics"
          aria-current={(activeView === 'analytics' || isHubActive) ? 'page' : undefined}
        >
          {isHubActive && (
            <span className="absolute inset-0 bg-blue-600/10 dark:bg-[#7AA2F7]/15 border border-blue-500/20 dark:border-[#7AA2F7]/30 rounded-2xl -z-10 shadow-xs transition-all duration-300" />
          )}
          <div className="relative">
            <Compass
              className={`w-5 h-5 transition-all duration-300 ${
                isHubActive ? 'scale-[1.15] -translate-y-0.5 stroke-[2.5]' : 'stroke-[2] group-hover:scale-105'
              }`}
            />
            {dueRevisions && dueRevisions.length > 0 && !isHubActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse" />
            )}
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-sans">Hub</span>
          {isHubActive ? (
            <div className="flex items-center justify-center mt-0.5">
              <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 dark:bg-[#7AA2F7] opacity-75" />
                <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-600 dark:bg-[#7AA2F7] shadow-[0_0_6px_#2563EB] dark:shadow-[0_0_8px_#7AA2F7]" />
              </span>
            </div>
          ) : (
            <span className="h-1.5 mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};

