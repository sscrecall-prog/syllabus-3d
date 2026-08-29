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
  Plus,
  Settings,
  ExternalLink,
  Timer,
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
  onOpenFocus?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenAddTopic,
  onOpenFocus
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
      badgeColor: 'bg-[#596B35] text-white'
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
      id: 'revision' as AppView,
      label: 'Spaced Revision',
      icon: RotateCw,
      badge: dueRevisions.length || null,
      badgeColor: 'bg-[#C49A3A] text-white'
    },
    {
      id: 'weak' as AppView,
      label: 'Weak Topics & Traps',
      icon: AlertTriangle,
      badge: weakTopics.length || null,
      badgeColor: 'bg-[#B94A48] text-white'
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
    <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-[#F7F6F0] dark:bg-[#0B0B0D] border-r border-[#D8D8CF] dark:border-[#272730] p-4 justify-between transition-colors z-30 select-none overflow-y-auto">
      <div className="space-y-3.5">
        {/* App Branding */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-[#11120F] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] shadow-sm flex items-center justify-center p-1.5 shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-[#11120F] dark:text-[#F5F5F7] uppercase font-serif">
              SYLLABUS 3D
            </h1>
            <p className="text-[10px] font-bold text-[#596B35] dark:text-[#8B5CF6]">
              Syllabus Mastery System
            </p>
          </div>
        </div>

        {/* Quick Add Custom Topic Action */}
        {onOpenAddTopic && (
          <button
            onClick={onOpenAddTopic}
            className="w-full py-2.5 px-4 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Custom Topic</span>
          </button>
        )}

        {/* DIRECT 1-CLICK FOCUS CHAMBER LAUNCHER IN SIDEBAR */}
        {onOpenFocus && (
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenFocus();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#DCE8B7] dark:bg-[#8B5CF6]/20 hover:bg-[#596B35] hover:text-white dark:hover:bg-[#596B35] text-[#354126] dark:text-[#F5F5F7] border border-[#596B35]/40 text-xs font-extrabold shadow-sm transition-all cursor-pointer group active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#596B35] dark:bg-[#8B5CF6] group-hover:bg-white animate-pulse" />
              <Timer className="w-4 h-4 text-[#596B35] dark:text-[#8B5CF6] group-hover:text-white transition-colors" />
              <span>3D Focus Chamber</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/40 dark:bg-black/20 text-[#354126] dark:text-[#F5F5F7] group-hover:text-white">
              Timer
            </span>
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
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#EEEEE8] dark:bg-[#23232A] text-[#11120F] dark:text-[#F5F5F7] border border-[#D8D8CF] dark:border-[#272730] font-extrabold shadow-sm'
                    : 'text-[#65675F] dark:text-[#A1A1AA] hover:bg-[#EEEEE8] dark:hover:bg-[#151713] hover:text-[#191A17] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 stroke-[2] ${isActive ? 'text-[#596B35] dark:text-[#8B5CF6]' : 'text-[#85877E]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Level Card */}
      <div className="space-y-3 pt-2">
        <a
          href="https://mock-percentile-tracker.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] transition-all group shadow-subtle-depth"
        >
          <div className="flex items-center gap-2.5">
            <img src="/mock_tracker_logo.png" alt="Mock Tracker" className="w-5 h-5 object-contain" />
            <div>
              <span className="text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] block">Mock Tracker</span>
              <span className="text-[10px] text-[#65675F] dark:text-[#85877E]">Score & Percentiles</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#596B35] dark:text-[#8B5CF6]" />
        </a>

        {/* User Level Card */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] space-y-2 shadow-subtle-depth">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#596B35] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] truncate">
                  {profile.name}
                </h4>
                <p className="text-[10px] text-[#65675F] dark:text-[#85877E]">
                  {profile.levelTitle}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#DCE8B7] dark:bg-[#8B5CF6]/20 text-[#354126] dark:text-[#8B5CF6] font-mono">
              Lvl {profile.level}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#EEEEE8] dark:bg-[#23232A] overflow-hidden">
            <div
              className="h-full bg-[#596B35] dark:bg-[#8B5CF6] rounded-full"
              style={{ width: `${(profile.xp % 300) / 3}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
