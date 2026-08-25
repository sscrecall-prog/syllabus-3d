import React from 'react';
import { AppView } from './Sidebar';
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  RotateCw,
  Plus
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
  const { dueRevisions, plannerTasks } = useSyllabus();

  const navItems = [
    { id: 'overview' as AppView, label: 'Home', icon: LayoutDashboard },
    {
      id: 'planner' as AppView,
      label: 'Planner',
      icon: CalendarCheck,
      badge: plannerTasks.filter(t => t.status === 'today').length || null
    },
    { id: 'syllabus' as AppView, label: 'Syllabus', icon: BookOpen },
    {
      id: 'revision' as AppView,
      label: 'Revise',
      icon: RotateCw,
      badge: dueRevisions.length || null
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#171717]/95 backdrop-blur-lg border-t border-[#EBD3A0]/60 dark:border-[#2E2E2E] px-3 py-2 flex items-center justify-around shadow-2xl transition-colors">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              soundManager.playClick();
              onSelectView(item.id);
            }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl relative transition-all cursor-pointer ${
              isActive
                ? 'text-[#8C6D15] dark:text-[#D4AF37] scale-105'
                : 'text-[#4B5563] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 stroke-[2.2] ${isActive ? 'text-[#D4AF37]' : ''}`} />
            <span className="text-[10px] font-black mt-0.5">{item.label}</span>

            {item.badge !== null && item.badge > 0 && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-[#D4AF37] text-[#171717] text-[9px] font-black flex items-center justify-center shadow-sm">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      {/* Quick Add Custom Topic FAB on Mobile */}
      {onOpenAddTopic && (
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenAddTopic();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#B89327] text-[#171717] shadow-lg shadow-[#D4AF37]/30 scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Add Custom Topic"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>
      )}
    </div>
  );
};
