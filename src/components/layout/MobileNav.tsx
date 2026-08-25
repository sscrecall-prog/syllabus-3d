import React from 'react';
import { AppView } from './Sidebar';
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  Plus,
  Timer
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
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
  const { plannerTasks } = useSyllabus();

  const todayPlannerCount = plannerTasks.filter(t => t.status === 'today').length;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#171717]/95 backdrop-blur-2xl border-t border-[#EBD3A0]/60 dark:border-[#2E2E2E] px-3 py-1.5 pb-safe flex items-center justify-around shadow-2xl transition-colors select-none">
      
      {/* 1. Home / Dashboard */}
      <button
        onClick={() => {
          soundManager.playClick();
          onSelectView('overview');
        }}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl relative transition-all cursor-pointer ${
          activeView === 'overview'
            ? 'text-[#8C6D15] dark:text-[#D4AF37] scale-105'
            : 'text-[#6B7280] dark:text-[#A3A3A3]'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${activeView === 'overview' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : ''}`}>
          <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[10px] font-black mt-0.5">Home</span>
      </button>

      {/* 2. Planner */}
      <button
        onClick={() => {
          soundManager.playClick();
          onSelectView('planner');
        }}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl relative transition-all cursor-pointer ${
          activeView === 'planner'
            ? 'text-[#8C6D15] dark:text-[#D4AF37] scale-105'
            : 'text-[#6B7280] dark:text-[#A3A3A3]'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all relative ${activeView === 'planner' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : ''}`}>
          <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
          {todayPlannerCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4AF37] text-[#171717] text-[9px] font-black flex items-center justify-center shadow-sm">
              {todayPlannerCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-black mt-0.5">Planner</span>
      </button>

      {/* CENTER FAB: Add Custom Topic */}
      {onOpenAddTopic && (
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenAddTopic();
          }}
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] shadow-lg shadow-[#D4AF37]/35 -mt-5 border-2 border-white dark:border-[#171717] active:scale-90 transition-transform cursor-pointer"
          title="Add Custom Topic"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      )}

      {/* 3. Syllabus Explorer */}
      <button
        onClick={() => {
          soundManager.playClick();
          onSelectView('syllabus');
        }}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl relative transition-all cursor-pointer ${
          activeView === 'syllabus'
            ? 'text-[#8C6D15] dark:text-[#D4AF37] scale-105'
            : 'text-[#6B7280] dark:text-[#A3A3A3]'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${activeView === 'syllabus' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : ''}`}>
          <BookOpen className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[10px] font-black mt-0.5">Syllabus</span>
      </button>

      {/* 4. Timer: 3D Pomodoro Focus Chamber */}
      <button
        onClick={() => {
          soundManager.playClick();
          if (onOpenFocus) {
            onOpenFocus();
          }
        }}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl relative transition-all cursor-pointer text-[#6B7280] dark:text-[#A3A3A3] hover:text-[#8C6D15] dark:hover:text-[#D4AF37] active:scale-95 group"
      >
        <div className="p-1 rounded-xl transition-all group-hover:bg-[#D4AF37]/20 group-hover:text-[#D4AF37]">
          <Timer className="w-5 h-5 stroke-[2.2] text-[#D4AF37] group-hover:rotate-12 transition-transform" />
        </div>
        <span className="text-[10px] font-black mt-0.5 text-[#171717] dark:text-[#F5E6C8]">Timer</span>
      </button>
    </div>
  );
};
