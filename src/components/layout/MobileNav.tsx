import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Network,
  FolderTree,
  Plus,
  Timer
} from 'lucide-react';
import { AppView } from './Sidebar';
import { useSyllabus } from '../../context/SyllabusContext';

interface MobileNavProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAddTopic: () => void;
  onOpenFocus?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeView,
  onSelectView,
  onOpenAddTopic,
  onOpenFocus
}) => {
  const { plannerTasks } = useSyllabus();
  const todayCount = plannerTasks.filter(t => t.status === 'today' || t.status === 'in_progress').length;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#171717]/95 backdrop-blur-md border-t border-[#EBD3A0]/60 dark:border-[#2E2E2E] px-2 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onSelectView('overview')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
          activeView === 'overview'
            ? 'text-[#8C6D15] dark:text-[#D4AF37]'
            : 'text-[#6B7280]'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Dashboard</span>
      </button>

      <button
        onClick={() => onSelectView('planner')}
        className={`relative flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
          activeView === 'planner'
            ? 'text-[#8C6D15] dark:text-[#D4AF37]'
            : 'text-[#6B7280]'
        }`}
      >
        <CalendarCheck className="w-5 h-5" />
        <span>Planner</span>
        {todayCount > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#D4AF37]" />
        )}
      </button>

      {/* Central Floating Action Button (Add Topic) */}
      <button
        onClick={onOpenAddTopic}
        className="w-12 h-12 -mt-6 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#B89327] text-[#171717] flex items-center justify-center shadow-lg shadow-[#D4AF37]/35 border-2 border-white dark:border-[#171717] active:scale-95 transition-transform"
        title="Add Custom Topic"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      <button
        onClick={() => onSelectView('mindmap')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
          activeView === 'mindmap'
            ? 'text-[#8C6D15] dark:text-[#D4AF37]'
            : 'text-[#6B7280]'
        }`}
      >
        <Network className="w-5 h-5" />
        <span>Mind Map</span>
      </button>

      <button
        onClick={() => onSelectView('syllabus')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
          activeView === 'syllabus'
            ? 'text-[#8C6D15] dark:text-[#D4AF37]'
            : 'text-[#6B7280]'
        }`}
      >
        <FolderTree className="w-5 h-5" />
        <span>Syllabus</span>
      </button>
    </nav>
  );
};
