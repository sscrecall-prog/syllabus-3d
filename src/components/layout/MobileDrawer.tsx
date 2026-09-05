import React, { useRef, useState } from 'react';
import {
  X,
  LayoutDashboard,
  CalendarCheck,
  BrainCircuit,
  BookOpen,
  RotateCw,
  AlertTriangle,
  BarChart3,
  Settings,
  Plus,
  Globe,
  Flame,
  ShieldCheck,
  Sparkles,
  Timer,
  Search,
  Sun,
  Moon,
  ChevronRight,
  Trophy,
  GraduationCap,
  Clock
} from 'lucide-react';
import { AppView } from './Sidebar';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAddTopic?: () => void;
  onOpenFocus?: () => void;
  onOpenSearch?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  onOpenAddTopic,
  onOpenFocus,
  onOpenSearch
}) => {
  const { profile, dueRevisions, weakTopics, plannerTasks, platforms, currentExam } = useSyllabus();
  const { user } = useAuth();
  const { toggleTheme, isDark, isOled } = useTheme();

  // Mobile Swipe-to-Dismiss Drawer Gesture State
  const drawerTouchStartX = useRef<number | null>(null);
  const [drawerDragX, setDrawerDragX] = useState(0);

  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    drawerTouchStartX.current = e.touches[0].clientX;
  };

  const handleDrawerTouchMove = (e: React.TouchEvent) => {
    if (drawerTouchStartX.current === null) return;
    const diffX = e.touches[0].clientX - drawerTouchStartX.current;
    if (diffX < 0) {
      setDrawerDragX(diffX);
    }
  };

  const handleDrawerTouchEnd = () => {
    if (drawerDragX < -70) {
      soundManager.playClick();
      haptics.light();
      onClose();
    }
    setDrawerDragX(0);
    drawerTouchStartX.current = null;
  };

  if (!isOpen) return null;

  // Exam Mastery Progress calculation
  const allTopicsInExam = currentExam?.subjects.flatMap(s => s.chapters.flatMap(c => c.topics)) || [];
  const totalTopicsCount = allTopicsInExam.length;
  const completedTopicsCount = allTopicsInExam.filter(t => t.status === 'completed').length;
  const examMasteryPercent = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;
  const todayTasksCount = plannerTasks.filter(t => t.status === 'today').length;

  const sections = [
    {
      title: 'LEARNING & MASTERY',
      items: [
        {
          id: 'overview' as AppView,
          label: 'Dashboard',
          subtitle: 'Main overview & daily stats',
          icon: LayoutDashboard,
          is3dIcon: true,
          badge: null,
          badgeStyle: '',
          iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
        },
        {
          id: 'syllabus' as AppView,
          label: 'Syllabus Explorer',
          subtitle: 'Modules, chapters & topics',
          icon: BookOpen,
          badge: null,
          badgeStyle: '',
          iconBg: 'bg-sky-500/15 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30'
        },
        {
          id: 'mindmap' as AppView,
          label: 'Concept Mind Map',
          subtitle: 'Visual knowledge graph',
          icon: BrainCircuit,
          badge: null,
          badgeStyle: '',
          iconBg: 'bg-purple-500/15 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
        },
        {
          id: 'platforms' as AppView,
          label: 'Study Station & Hub',
          subtitle: 'External web test resources',
          icon: Globe,
          badge: platforms.length > 0 ? `${platforms.length}` : null,
          badgeStyle: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-bold',
          iconBg: 'bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
        }
      ]
    },
    {
      title: 'PRODUCTIVITY & GOALS',
      items: [
        {
          id: 'planner' as AppView,
          label: 'Study Planner',
          subtitle: 'Calendar & scheduled sessions',
          icon: CalendarCheck,
          badge: todayTasksCount > 0 ? `${todayTasksCount} today` : null,
          badgeStyle: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 font-bold',
          iconBg: 'bg-teal-500/15 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30'
        },
        {
          id: 'pacing' as AppView,
          label: 'Target Pacing & Forecast',
          subtitle: 'Finish-line calculator & buffer',
          icon: Clock,
          badge: null,
          badgeStyle: '',
          iconBg: 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-[#7AA2F7] border-blue-500/30'
        },
        {
          id: 'revision' as AppView,
          label: 'Spaced Revision',
          subtitle: 'Retain & master before forgetting',
          icon: RotateCw,
          badge: dueRevisions.length > 0 ? `${dueRevisions.length}` : null,
          badgeStyle: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black',
          iconBg: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
        },
        {
          id: 'weak' as AppView,
          label: 'Weak Topics & Traps',
          subtitle: 'High-priority focus risk areas',
          icon: AlertTriangle,
          badge: weakTopics.length > 0 ? `${weakTopics.length}` : null,
          badgeStyle: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-black',
          iconBg: 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
        }
      ]
    },
    {
      title: 'PERFORMANCE & SYSTEM',
      items: [
        {
          id: 'analytics' as AppView,
          label: 'Analytics & Heatmap',
          subtitle: 'Study intensity & metrics',
          icon: BarChart3,
          badge: null,
          badgeStyle: '',
          iconBg: 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
        },
        {
          id: 'settings' as AppView,
          label: 'App Settings',
          subtitle: 'Theme, sounds & preferences',
          icon: Settings,
          badge: null,
          badgeStyle: '',
          iconBg: 'bg-slate-500/15 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30'
        }
      ]
    }
  ];

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Smooth Backdrop with Click-to-Dismiss */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md animate-fade-in transition-opacity"
      />

      {/* Drawer Sheet with Native Swipe-Left Dismiss */}
      <div
        onTouchStart={handleDrawerTouchStart}
        onTouchMove={handleDrawerTouchMove}
        onTouchEnd={handleDrawerTouchEnd}
        style={{
          transform: drawerDragX < 0 ? `translateX(${drawerDragX}px)` : undefined,
          transition: drawerDragX === 0 ? 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
        }}
        className="relative w-[88%] max-w-[335px] bg-white dark:bg-[#0E0F17] border-r border-[#E2E8F0] dark:border-[#222436] flex flex-col justify-between z-10 shadow-[0_0_60px_rgba(0,0,0,0.6)] animate-slide-right overflow-y-auto custom-scrollbar"
      >
        <div className="p-4 sm:p-5 space-y-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))]">
          
          {/* 1. BRANDING & EXAM TARGET HEADER */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0] dark:border-[#222436]">
            <div className="flex items-center gap-3 min-w-0">
              {/* 3D App Icon with Metallic Rim */}
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#181926] via-[#23263B] to-[#0A0B12] p-2 flex items-center justify-center border border-white/20 shadow-md shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black text-[#11120F] dark:text-white uppercase tracking-wider font-serif leading-none">
                    SYLLABUS 3D
                  </h2>
                  <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded-md bg-[#EFF6FF] dark:bg-[#7AA2F7]/20 text-[#2563EB] dark:text-[#7AA2F7] border border-[#BFDBFE] dark:border-[#7AA2F7]/30">
                    PRO
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-[10px] font-mono text-[#85877E] dark:text-[#A1A1B2] truncate">
                  <GraduationCap className="w-3 h-3 text-[#2563EB] dark:text-[#7AA2F7] shrink-0" />
                  <span className="truncate">{currentExam?.name || 'SSC CGL 2026'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                haptics.light();
                onClose();
              }}
              className="w-8 h-8 rounded-xl text-[#85877E] hover:text-[#11120F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#2E3048] flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
              title="Close Navigation Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2. EXECUTIVE VIP USER GAMIFICATION CARD */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161724] border border-[#E2E8F0] dark:border-[#24263A] shadow-xs space-y-3 relative overflow-hidden group">
            {/* Top Subtle Ambient Glow Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB] dark:via-[#7AA2F7] to-transparent opacity-70" />

            {/* User Profile Info Row */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#2563EB] to-indigo-600 dark:from-[#7AA2F7] dark:to-[#8B5CF6] text-white dark:text-[#0B0B0D] font-black text-xs flex items-center justify-center shadow-md shrink-0 ring-2 ring-white dark:ring-[#202235] ring-offset-2 ring-offset-[#2563EB]/20">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-[#11120F] dark:text-[#F5F5F7] truncate leading-tight flex items-center gap-1">
                    <span>{user?.email?.split('@')[0] || 'Scholar'}</span>
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-[#2563EB] dark:text-[#7AA2F7] block truncate">
                    Lvl {profile.level} • {profile.levelTitle}
                  </span>
                </div>
              </div>

              {profile.currentStreak > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-mono font-black border border-amber-500/25 shrink-0 shadow-2xs">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{profile.currentStreak}d</span>
                </div>
              )}
            </div>

            {/* Dual Micro Progress Metrics */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#65675F] dark:text-[#A1A1B2]">
                <span>EXP: {profile.xp} XP</span>
                <span className="flex items-center gap-1 text-[#2563EB] dark:text-[#7AA2F7]">
                  <Trophy className="w-3 h-3" />
                  <span>{examMasteryPercent}% Done</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E2E8F0] dark:bg-[#202235] overflow-hidden p-0.5 border border-[#E2E8F0]/60 dark:border-[#2E3048]/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-indigo-600 dark:from-[#7AA2F7] dark:to-[#A78BFA] transition-all duration-500 shadow-[0_0_8px_rgba(122,162,247,0.4)]"
                  style={{ width: `${Math.min(100, Math.max(10, (profile.xp % 1000) / 10))}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. DUAL EXECUTIVE COMMAND BUTTONS (ADD TOPIC & FOCUS MODE) */}
          <div className="grid grid-cols-2 gap-2">
            {onOpenAddTopic && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  haptics.light();
                  onClose();
                  onOpenAddTopic();
                }}
                className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#2563EB] to-blue-700 dark:from-[#7AA2F7] dark:to-[#5B8BF5] text-white dark:text-[#0B0B0D] font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer border border-white/10 tap-bounce"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Target</span>
              </button>
            )}

            {onOpenFocus && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  haptics.light();
                  onClose();
                  onOpenFocus();
                }}
                className="py-2.5 px-3 rounded-2xl bg-white dark:bg-[#161724] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1E2F] text-[#11120F] dark:text-[#F5F5F7] font-black text-xs flex items-center justify-center gap-1.5 shadow-xs border border-[#E2E8F0] dark:border-[#26283D] active:scale-95 transition-all cursor-pointer tap-bounce"
              >
                <Timer className="w-4 h-4 text-[#C49A3A]" />
                <span>Focus Mode</span>
              </button>
            )}
          </div>

          {/* 4. GROUPED NAVIGATION SECTIONS */}
          <div className="space-y-4 pt-1">
            {sections.map(sec => (
              <div key={sec.title} className="space-y-1.5">
                <div className="flex items-center gap-2 px-2">
                  <h5 className="text-[10px] font-mono font-extrabold tracking-widest text-[#85877E] dark:text-[#787A91] uppercase">
                    // {sec.title}
                  </h5>
                  <div className="flex-1 h-[1px] bg-[#EEEEE8] dark:bg-[#1F2133]" />
                </div>

                <div className="space-y-1">
                  {sec.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          soundManager.playClick();
                          haptics.light();
                          onSelectView(item.id);
                          onClose();
                        }}
                        className={`w-full min-h-[46px] flex items-center justify-between px-2.5 py-2 rounded-2xl text-xs transition-all active:scale-[0.98] cursor-pointer group tap-bounce ${
                          isActive
                            ? 'bg-[#EFF6FF] dark:bg-[#7AA2F7]/20 text-[#2563EB] dark:text-[#7AA2F7] font-black border border-[#BFDBFE] dark:border-[#7AA2F7]/40 shadow-xs'
                            : 'text-[#45474E] dark:text-[#C2C5D6] hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-[#E2E8F0]/60 dark:hover:border-[#26283D]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1.5">
                          {/* Squircle Thumbnail Badge */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs ${item.iconBg}`}
                          >
                            {item.is3dIcon ? (
                              <img
                                src="/dashboard_icon_3d.png"
                                alt="Dashboard"
                                className="w-4 h-4 object-contain"
                              />
                            ) : (
                              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                            )}
                          </div>

                          {/* Title & Micro Subtitle */}
                          <div className="text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-[13px] tracking-tight truncate text-[#11120F] dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#7AA2F7] transition-colors">
                                {item.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-[#85877E] dark:text-[#8E90A6] block truncate leading-tight">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        {/* Right Pill Badge or Chevron */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {Boolean(item.badge) ? (
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border shadow-2xs ${item.badgeStyle}`}
                            >
                              {item.badge}
                            </span>
                          ) : (
                            <ChevronRight
                              className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
                                isActive ? 'text-[#2563EB] dark:text-[#7AA2F7]' : 'text-[#A1A1AA] dark:text-[#5A5C75]'
                              }`}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 5. QUICK DRAWER UTILITIES STRIP (THEME TOGGLE & QUICK SEARCH) */}
          <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#222436] flex items-center justify-between gap-2">
            {onOpenSearch && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  haptics.light();
                  onClose();
                  onOpenSearch();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#161724] border border-[#E2E8F0] dark:border-[#26283D] text-[#65675F] dark:text-[#A1A1B2] hover:text-[#11120F] dark:hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer tap-bounce"
              >
                <Search className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7]" />
                <span>Search</span>
              </button>
            )}

            <button
              onClick={() => {
                soundManager.playClick();
                haptics.light();
                toggleTheme();
              }}
              className="py-2 px-3 rounded-xl bg-white dark:bg-[#161724] border border-[#E2E8F0] dark:border-[#26283D] text-[#65675F] hover:text-[#11120F] dark:text-[#A1A1B2] dark:hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer tap-bounce"
              title="Toggle Theme"
            >
              {isOled ? (
                <>
                  <span className="text-[10px] font-mono font-black text-cyan-400">OL</span>
                  <span>OLED</span>
                </>
              ) : isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#C49A3A]" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 6. EXECUTIVE FOOTER WITH LIVE CLOUD RADAR */}
        <div className="p-3.5 pb-[max(1rem,env(safe-area-inset-bottom,0px))] border-t border-[#E2E8F0] dark:border-[#222436] bg-white/50 dark:bg-[#0A0B12]/60 flex items-center justify-between text-[10px] font-mono text-[#85877E] dark:text-[#7A7C93] select-none">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-[#11120F] dark:text-[#CBD5E1]">Cloud Synced</span>
          </span>

          <span className="flex items-center gap-1 text-[#85877E] dark:text-[#7A7C93]">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>v2.4.0 PRO</span>
          </span>
        </div>
      </div>
    </div>
  );
};

