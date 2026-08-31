import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  RotateCw,
  AlertTriangle,
  BrainCircuit,
  BookOpen,
  Settings,
  Plus,
  BarChart3,
  Timer,
  ExternalLink,
  Globe,
  Sparkles
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
import { soundManager } from '../../utils/soundEffects';

export type AppView =
  | 'overview'
  | 'planner'
  | 'platforms'
  | 'syllabus'
  | 'subjects'
  | 'revision'
  | 'weak'
  | 'mindmap'
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
  const { profile, dueRevisions, weakTopics, plannerTasks, platforms } = useSyllabus();

  const navItems = [
    {
      id: 'overview' as AppView,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'platforms' as AppView,
      label: 'Study Station & Hub',
      icon: Globe,
      badge: platforms.length || null,
      badgeColor: 'bg-[#5A4FCF] text-white shadow-[0_0_8px_rgba(90,79,207,0.5)]'
    },
    {
      id: 'syllabus' as AppView,
      label: 'Syllabus Explorer',
      icon: BookOpen,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'mindmap' as AppView,
      label: 'Concept Mind Map',
      icon: BrainCircuit,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'planner' as AppView,
      label: 'Study Planner',
      icon: CalendarCheck,
      badge: plannerTasks.filter(t => t.status === 'today').length || null,
      badgeColor: 'bg-[#596B35] text-white shadow-[0_0_8px_rgba(89,107,53,0.5)]'
    },
    {
      id: 'revision' as AppView,
      label: 'Spaced Revision',
      icon: RotateCw,
      badge: dueRevisions.length || null,
      badgeColor: 'bg-[#C49A3A] text-white shadow-[0_0_8px_rgba(196,154,58,0.5)]'
    },
    {
      id: 'weak' as AppView,
      label: 'Weak Topics & Traps',
      icon: AlertTriangle,
      badge: weakTopics.length || null,
      badgeColor: 'bg-[#B94A48] text-white shadow-[0_0_8px_rgba(185,74,72,0.5)]'
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
    <aside className="hidden md:flex flex-col w-60 h-screen fixed top-0 left-0 bg-[#F7F6F0] dark:bg-[#0E0F14] border-r border-[#D8D8CF] dark:border-[#232430] p-3 justify-between transition-colors z-30 select-none overflow-y-auto custom-scrollbar">
      <div className="space-y-2.5">
        
        {/* Compact App Branding */}
        <div className="flex items-center gap-2.5 px-1.5 py-1 group cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-[#11120F] dark:bg-[#1E1F2A] border border-[#D8D8CF] dark:border-[#333446] shadow-xs flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-[#11120F] dark:text-[#F5F5F7] uppercase font-serif group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors leading-none">
              SYLLABUS 3D
            </h1>
            <p className="text-[9px] font-bold text-[#596B35] dark:text-[#7AA2F7] mt-0.5">
              Syllabus Mastery System
            </p>
          </div>
        </div>

        {/* Action Buttons: Add Topic & Focus Chamber */}
        <div className="space-y-1.5">
          {onOpenAddTopic && (
            <button
              onClick={onOpenAddTopic}
              className="group relative w-full py-2 px-3 rounded-xl bg-[#11120F] dark:bg-[#1E1F2A] hover:bg-[#596B35] dark:hover:bg-[#7AA2F7] text-white dark:text-[#F5F5F7] dark:hover:text-black font-bold text-[11px] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95 overflow-hidden border border-transparent dark:border-[#2F3042]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Custom Topic</span>
            </button>
          )}

          {onOpenFocus && (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenFocus();
              }}
              className="group relative w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#DCE8B7] dark:bg-[#7AA2F7]/15 hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] text-[#354126] dark:text-[#7AA2F7] dark:hover:text-black border border-[#596B35]/30 dark:border-[#7AA2F7]/30 text-[11px] font-extrabold shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] group-hover:bg-white animate-pulse" />
                <Timer className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7] group-hover:text-white dark:group-hover:text-black" />
                <span>3D Focus Chamber</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-white/60 dark:bg-black/30 text-[#354126] dark:text-[#7AA2F7] group-hover:bg-white/20 group-hover:text-white dark:group-hover:text-black">
                Timer
              </span>
            </button>
          )}
        </div>

        {/* Compact Navigation List */}
        <nav className="space-y-0.5 relative pt-1 border-t border-[#D8D8CF]/60 dark:border-[#232430]">
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
                className={`group relative w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#1E1F2A] text-[#11120F] dark:text-white border border-[#D8D8CF]/80 dark:border-[#333446] font-black shadow-xs'
                    : 'text-[#65675F] dark:text-[#9A9CAE] hover:bg-white/70 dark:hover:bg-[#161720] hover:text-[#11120F] dark:hover:text-white'
                }`}
              >
                {/* Active Left Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#596B35] dark:bg-[#7AA2F7] shadow-[0_0_6px_rgba(89,107,53,0.8)] dark:shadow-[0_0_8px_rgba(122,162,247,0.8)]" />
                )}

                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 stroke-[2] shrink-0 transition-transform ${
                    isActive ? 'text-[#596B35] dark:text-[#7AA2F7]' : 'text-[#85877E] group-hover:scale-110'
                  }`} />
                  <span className="truncate text-[11px] sm:text-xs">{item.label}</span>
                </div>

                {/* Compact Notification Badge */}
                {item.badge !== null && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Compact Bottom Cards */}
      <div className="space-y-2 pt-2 border-t border-[#D8D8CF]/60 dark:border-[#232430]">
        <a
          href="https://mock-percentile-tracker.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full flex items-center justify-between p-2 px-2.5 rounded-xl bg-white dark:bg-[#161720] border border-[#D8D8CF] dark:border-[#272732] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all shadow-2xs active:scale-98"
        >
          <div className="flex items-center gap-2 min-w-0">
            <img src="/mock_tracker_logo.png" alt="Mock Tracker" className="w-5 h-5 shrink-0 object-contain rounded-md" />
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#191A17] dark:text-[#F5F5F7] block leading-tight group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] truncate">
                Mock Tracker
              </span>
              <span className="text-[9px] text-[#65675F] dark:text-[#85877E] block leading-none truncate">Score & Percentiles</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7] shrink-0" />
        </a>

        {/* Compact User Level Card */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#161720] border border-[#D8D8CF] dark:border-[#272732] space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#596B35] to-[#45532A] dark:from-[#7AA2F7] dark:to-[#5A4FCF] text-white dark:text-black font-black flex items-center justify-center text-[10px] shrink-0 shadow-2xs">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <h4 className="text-[11px] font-bold text-[#191A17] dark:text-[#F5F5F7] truncate leading-tight">
                  {profile.name}
                </h4>
                <p className="text-[9px] text-[#65675F] dark:text-[#85877E] leading-none">
                  {profile.levelTitle}
                </p>
              </div>
            </div>

            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#354126] dark:text-[#7AA2F7] font-mono border border-[#596B35]/20 dark:border-[#7AA2F7]/30">
              Lvl {profile.level}
            </span>
          </div>

          <div className="w-full h-1 rounded-full bg-[#EEEEE8] dark:bg-[#232430] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#596B35] to-[#789047] dark:from-[#7AA2F7] dark:to-[#8B5CF6] rounded-full"
              style={{ width: `${Math.min(100, Math.max(5, (profile.xp % 300) / 3))}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
