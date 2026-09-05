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
  Sparkles,
  Keyboard
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

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
  onOpenShortcuts?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenAddTopic,
  onOpenFocus,
  onOpenShortcuts
}) => {
  const { profile, dueRevisions, weakTopics, plannerTasks, platforms } = useSyllabus();
  const { user } = useAuth();

  const navItems = [
    {
      id: 'overview' as AppView,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: '',
      shortcut: '1'
    },
    {
      id: 'syllabus' as AppView,
      label: 'Syllabus Explorer',
      icon: BookOpen,
      badge: null,
      badgeColor: '',
      shortcut: '2'
    },
    {
      id: 'planner' as AppView,
      label: 'Study Planner',
      icon: CalendarCheck,
      badge: plannerTasks.filter(t => t.status === 'today').length || null,
      badgeColor: 'bg-[#2563EB] text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]',
      shortcut: '3'
    },
    {
      id: 'revision' as AppView,
      label: 'Spaced Revision',
      icon: RotateCw,
      badge: dueRevisions.length || null,
      badgeColor: 'bg-[#C49A3A] text-white shadow-[0_0_8px_rgba(196,154,58,0.5)]',
      shortcut: '4'
    },
    {
      id: 'weak' as AppView,
      label: 'Weak Topics & Traps',
      icon: AlertTriangle,
      badge: weakTopics.length || null,
      badgeColor: 'bg-[#B94A48] text-white shadow-[0_0_8px_rgba(185,74,72,0.5)]',
      shortcut: '5'
    },
    {
      id: 'mindmap' as AppView,
      label: 'Concept Mind Map',
      icon: BrainCircuit,
      badge: null,
      badgeColor: '',
      shortcut: '6'
    },
    {
      id: 'analytics' as AppView,
      label: 'Analytics & Heatmap',
      icon: BarChart3,
      badge: null,
      badgeColor: '',
      shortcut: '7'
    },
    {
      id: 'platforms' as AppView,
      label: 'Study Station & Hub',
      icon: Globe,
      badge: platforms.length || null,
      badgeColor: 'bg-[#5A4FCF] text-white shadow-[0_0_8px_rgba(90,79,207,0.5)]',
      shortcut: '8'
    },
    {
      id: 'settings' as AppView,
      label: 'App Settings',
      icon: Settings,
      badge: null,
      badgeColor: '',
      shortcut: '9'
    }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-white dark:bg-[#0B0B0D] border-r border-[#E2E8F0] dark:border-[#272730] p-3 justify-between transition-colors z-30 select-none overflow-y-auto custom-scrollbar">
      <div className="space-y-2.5">
        
        {/* Compact App Branding */}
        <div className="flex items-center gap-2.5 px-1.5 py-1 group cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-[#11120F] dark:bg-[#1E1F2A] border border-[#E2E8F0] dark:border-[#333446] shadow-xs flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-[13px] font-black tracking-wider text-[#11120F] dark:text-[#F5F5F7] uppercase font-serif group-hover:text-[#2563EB] dark:group-hover:text-[#7AA2F7] transition-colors leading-none">
              SYLLABUS 3D
            </h1>
            <p className="text-[11px] font-bold text-[#2563EB] dark:text-[#7AA2F7] mt-0.5">
              Syllabus Mastery System
            </p>
          </div>
        </div>

        {/* Action Buttons: Add Topic & Focus Chamber */}
        <div className="space-y-1.5">
          {onOpenAddTopic && (
            <button
              onClick={onOpenAddTopic}
              className="group relative w-full py-2 px-3 rounded-xl bg-[#11120F] dark:bg-[#1E1F2A] hover:bg-[#2563EB] dark:hover:bg-[#7AA2F7] text-white dark:text-[#F5F5F7] dark:hover:text-black font-bold text-[13px] shadow-xs flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-95 overflow-hidden border border-transparent dark:border-[#2F3042] tap-bounce"
              title="Add Custom Topic (Press N)"
            >
              <div className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Custom Topic</span>
              </div>
              <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] font-mono font-bold bg-white/20 dark:bg-black/30 rounded border border-white/20 dark:border-white/10 text-white/90 dark:text-[#CBD5E1]">
                N
              </kbd>
            </button>
          )}

          {onOpenFocus && (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenFocus();
              }}
              className="group relative w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#EFF6FF] dark:bg-[#7AA2F7]/15 hover:bg-[#2563EB] hover:text-white dark:hover:bg-[#7AA2F7] text-[#1D4ED8] dark:text-[#7AA2F7] dark:hover:text-black border border-[#BFDBFE] dark:border-[#7AA2F7]/30 text-[13px] font-extrabold shadow-xs transition-all duration-200 cursor-pointer active:scale-95 tap-bounce"
              title="3D Focus Chamber (Press F)"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#7AA2F7] group-hover:bg-white animate-pulse" />
                <Timer className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7] group-hover:text-white dark:group-hover:text-black" />
                <span>3D Focus Chamber</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-white/60 dark:bg-black/30 text-[#1D4ED8] dark:text-[#7AA2F7] group-hover:bg-white/20 group-hover:text-white dark:group-hover:text-black">
                  Timer
                </span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] font-mono font-bold bg-white/60 dark:bg-black/30 text-[#1D4ED8] dark:text-[#7AA2F7] group-hover:bg-white/20 group-hover:text-white dark:group-hover:text-black rounded border border-black/5 dark:border-white/10">
                  F
                </kbd>
              </div>
            </button>
          )}
        </div>

        {/* Compact Navigation List */}
        <nav className="space-y-0.5 relative pt-1 border-t border-[#E2E8F0] dark:border-[#232430]">
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
                    ? 'bg-white dark:bg-[#1E1F2A] text-[#11120F] dark:text-white border border-[#E2E8F0] dark:border-[#333446] font-black shadow-xs'
                    : 'text-[#65675F] dark:text-[#CBD5E1] hover:bg-white/70 dark:hover:bg-[#161720] hover:text-[#11120F] dark:hover:text-white'
                }`}
              >
                {/* Active Left Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#2563EB] dark:bg-[#7AA2F7] shadow-[0_0_6px_rgba(37,99,235,0.6)] dark:shadow-[0_0_8px_rgba(122,162,247,0.8)]" />
                )}

                <div className="flex items-center gap-2.5 min-w-0">
                  {item.id === 'overview' ? (
                    <img
                      src="/dashboard_icon_3d.png"
                      alt="Dashboard"
                      className={`w-4 h-4 object-contain shrink-0 transition-transform ${
                        isActive ? 'scale-110 drop-shadow-sm' : 'opacity-80 group-hover:scale-110'
                      }`}
                    />
                  ) : (
                    <Icon className={`w-4 h-4 stroke-[2] shrink-0 transition-transform ${
                      isActive ? 'text-[#2563EB] dark:text-[#7AA2F7]' : 'text-[#85877E] dark:text-[#94A3B8] group-hover:scale-110 group-hover:text-[#11120F] dark:group-hover:text-white'
                    }`} />
                  )}
                  <span className="truncate text-[13px] font-semibold">{item.label}</span>
                </div>

                {/* Compact Notification Badge & Keyboard Shortcut Indicator */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge !== null && item.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono font-black ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.shortcut && (
                    <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#85877E] dark:text-[#64748B] group-hover:text-[#2563EB] dark:group-hover:text-[#7AA2F7] rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-colors">
                      {item.shortcut}
                    </kbd>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Compact Bottom Cards */}
      <div className="space-y-2 pt-2 border-t border-[#E2E8F0] dark:border-[#232430]">
        <a
          href="https://mock-percentile-tracker.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full flex items-center justify-between p-2 px-2.5 rounded-xl bg-white dark:bg-[#161720] border border-[#E2E8F0] dark:border-[#272732] hover:border-[#2563EB] dark:hover:border-[#7AA2F7] transition-all shadow-2xs active:scale-98"
        >
          <div className="flex items-center gap-2 min-w-0">
            <img src="/mock_tracker_logo.png" alt="Mock Tracker" className="w-5 h-5 shrink-0 object-contain rounded-md" />
            <div className="min-w-0">
              <span className="text-[13px] font-bold text-[#191A17] dark:text-[#F5F5F7] block leading-tight group-hover:text-[#2563EB] dark:group-hover:text-[#7AA2F7] truncate">
                Mock Tracker
              </span>
              <span className="text-[11px] text-[#65675F] dark:text-[#CBD5E1] block leading-none truncate">Score & Percentiles</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7] shrink-0" />
        </a>

        {/* Compact User Level Card */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#161720] border border-[#E2E8F0] dark:border-[#272732] space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-indigo-600 dark:from-[#7AA2F7] dark:to-[#5A4FCF] text-white dark:text-black font-black flex items-center justify-center text-[13px] shrink-0 shadow-2xs overflow-hidden">
                {(profile.avatarUrl || user?.avatarUrl) ? (
                  <img
                    src={profile.avatarUrl || user?.avatarUrl}
                    alt={user?.name || profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user?.name || profile.name ? (user?.name || profile.name).charAt(0).toUpperCase() : 'A')
                )}
              </div>
              <div className="truncate">
                <h4 className="text-[13px] font-bold text-[#191A17] dark:text-[#F5F5F7] truncate leading-tight">
                  {user?.name || profile.name}
                </h4>
                <p className="text-[11px] text-[#65675F] dark:text-[#CBD5E1] leading-none">
                  {profile.levelTitle}
                </p>
              </div>
            </div>

            <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-md bg-[#EFF6FF] dark:bg-[#7AA2F7]/20 text-[#1D4ED8] dark:text-[#7AA2F7] font-mono border border-[#BFDBFE] dark:border-[#7AA2F7]/30">
              Lvl {profile.level}
            </span>
          </div>

          <div className="w-full h-1 rounded-full bg-[#E2E8F0] dark:bg-[#232430] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2563EB] to-indigo-600 dark:from-[#7AA2F7] dark:to-[#8B5CF6] rounded-full"
              style={{ width: `${Math.min(100, Math.max(5, (profile.xp % 300) / 3))}%` }}
            />
          </div>
        </div>

        {/* ♿ Keyboard Shortcuts Cheatsheet Trigger */}
        {onOpenShortcuts && (
          <button
            onClick={() => {
              soundManager.playClick();
              haptics.selection();
              onOpenShortcuts();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#161720] border border-[#E2E8F0] dark:border-[#272732] hover:border-[#2563EB] dark:hover:border-[#7AA2F7] text-[#65675F] hover:text-[#0F172A] dark:text-[#CBD5E1] dark:hover:text-white transition-all cursor-pointer text-xs font-semibold active:scale-98 tap-bounce shadow-2xs"
            title="Keyboard Shortcuts Cheatsheet (Press ?)"
            aria-label="Keyboard Shortcuts Cheatsheet (Press ?)"
          >
            <div className="flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7]" />
              <span className="text-[12px] font-semibold">Shortcuts</span>
            </div>
            <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#F1F5F9] dark:bg-[#202234] border border-[#CBD5E1] dark:border-[#33354C] text-[#64748B] dark:text-[#94A3B8]">
              ?
            </kbd>
          </button>
        )}
      </div>
    </aside>
  );
};

