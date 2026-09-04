import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  Plus,
  Compass,
  Timer
} from 'lucide-react';
import { AppView } from './Sidebar';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

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
  return (
    <nav className="md:hidden fixed bottom-2.5 left-3 right-3 sm:left-6 sm:right-6 max-w-md mx-auto z-40 select-none pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-between px-2 py-1 rounded-3xl bg-white/95 dark:bg-[#12131F]/96 backdrop-blur-md border border-[#E2E8F0] dark:border-[#272A3D] shadow-xl">
        
        {/* Item 1: Home Dashboard */}
        <button
          onClick={() => {
            soundManager.playClick();
            haptics.light();
            onSelectView('overview');
          }}
          className={`flex-1 min-h-[46px] flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer relative ${
            activeView === 'overview'
              ? 'text-[#596B35] dark:text-[#7AA2F7] font-black'
              : 'text-[#85877E] dark:text-[#8E90A6] hover:text-[#11120F] dark:hover:text-white'
          }`}
          title="Home Dashboard"
        >
          {activeView === 'overview' && (
            <span className="absolute inset-0 bg-[#596B35]/12 dark:bg-[#7AA2F7]/15 rounded-2xl -z-10 shadow-2xs" />
          )}
          <img
            src="/dashboard_icon_3d.png"
            alt="Dashboard"
            className={`w-5 h-5 object-contain transition-transform ${
              activeView === 'overview' ? 'scale-110 drop-shadow-sm' : 'opacity-80'
            }`}
          />
          <span className="text-[11px] mt-0.5 tracking-tight font-sans">Home</span>
          {activeView === 'overview' && (
            <span className="w-1 h-1 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] mt-0.5 animate-pulse" />
          )}
        </button>

        {/* Item 2: Syllabus Explorer */}
        <button
          onClick={() => {
            soundManager.playClick();
            haptics.light();
            onSelectView('syllabus');
          }}
          className={`flex-1 min-h-[46px] flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer relative ${
            activeView === 'syllabus'
              ? 'text-[#596B35] dark:text-[#7AA2F7] font-black'
              : 'text-[#85877E] dark:text-[#8E90A6] hover:text-[#11120F] dark:hover:text-white'
          }`}
          title="Syllabus Explorer"
        >
          {activeView === 'syllabus' && (
            <span className="absolute inset-0 bg-[#596B35]/12 dark:bg-[#7AA2F7]/15 rounded-2xl -z-10 shadow-2xs" />
          )}
          <BookOpen className={`w-5 h-5 ${activeView === 'syllabus' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight font-sans">Syllabus</span>
          {activeView === 'syllabus' && (
            <span className="w-1 h-1 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] mt-0.5 animate-pulse" />
          )}
        </button>

        {/* Center Primary Action Button (Add Target & Focus) */}
        <div className="flex items-center justify-center px-1">
          <button
            onClick={() => {
              soundManager.playClick();
              haptics.medium();
              if (onOpenAddTopic) onOpenAddTopic();
            }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#596B35] to-[#7FA04B] dark:from-[#7AA2F7] dark:to-[#5B82D7] text-white dark:text-[#0B0B0D] shadow-md shadow-[#596B35]/25 dark:shadow-[#7AA2F7]/30 flex items-center justify-center active:scale-90 transition-transform cursor-pointer border-2 border-white dark:border-[#12131F]"
            title="Add Custom Study Target"
            aria-label="Add Custom Target"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Item 3: Planner */}
        <button
          onClick={() => {
            soundManager.playClick();
            haptics.light();
            onSelectView('planner');
          }}
          className={`flex-1 min-h-[46px] flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer relative ${
            activeView === 'planner'
              ? 'text-[#596B35] dark:text-[#7AA2F7] font-black'
              : 'text-[#85877E] dark:text-[#8E90A6] hover:text-[#11120F] dark:hover:text-white'
          }`}
          title="Daily Planner"
        >
          {activeView === 'planner' && (
            <span className="absolute inset-0 bg-[#596B35]/12 dark:bg-[#7AA2F7]/15 rounded-2xl -z-10 shadow-2xs" />
          )}
          <CalendarCheck className={`w-5 h-5 ${activeView === 'planner' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight font-sans">Planner</span>
          {activeView === 'planner' && (
            <span className="w-1 h-1 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] mt-0.5 animate-pulse" />
          )}
        </button>

        {/* Item 4: More / Hub Drawer */}
        <button
          onClick={() => {
            soundManager.playClick();
            haptics.light();
            if (onOpenMobileMenu) {
              onOpenMobileMenu();
            } else if (onOpenFocus) {
              onOpenFocus();
            }
          }}
          className={`flex-1 min-h-[46px] flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer relative ${
            ['platforms', 'revision', 'weak', 'mindmap', 'analytics', 'settings'].includes(activeView)
              ? 'text-[#596B35] dark:text-[#7AA2F7] font-black'
              : 'text-[#85877E] dark:text-[#8E90A6] hover:text-[#11120F] dark:hover:text-white'
          }`}
          title="More Sections & Tools"
        >
          {['platforms', 'revision', 'weak', 'mindmap', 'analytics', 'settings'].includes(activeView) && (
            <span className="absolute inset-0 bg-[#596B35]/12 dark:bg-[#7AA2F7]/15 rounded-2xl -z-10 shadow-2xs" />
          )}
          <Compass className={`w-5 h-5 ${['platforms', 'revision', 'weak', 'mindmap', 'analytics', 'settings'].includes(activeView) ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight font-sans">Hub</span>
          {['platforms', 'revision', 'weak', 'mindmap', 'analytics', 'settings'].includes(activeView) && (
            <span className="w-1 h-1 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] mt-0.5 animate-pulse" />
          )}
        </button>
      </div>
    </nav>
  );
};

