import React from 'react';
import { AppView } from './Sidebar';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  BrainCircuit,
  BookOpen,
  Layers,
  RotateCw,
  AlertTriangle,
  BarChart3,
  Settings,
  X,
  ExternalLink,
  Plus,
  Flame,
  ChevronDown
} from 'lucide-react';
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
  const { profile, dueRevisions, weakTopics, plannerTasks, exams, setSelectedExamId } = useSyllabus();

  if (!isOpen) return null;

  const navItems = [
    {
      id: 'overview' as AppView,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'planner' as AppView,
      label: 'Daily & Weekly Planner',
      icon: CalendarCheck,
      badge: plannerTasks.filter(t => t.status === 'today').length || null,
      badgeColor: 'bg-[#D4AF37] text-[#171717]'
    },
    {
      id: 'mindmap' as AppView,
      label: 'Concept Mind Map',
      icon: BrainCircuit,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'syllabus' as AppView,
      label: 'Syllabus Explorer',
      icon: BookOpen,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'subjects' as AppView,
      label: 'Subjects & Chapters',
      icon: Layers,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'revision' as AppView,
      label: 'Spaced Revision Vault',
      icon: RotateCw,
      badge: dueRevisions.length || null,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'weak' as AppView,
      label: 'Weak Topics & Traps',
      icon: AlertTriangle,
      badge: weakTopics.length || null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'analytics' as AppView,
      label: 'Analytics & Heatmap',
      icon: BarChart3,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'settings' as AppView,
      label: 'Settings & JSON Backup',
      icon: Settings,
      badge: null,
      badgeColor: ''
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-[280px] max-w-[85vw] h-full bg-[#FAF8F5] dark:bg-[#171717] border-r border-[#EBD3A0] dark:border-[#333333] shadow-2xl flex flex-col justify-between p-4 z-10 overflow-y-auto animate-slide-right">
        <div className="space-y-4">
          {/* Header Branding & Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] p-1.5 shadow-sm flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-xs font-black tracking-wider text-[#171717] dark:text-[#F5E6C8] uppercase">
                  SYLLABUS 3D
                </h2>
                <p className="text-[9px] font-bold text-[#8C6D15] dark:text-[#D4AF37]">
                  Smart Exam Tracker
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#6B7280] hover:text-rose-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Exam Selector on Drawer */}
          <div className="relative">
            <select
              value={profile.selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-xs font-extrabold text-[#171717] dark:text-[#F5E6C8] cursor-pointer focus:outline-none shadow-sm"
            >
              {exams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6D15] dark:text-[#D4AF37]" />
          </div>

          {/* Add Custom Topic Button */}
          {onOpenAddTopic && (
            <button
              onClick={() => {
                onClose();
                onOpenAddTopic();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] font-black text-xs shadow-md shadow-[#D4AF37]/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Custom Topic</span>
            </button>
          )}

          {/* Navigation Links */}
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
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89327] text-[#171717] shadow-md shadow-[#D4AF37]/25'
                      : 'text-[#374151] dark:text-[#D4D4D4] hover:bg-[#F5E6C8]/40 dark:hover:bg-[#242424]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 stroke-[2.2] ${isActive ? 'text-[#171717]' : 'text-[#8C6D15] dark:text-[#D4AF37]'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-black/20 text-[#171717]' : item.badgeColor
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom External Mock Tracker link */}
        <div className="pt-3 border-t border-[#EBD3A0]/60 dark:border-[#2E2E2E] space-y-2">
          <a
            href="https://mock-percentile-tracker.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-sm text-xs font-bold text-[#171717] dark:text-[#F5E6C8]"
          >
            <div className="flex items-center gap-2">
              <img src="/mock_tracker_logo.png" alt="Mock Tracker" className="w-4 h-4 object-contain" />
              <span>Mock Tracker</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
          </a>
        </div>
      </div>
    </div>
  );
};
