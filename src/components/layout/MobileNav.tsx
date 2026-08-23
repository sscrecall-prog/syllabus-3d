import React from 'react';
import { AppView } from './Sidebar';
import { LayoutDashboard, FolderTree, RotateCw, AlertTriangle, Calendar } from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';

interface MobileNavProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeView, onSelectView }) => {
  const { dueRevisions, weakTopics } = useSyllabus();

  const navItems = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'syllabus', label: 'Syllabus', icon: FolderTree },
    { id: 'revision', label: 'Revise', icon: RotateCw, badge: dueRevisions.length },
    { id: 'weak', label: 'Weak', icon: AlertTriangle, badge: weakTopics.length },
    { id: 'heatmap', label: 'Activity', icon: Calendar }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
      {navItems.map(item => {
        const IconComponent = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectView(item.id as AppView)}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl ${isActive ? 'text-brand-500' : 'text-slate-500'}`}
          >
            <div className="relative">
              <IconComponent className="w-5 h-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
