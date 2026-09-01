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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F5]/95 dark:bg-[#10111A]/95 backdrop-blur-xl border-t border-[#D8D8CF] dark:border-[#242638] px-3 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] select-none shadow-[0_-4px_25px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        
        {/* Item 1: Home */}
        <button
          onClick={() => {
            soundManager.playClick();
            onSelectView('overview');
          }}
          className={`flex flex-col items-center justify-center min-w-[60px] min-h-[50px] px-2.5 py-1 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            activeView === 'overview'
              ? 'bg-[#596B35]/15 dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] font-black shadow-xs'
              : 'text-[#85877E] dark:text-[#8E90A6] hover:text-[#11120F] dark:hover:text-white'
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
          className={`flex flex-col items-center justify-center min-w-[60px] min-h-[50px] px-2.5 py-1 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            activeView === 'planner'
              ? 'bg-[#596B35]/15 dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] font-black shadow-xs'
              : 'text-[#85877E] dark:text-[#8E90A6] hover:text-[#11120F] dark:hover:text-white'
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
            className="w-13 h-13 -mt-6 rounded-2xl bg-gradient-to-br from-[#1B1D30] to-[#11120F] dark:from-[#7AA2F7] dark:to-[#5B82D7] text-white dark:text-[#0B0B0D] shadow-[0_4px_20px_rgba(0,0,0,0.3)] dark:shadow-[0_4px_20px_rgba(122,162,247,0.4)] flex items-center justify-center active:scale-90 transition-transform cursor-pointer border-2 border-white dark:border-[#10111A]"
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
          className={`flex flex-col items-center justify-center min-w-[60px] min-h-[50px] px-2.5 py-1 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            activeView === 'syllabus'
              ? 'bg-[#596B35]/15 dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] font-black shadow-xs'
              : 'text-[#85877E] dark:text-[#8E90A6] hover:text-[#11120F] dark:hover:text-white'
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
          className="flex flex-col items-center justify-center min-w-[60px] min-h-[50px] px-2.5 py-1 rounded-2xl text-[#85877E] dark:text-[#8E90A6] hover:text-[#596B35] dark:hover:text-[#7AA2F7] transition-all active:scale-90 cursor-pointer"
        >
          <Timer className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Timer</span>
        </button>
      </div>
    </nav>
  );
};
