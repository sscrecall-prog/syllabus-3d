import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  Plus,
  Timer
} from 'lucide-react';
import { AppView } from './Sidebar';
import { soundManager } from '../../utils/soundEffects';

interface MobileNavProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAddTopic?: () => void;
  onOpenFocus?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeView,
  onSelectView,
  onOpenAddTopic,
  onOpenFocus
}) => {
  const navItems = [
    { id: 'overview' as AppView, label: 'Home', icon: LayoutDashboard },
    { id: 'planner' as AppView, label: 'Planner', icon: CalendarCheck },
    { id: 'syllabus' as AppView, label: 'Syllabus', icon: BookOpen },
    { id: 'focus_action' as const, label: 'Timer', icon: Timer }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F7F6F0]/95 dark:bg-[#0B0B0D]/95 backdrop-blur-lg border-t border-[#D8D8CF] dark:border-[#272730] px-3 py-1.5 pb-safe select-none">
      <div className="flex items-center justify-around relative">
        {/* Item 1: Home */}
        <button
          onClick={() => {
            soundManager.playClick();
            onSelectView('overview');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === 'overview'
              ? 'text-[#596B35] dark:text-[#8B5CF6] font-black'
              : 'text-[#85877E] dark:text-[#A1A1AA]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {/* Item 2: Planner */}
        <button
          onClick={() => {
            soundManager.playClick();
            onSelectView('planner');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === 'planner'
              ? 'text-[#596B35] dark:text-[#8B5CF6] font-black'
              : 'text-[#85877E] dark:text-[#A1A1AA]'
          }`}
        >
          <CalendarCheck className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-bold">Planner</span>
        </button>

        {/* Center Primary Action FAB (+) */}
        {onOpenAddTopic && (
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenAddTopic();
            }}
            className="w-11 h-11 -mt-4 rounded-2xl bg-[#11120F] dark:bg-[#23232A] border-2 border-[#596B35] text-[#DCE8B7] dark:text-[#8B5CF6] shadow-elevated-card flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
            title="Add Custom Topic"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        )}

        {/* Item 3: Syllabus */}
        <button
          onClick={() => {
            soundManager.playClick();
            onSelectView('syllabus');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === 'syllabus'
              ? 'text-[#596B35] dark:text-[#8B5CF6] font-black'
              : 'text-[#85877E] dark:text-[#A1A1AA]'
          }`}
        >
          <BookOpen className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-bold">Syllabus</span>
        </button>

        {/* Item 4: Timer */}
        <button
          onClick={() => {
            soundManager.playClick();
            if (onOpenFocus) onOpenFocus();
          }}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[#85877E] dark:text-[#A1A1AA] hover:text-[#596B35] dark:hover:text-[#8B5CF6] transition-all cursor-pointer"
        >
          <Timer className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-bold">Timer</span>
        </button>
      </div>
    </nav>
  );
};
