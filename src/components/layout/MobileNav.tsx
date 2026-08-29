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
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F7F6F0]/95 dark:bg-[#12141A]/95 backdrop-blur-xl border-t border-[#D8D8CF] dark:border-[#272730] px-2 py-1 pb-safe select-none shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        
        {/* Item 1: Home */}
        <button
          onClick={() => {
            soundManager.playClick();
            onSelectView('overview');
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            activeView === 'overview'
              ? 'text-[#596B35] dark:text-[#7AA2F7] font-black'
              : 'text-[#85877E] dark:text-[#787C99] hover:text-[#11120F]'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeView === 'overview' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Home</span>
        </button>

        {/* Item 2: Planner */}
        <button
          onClick={() => {
            soundManager.playClick();
            onSelectView('planner');
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            activeView === 'planner'
              ? 'text-[#596B35] dark:text-[#7AA2F7] font-black'
              : 'text-[#85877E] dark:text-[#787C99] hover:text-[#11120F]'
          }`}
        >
          <CalendarCheck className={`w-5 h-5 ${activeView === 'planner' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Planner</span>
        </button>

        {/* Center Primary Action FAB (+) */}
        {onOpenAddTopic && (
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenAddTopic();
            }}
            className="w-12 h-12 -mt-5 rounded-2xl bg-[#11120F] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-lg flex items-center justify-center active:scale-90 transition-transform cursor-pointer border-2 border-white dark:border-[#12141A]"
            title="Add Custom Study Target"
            aria-label="Add Custom Study Target"
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
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            activeView === 'syllabus'
              ? 'text-[#596B35] dark:text-[#7AA2F7] font-black'
              : 'text-[#85877E] dark:text-[#787C99] hover:text-[#11120F]'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${activeView === 'syllabus' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Syllabus</span>
        </button>

        {/* Item 4: Timer */}
        <button
          onClick={() => {
            soundManager.playClick();
            if (onOpenFocus) onOpenFocus();
          }}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 rounded-2xl text-[#85877E] dark:text-[#787C99] hover:text-[#596B35] dark:hover:text-[#7AA2F7] transition-all active:scale-90 cursor-pointer"
        >
          <Timer className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Timer</span>
        </button>
      </div>
    </nav>
  );
};
