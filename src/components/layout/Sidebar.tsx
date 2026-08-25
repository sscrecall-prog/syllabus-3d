import React from 'react';
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
  Flame,
  Plus,
  Settings,
  ExternalLink,
  LogOut,
  Trophy,
  Sparkles
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

export type AppView =
  | 'overview'
  | 'planner'
  | 'mindmap'
  | 'syllabus'
  | 'subjects'
  | 'revision'
  | 'weak'
  | 'analytics'
  | 'heatmap'
  | 'settings';

interface SidebarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAddTopic?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenAddTopic
}) => {
  const { profile, dueRevisions, weakTopics, plannerTasks } = useSyllabus();
  const { logout, user } = useAuth();

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
      label: 'Study Planner',
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
      label: 'Spaced Revision',
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
      label: 'App Settings',
      icon: Settings,
      badge: null,
      badgeColor: ''
    }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#FAF8F5] dark:bg-[#171717] border-r border-[#EBD3A0]/60 dark:border-[#2E2E2E] p-4 justify-between transition-colors z-20 shrink-0 select-none overflow-y-auto">
      <div className="space-y-4">
        {/* App Branding */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-md flex items-center justify-center p-1.5 shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-[#171717] dark:text-[#F5E6C8] uppercase">
              SYLLABUS 3D
            </h1>
            <p className="text-[10px] font-bold text-[#8C6D15] dark:text-[#D4AF37]">
              Smart Exam Tracker
            </p>
          </div>
        </div>

        {/* Quick Add Custom Topic Action */}
        {onOpenAddTopic && (
          <button
            onClick={onOpenAddTopic}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] font-black text-xs shadow-md shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Custom Topic</span>
          </button>
        )}

        {/* Navigation List */}
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89327] text-[#171717] shadow-md shadow-[#D4AF37]/25'
                    : 'text-[#374151] dark:text-[#D4D4D4] hover:bg-[#F5E6C8]/40 dark:hover:bg-[#242424] hover:text-[#171717] dark:hover:text-white'
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

      {/* Bottom User Level Card & External Tracker */}
      <div className="space-y-3 pt-2">
        <a
          href="https://mock-percentile-tracker.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] hover:border-[#D4AF37] transition-all group shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <img src="/mock_tracker_logo.png" alt="Mock Tracker" className="w-5 h-5 object-contain" />
            <div>
              <span className="text-xs font-black text-[#171717] dark:text-[#F5E6C8] block">Mock Tracker</span>
              <span className="text-[10px] font-semibold text-[#6B7280]">Score & Percentiles</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
        </a>

        {/* User Level Card */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#B89327] text-[#171717] font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <h4 className="text-xs font-black text-[#171717] dark:text-[#F5E6C8] truncate">
                  {profile.name}
                </h4>
                <p className="text-[10px] font-bold text-[#6B7280]">
                  {profile.levelTitle}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-[#D4AF37]/20 text-[#8C6D15] dark:text-[#D4AF37] font-mono">
              Lvl {profile.level}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#2A2A2A] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B89327] rounded-full"
              style={{ width: `${(profile.xp % 300) / 3}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
