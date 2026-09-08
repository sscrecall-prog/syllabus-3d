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
  Keyboard,
  Clock,
  Users,
  PanelLeftClose
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
  | 'pacing'
  | 'settings';

interface SidebarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAddTopic?: () => void;
  onOpenFocus?: () => void;
  onOpenShortcuts?: () => void;
  onOpenProfileSwitcher?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenAddTopic,
  onOpenFocus,
  onOpenShortcuts,
  onOpenProfileSwitcher,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { profile, dueRevisions, weakTopics, plannerTasks, platforms, overallStats } = useSyllabus();
  const { user } = useAuth();

  const navSections = [
    {
      title: 'CORE MODULES',
      items: [
        {
          id: 'overview' as AppView,
          label: 'Dashboard',
          icon: LayoutDashboard,
          isDashboard: true,
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
          id: 'planner' as AppView,
          label: 'Study Planner',
          icon: CalendarCheck,
          badge: plannerTasks.filter(t => t.status === 'today').length || null,
          badgeColor: 'bg-[#2563EB] text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]'
        },
        {
          id: 'pacing' as AppView,
          label: 'Target Pacing',
          icon: Clock,
          badge: 'Live',
          badgeColor: 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
        }
      ]
    },
    {
      title: 'MASTERY & REVISION',
      items: [
        {
          id: 'revision' as AppView,
          label: 'Spaced Revision',
          icon: RotateCw,
          badge: dueRevisions.length ? `${dueRevisions.length} due` : null,
          badgeColor: 'bg-[#C49A3A] text-white shadow-[0_0_8px_rgba(196,154,58,0.5)]'
        },
        {
          id: 'weak' as AppView,
          label: 'Weak Topics',
          icon: AlertTriangle,
          badge: weakTopics.length || null,
          badgeColor: 'bg-[#B94A48] text-white shadow-[0_0_8px_rgba(185,74,72,0.5)]'
        },
        {
          id: 'mindmap' as AppView,
          label: 'Concept Mind Map',
          icon: BrainCircuit,
          badge: null,
          badgeColor: ''
        },
        {
          id: 'analytics' as AppView,
          label: 'Analytics & Heatmap',
          icon: BarChart3,
          badge: null,
          badgeColor: ''
        }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'platforms' as AppView,
          label: 'Study Station & Hub',
          icon: Globe,
          badge: platforms.length || null,
          badgeColor: 'bg-[#5A4FCF] text-white shadow-[0_0_8px_rgba(90,79,207,0.5)]'
        },
        {
          id: 'settings' as AppView,
          label: 'Settings',
          icon: Settings,
          badge: null,
          badgeColor: ''
        }
      ]
    }
  ];

  return (
    <aside
      className={`hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-white dark:bg-[#090C15]/90 backdrop-blur-2xl border-r border-[#E2E8F0] dark:border-white/[0.08] p-3 justify-between transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] z-30 select-none overflow-y-auto custom-scrollbar ${
        isCollapsed ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100 shadow-sm'
      }`}
    >

      <div className="space-y-2.5">
        {/* Tradewise-Style Header Branding & Collapse Button */}
        <div className="flex items-center justify-between gap-2 px-1 py-1">
          <div
            className="flex items-center gap-2.5 min-w-0 group cursor-pointer"
            onClick={() => {
              soundManager.playClick();
              onSelectView('overview');
            }}
            title="Go to Dashboard"
          >
            <div className="w-8 h-8 rounded-xl bg-[#11120F] dark:bg-[#1E1F2A] border border-[#E2E8F0] dark:border-[#333446] shadow-xs flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-[13px] font-black tracking-wider text-[#11120F] dark:text-[#F5F5F7] uppercase font-serif group-hover:text-[#2563EB] dark:group-hover:text-[#7AA2F7] transition-colors leading-none truncate">
                  SYLLABUS 3D
                </h1>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black tracking-widest font-mono">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-bold text-[#65675F] dark:text-[#94A3B8] mt-0.5 truncate">
                Discipline &amp; Mastery
              </p>
            </div>
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                haptics.light();
                onToggleCollapse();
              }}
              className="p-1.5 rounded-xl text-[#65675F] dark:text-[#CBD5E1] hover:text-[#11120F] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181822] border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#333446] transition-all cursor-pointer shrink-0 active:scale-95 group"
              title="Close sidebar (Ctrl+B)"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Action Buttons: Add Custom Topic & 3D Focus Chamber */}
        <div className="space-y-1.5">
          {onOpenAddTopic && (
            <button
              onClick={onOpenAddTopic}
              className="group relative w-full py-2 px-3 rounded-xl bg-[#11120F] dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 hover:bg-[#2563EB] text-white font-bold text-[13px] shadow-xs dark:shadow-[0_4px_16px_rgba(37,99,235,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-95 overflow-hidden border border-transparent tap-bounce"
              title="Add Custom Topic"
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
              className="group relative w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#EFF6FF] dark:bg-[#141A2E] hover:bg-[#2563EB] hover:text-white dark:hover:bg-[#1B2340] text-[#1D4ED8] dark:text-[#7AA2F7] border border-[#BFDBFE] dark:border-[#7AA2F7]/30 text-[13px] font-extrabold shadow-xs transition-all duration-200 cursor-pointer active:scale-95 tap-bounce"
              title="3D Focus Chamber"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#7AA2F7] group-hover:bg-white animate-pulse" />
                <Timer className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7] group-hover:text-white" />
                <span>3D Focus Chamber</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-white/60 dark:bg-[#7AA2F7]/20 text-[#1D4ED8] dark:text-[#7AA2F7] group-hover:bg-white/20 group-hover:text-white">
                Timer
              </span>
            </button>
          )}
        </div>

        {/* Categorized Navigation List (Tradewise Pro Aesthetic) */}
        <div className="space-y-3 pt-1 border-t border-[#E2E8F0] dark:border-[#232430]">
          {navSections.map(section => (
            <div key={section.title} className="space-y-0.5">
              <div className="px-2 pt-1 pb-1 text-[10px] font-mono font-bold tracking-wider text-[#85877E] dark:text-[#787C99] uppercase">
                {section.title}
              </div>
              <nav className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        soundManager.playClick();
                        onSelectView(item.id);
                      }}
                      className={`group relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-bold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-[#11120F] dark:bg-gradient-to-r dark:from-blue-600/25 dark:to-indigo-600/20 text-white dark:text-[#7AA2F7] font-black shadow-xs dark:border dark:border-[#7AA2F7]/30 dark:shadow-[0_0_15px_rgba(122,162,247,0.15)]'
                          : 'text-[#65675F] dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-[#11120F] dark:hover:text-white'
                      }`}
                    >
                      {/* Active Left Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-emerald-400 dark:bg-[#7AA2F7]" />
                      )}

                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.isDashboard ? (
                          <img
                            src="/dashboard_icon_3d.png"
                            alt="Dashboard"
                            className={`w-4 h-4 object-contain shrink-0 transition-transform ${
                              isActive ? 'scale-110 drop-shadow-sm' : 'opacity-80 group-hover:scale-110'
                            }`}
                          />
                        ) : (
                          <Icon
                            className={`w-4 h-4 stroke-[2] shrink-0 transition-transform ${
                              isActive
                                ? 'text-white dark:text-[#7AA2F7]'
                                : 'text-[#85877E] dark:text-[#94A3B8] group-hover:scale-110 group-hover:text-[#11120F] dark:group-hover:text-white'
                            }`}
                          />
                        )}
                        <span className="truncate text-[13px] font-semibold">{item.label}</span>
                      </div>

                      {/* Badge / Pill */}
                      {item.badge !== null && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black shrink-0 ${
                            isActive
                              ? 'bg-white/20 dark:bg-[#7AA2F7]/25 text-white dark:text-[#7AA2F7]'
                              : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Cards Area */}
      <div className="space-y-2 pt-2 border-t border-[#E2E8F0] dark:border-[#232430]">
        {/* Tradewise-Style Discipline Score Progress Card */}
        <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#141520] border border-slate-200/80 dark:border-[#272738] space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Discipline Score
            </span>
            <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
              {overallStats.completionPercentage}/100
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#232433] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-lime-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, overallStats.completionPercentage)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            Process &gt; Speed. Stick to your goals today.
          </p>
        </div>

        {/* Mock Tracker Quick Link */}
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
              <span className="text-[11px] text-[#65675F] dark:text-[#CBD5E1] block leading-none truncate">Score &amp; Percentiles</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7] shrink-0" />
        </a>

        {/* User Profile & Level Card */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#161720] border border-[#E2E8F0] dark:border-[#272732] space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${
                  profile.avatarColor || 'from-[#2563EB] to-indigo-600'
                } text-white dark:text-black font-black flex items-center justify-center text-[13px] shrink-0 shadow-2xs overflow-hidden`}
              >
                {(profile.avatarUrl || user?.avatarUrl) ? (
                  <img
                    src={profile.avatarUrl || user?.avatarUrl}
                    alt={user?.name || profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : profile.avatarEmoji ? (
                  <span className="text-[13px] leading-none drop-shadow">{profile.avatarEmoji}</span>
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

            <div className="flex items-center gap-1 shrink-0">
              <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-md bg-[#EFF6FF] dark:bg-[#7AA2F7]/20 text-[#1D4ED8] dark:text-[#7AA2F7] font-mono border border-[#BFDBFE] dark:border-[#7AA2F7]/30">
                Lvl {profile.level}
              </span>

              {onOpenProfileSwitcher && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    haptics.light();
                    onOpenProfileSwitcher();
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-[#2563EB] dark:hover:text-[#7AA2F7] hover:bg-slate-100 dark:hover:bg-[#232430] transition-colors cursor-pointer"
                  title="Switch Study Profile"
                  aria-label="Switch Study Profile"
                >
                  <Users className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="w-full h-1 rounded-full bg-[#E2E8F0] dark:bg-[#232430] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2563EB] to-indigo-600 dark:from-[#7AA2F7] dark:to-[#8B5CF6] rounded-full"
              style={{ width: `${Math.min(100, Math.max(5, (profile.xp % 300) / 3))}%` }}
            />
          </div>
        </div>

        {/* Keyboard Shortcuts Trigger */}
        {onOpenShortcuts && (
          <button
            onClick={() => {
              soundManager.playClick();
              haptics.selection();
              onOpenShortcuts();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#161720] border border-[#E2E8F0] dark:border-[#272732] hover:border-[#2563EB] dark:hover:border-[#7AA2F7] text-[#65675F] hover:text-[#0F172A] dark:text-[#CBD5E1] dark:hover:text-white transition-all cursor-pointer text-xs font-semibold active:scale-98 tap-bounce shadow-2xs"
            title="Keyboard Shortcuts Cheatsheet"
            aria-label="Keyboard Shortcuts Cheatsheet"
          >
            <Keyboard className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7]" />
            <span className="text-[12px] font-semibold">Shortcuts</span>
          </button>
        )}
      </div>
    </aside>
  );
};

