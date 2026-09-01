import React from 'react';
import {
  X,
  LayoutDashboard,
  CalendarCheck,
  BrainCircuit,
  BookOpen,
  Layers,
  RotateCw,
  AlertTriangle,
  BarChart3,
  Settings,
  Plus,
  Globe
} from 'lucide-react';
import { AppView } from './Sidebar';
import { useSyllabus } from '../../context/SyllabusContext';
import { soundManager } from '../../utils/soundEffects';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAddTopic?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  onOpenAddTopic
}) => {
  const { profile, dueRevisions, weakTopics, platforms } = useSyllabus();

  if (!isOpen) return null;

  const navItems = [
    { id: 'overview' as AppView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'platforms' as AppView, label: 'Study Station & Hub', icon: Globe, badge: platforms.length },
    { id: 'syllabus' as AppView, label: 'Syllabus Explorer', icon: BookOpen },
    { id: 'mindmap' as AppView, label: 'Concept Mind Map', icon: BrainCircuit },
    { id: 'planner' as AppView, label: 'Study Planner', icon: CalendarCheck },
    { id: 'revision' as AppView, label: 'Spaced Revision', icon: RotateCw, badge: dueRevisions.length },
    { id: 'weak' as AppView, label: 'Weak Topics', icon: AlertTriangle, badge: weakTopics.length },
    { id: 'analytics' as AppView, label: 'Analytics & Heatmap', icon: BarChart3 },
    { id: 'settings' as AppView, label: 'Settings', icon: Settings }
  ];

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-md animate-fade-in" />

      {/* Drawer Card */}
      <div className="relative w-[85%] max-w-xs bg-[#FAF9F5] dark:bg-[#10111A] border-r border-[#D8D8CF] dark:border-[#242638] p-5 flex flex-col justify-between z-10 shadow-2xl animate-slide-right overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#D8D8CF] dark:border-[#242638]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#11120F] dark:bg-[#1E2030] p-1.5 flex items-center justify-center border border-white/10 shadow-sm">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#11120F] dark:text-white font-serif uppercase tracking-wider">
                  SYLLABUS 3D
                </h2>
                <span className="text-[10px] font-mono text-[#85877E]">Mastery Edition</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#85877E] hover:text-[#11120F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {onOpenAddTopic && (
            <button
              onClick={() => {
                onClose();
                onOpenAddTopic();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#1B1D30] to-[#11120F] dark:from-[#7AA2F7] dark:to-[#5B82D7] text-white dark:text-[#0B0B0D] font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer border border-white/10"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Custom Target</span>
            </button>
          )}

          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectView(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-[#596B35]/15 dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] font-black border border-[#596B35]/30 dark:border-[#7AA2F7]/40 shadow-xs'
                      : 'text-[#65675F] dark:text-[#A1A1B2] hover:bg-[#EEEEE8] dark:hover:bg-[#181926]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {Boolean(item.badge) && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#D8D8CF] dark:border-[#242638]">
          <p className="text-[10px] text-[#85877E] text-center font-mono">
            Syllabus 3D • Focus First
          </p>
        </div>
      </div>
    </div>
  );
};
