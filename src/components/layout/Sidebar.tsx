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
    <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-[#F7F6F0] dark:bg-[#0E0F14] border-r border-[#D8D8CF] dark:border-[#232430] p-4 justify-between transition-colors z-30 select-none overflow-y-auto custom-scrollbar">
      <div className="space-y-4">
        
        {/* App Branding with Hover 3D Tilt */}
        <div className="flex items-center gap-3 px-2 py-1.5 group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-[#11120F] dark:bg-[#1E1F2A] border border-[#D8D8CF] dark:border-[#333446] shadow-sm flex items-center justify-center p-1.5 shrink-0 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md transition-all duration-300">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-[#11120F] dark:text-[#F5F5F7] uppercase font-serif group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors">
              SYLLABUS 3D
            </h1>
            <p className="text-[10px] font-bold text-[#596B35] dark:text-[#7AA2F7] flex items-center gap-1">
              <span>Syllabus Mastery System</span>
            </p>
          </div>
        </div>

        {/* Quick Add Custom Topic Action with Glowing Shimmer */}
        {onOpenAddTopic && (
          <button
            onClick={onOpenAddTopic}
            className="group relative w-full py-2.5 px-4 rounded-2xl bg-[#11120F] dark:bg-[#1E1F2A] hover:bg-[#596B35] dark:hover:bg-[#7AA2F7] text-white dark:text-[#F5F5F7] dark:hover:text-black font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 active:scale-95 overflow-hidden border border-transparent dark:border-[#2F3042]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <Plus className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform duration-300" />
            <span>Add Custom Topic</span>
          </button>
        )}

        {/* DIRECT 1-CLICK FOCUS CHAMBER LAUNCHER (Sci-Fi Ambient Pulse) */}
        {onOpenFocus && (
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenFocus();
            }}
            className="group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#DCE8B7] dark:bg-[#7AA2F7]/15 hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] text-[#354126] dark:text-[#7AA2F7] dark:hover:text-black border border-[#596B35]/30 dark:border-[#7AA2F7]/30 text-xs font-extrabold shadow-sm transition-all duration-300 cursor-pointer active:scale-95 overflow-hidden"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] group-hover:bg-white animate-ping absolute opacity-75" />
                <div className="w-2 h-2 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] group-hover:bg-white relative z-10" />
              </div>
              <Timer className="w-4 h-4 text-[#596B35] dark:text-[#7AA2F7] group-hover:text-white dark:group-hover:text-black group-hover:rotate-12 transition-all duration-300" />
              <span>3D Focus Chamber</span>
            </div>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white/60 dark:bg-black/30 text-[#354126] dark:text-[#7AA2F7] group-hover:bg-white/20 group-hover:text-white dark:group-hover:text-black transition-colors">
              Timer
            </span>
          </button>
        )}

        {/* Navigation List with Laser Indicator & Sliding Physics */}
        <nav className="space-y-1 relative">
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
                className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden ${
                  isActive
                    ? 'bg-white dark:bg-[#1E1F2A] text-[#11120F] dark:text-white border border-[#D8D8CF]/80 dark:border-[#333446] font-extrabold shadow-sm translate-x-1'
                    : 'text-[#65675F] dark:text-[#9A9CAE] hover:bg-white/70 dark:hover:bg-[#161720] hover:text-[#11120F] dark:hover:text-white hover:translate-x-1'
                }`}
              >
                {/* 🌟 Left Laser Accent Bar on Active Item */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#596B35] dark:bg-[#7AA2F7] shadow-[0_0_8px_rgba(89,107,53,0.8)] dark:shadow-[0_0_10px_rgba(122,162,247,0.8)] animate-fade-in" />
                )}

                {/* Subtle Moving Sheen on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isActive
                      ? 'bg-[#596B35]/15 dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] scale-105'
                      : 'text-[#85877E] group-hover:text-[#11120F] dark:group-hover:text-white group-hover:scale-115 group-hover:rotate-6'
                  }`}>
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>

                {/* Dynamic Glowing Notification Badge */}
                {item.badge !== null && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black animate-pulse ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Level Card with Shimmer Bar */}
      <div className="space-y-3 pt-3 border-t border-[#D8D8CF]/60 dark:border-[#232430]">
        <a
          href="https://mock-percentile-tracker.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#161720] border border-[#D8D8CF] dark:border-[#272732] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all shadow-xs hover:shadow-md active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center p-0.5 group-hover:scale-110 transition-transform">
              <img src="/mock_tracker_logo.png" alt="Mock Tracker" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] block group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors">
                Mock Tracker
              </span>
              <span className="text-[10px] text-[#65675F] dark:text-[#85877E] block">Score & Percentiles</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>

        {/* User Level Card */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161720] border border-[#D8D8CF] dark:border-[#272732] space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7.5 h-7.5 rounded-xl bg-gradient-to-br from-[#596B35] to-[#45532A] dark:from-[#7AA2F7] dark:to-[#5A4FCF] text-white dark:text-black font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
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

            <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#354126] dark:text-[#7AA2F7] font-mono border border-[#596B35]/20 dark:border-[#7AA2F7]/30">
              Lvl {profile.level}
            </span>
          </div>

          {/* XP Shimmer Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-[#EEEEE8] dark:bg-[#232430] overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#596B35] to-[#789047] dark:from-[#7AA2F7] dark:to-[#8B5CF6] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, (profile.xp % 300) / 3))}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
