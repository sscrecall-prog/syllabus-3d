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
    { id: 'planner' as AppView, label: 'Study Planner', icon: CalendarCheck },
    { id: 'platforms' as AppView, label: 'Study Station & Hub', icon: Globe, badge: platforms.length },
    { id: 'mindmap' as AppView, label: 'Concept Mind Map', icon: BrainCircuit },
    { id: 'syllabus' as AppView, label: 'Syllabus Explorer', icon: BookOpen },
    { id: 'revision' as AppView, label: 'Spaced Revision', icon: RotateCw, badge: dueRevisions.length },
    { id: 'weak' as AppView, label: 'Weak Topics', icon: AlertTriangle, badge: weakTopics.length },
    { id: 'analytics' as AppView, label: 'Analytics & Heatmap', icon: BarChart3 },
    { id: 'settings' as AppView, label: 'Settings', icon: Settings }
  ];

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Drawer Card */}
      <div className="relative w-4/5 max-w-xs bg-[#F7F6F0] dark:bg-[#0B0B0D] border-r border-[#D8D8CF] dark:border-[#272730] p-5 flex flex-col justify-between z-10 shadow-2xl animate-slide-right overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D8D8CF] dark:border-[#272730]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#11120F] dark:bg-[#23232A] p-1 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-sm font-black text-[#11120F] dark:text-[#F5F5F7] font-serif uppercase tracking-wider">
                SYLLABUS 3D
              </h2>
            </div>
            <button onClick={onClose} className="p-1 text-[#85877E] hover:text-[#11120F] dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {onOpenAddTopic && (
            <button
              onClick={() => {
                onClose();
                onOpenAddTopic();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#11120F] text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Custom Topic</span>
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${
                    isActive
                      ? 'bg-[#DCE8B7] dark:bg-[#8B5CF6]/20 text-[#11120F] dark:text-[#F5F5F7] font-black'
                      : 'text-[#65675F] dark:text-[#A1A1AA] hover:bg-[#EEEEE8] dark:hover:bg-[#151713]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {Boolean(item.badge) && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#596B35] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#D8D8CF] dark:border-[#272730]">
          <p className="text-[10px] text-[#85877E] text-center">
            Syllabus 3D v2.0 • Syllabus Edition
          </p>
        </div>
      </div>
    </div>
  );
};
