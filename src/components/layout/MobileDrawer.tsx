import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { AppView } from './Sidebar';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
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
  const { user } = useAuth();

  if (!isOpen) return null;

  const sections = [
    {
      title: 'LEARNING & MASTERY',
      items: [
        { id: 'overview' as AppView, label: 'Dashboard', icon: LayoutDashboard, badge: null, color: 'text-emerald-500' },
        { id: 'syllabus' as AppView, label: 'Syllabus Explorer', icon: BookOpen, badge: null, color: 'text-sky-500' },
        { id: 'mindmap' as AppView, label: 'Concept Mind Map', icon: BrainCircuit, badge: null, color: 'text-purple-500' },
        { id: 'platforms' as AppView, label: 'Study Station & Hub', icon: Globe, badge: platforms.length || null, color: 'text-indigo-500' }
      ]
    },
    {
      title: 'PRODUCTIVITY & GOALS',
      items: [
        { id: 'planner' as AppView, label: 'Study Planner', icon: CalendarCheck, badge: null, color: 'text-teal-500' },
        { id: 'revision' as AppView, label: 'Spaced Revision', icon: RotateCw, badge: dueRevisions.length || null, color: 'text-amber-500' },
        { id: 'weak' as AppView, label: 'Weak Topics & Traps', icon: AlertTriangle, badge: weakTopics.length || null, color: 'text-rose-500' }
      ]
    },
    {
      title: 'PERFORMANCE & SYSTEM',
      items: [
        { id: 'analytics' as AppView, label: 'Analytics & Heatmap', icon: BarChart3, badge: null, color: 'text-blue-500' },
        { id: 'settings' as AppView, label: 'App Settings', icon: Settings, badge: null, color: 'text-slate-400' }
      ]
    }
  ];

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Smooth Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-md animate-fade-in transition-opacity" />

      {/* Drawer Sheet */}
      <div className="relative w-[85%] max-w-[320px] bg-[#FAF9F5] dark:bg-[#10111A] border-r border-[#D8D8CF] dark:border-[#242638] flex flex-col justify-between z-10 shadow-2xl animate-slide-right overflow-y-auto custom-scrollbar">
        
        <div className="p-4 space-y-4">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#D8D8CF]/80 dark:border-[#242638]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#11120F] dark:bg-[#1E2030] p-1.5 flex items-center justify-center border border-white/15 shadow-xs">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-[13px] font-black text-[#11120F] dark:text-white uppercase tracking-wider font-serif leading-none">
                  SYLLABUS 3D
                </h2>
                <span className="text-[10px] font-mono text-[#85877E] dark:text-[#A1A1B2] mt-0.5 block">Mastery Edition</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#85877E] hover:text-[#11120F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#181926] border border-[#D8D8CF] dark:border-[#242638] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#596B35] to-[#7FA04B] dark:from-[#7AA2F7] dark:to-[#5B82D7] text-white dark:text-[#0B0B0D] font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-[#11120F] dark:text-[#F5F5F7] truncate leading-tight">
                    {user?.email?.split('@')[0] || 'Scholar'}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-[#596B35] dark:text-[#7AA2F7]">
                    Lvl {profile.level} • {profile.levelTitle}
                  </span>
                </div>
              </div>

              {profile.currentStreak > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/25 shrink-0">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{profile.currentStreak}d</span>
                </span>
              )}
            </div>

            {/* Micro XP Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#85877E]">
                <span>Experience</span>
                <span>{profile.xp} XP</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#EEEEE8] dark:bg-[#232433] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#596B35] to-[#8FA35F] dark:from-[#7AA2F7] dark:to-[#A78BFA] transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, (profile.xp % 1000) / 10))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Target Action Button */}
          {onOpenAddTopic && (
            <button
              onClick={() => {
                onClose();
                onOpenAddTopic();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#596B35] to-[#7FA04B] hover:from-[#4D5D2E] hover:to-[#708E41] dark:from-[#7AA2F7] dark:to-[#5B82D7] text-white dark:text-[#0B0B0D] font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer border border-white/10"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Custom Target</span>
            </button>
          )}

          {/* Grouped Navigation Sections */}
          <div className="space-y-3.5 pt-1">
            {sections.map(sec => (
              <div key={sec.title} className="space-y-1">
                <h5 className="px-2 text-[10px] font-mono font-bold tracking-widest text-[#85877E] dark:text-[#6E7187] uppercase">
                  {sec.title}
                </h5>
                <div className="space-y-0.5">
                  {sec.items.map(item => {
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
                        className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                          isActive
                            ? 'bg-[#596B35]/15 dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] font-black border border-[#596B35]/30 dark:border-[#7AA2F7]/40 shadow-2xs'
                            : 'text-[#65675F] dark:text-[#A1A1B2] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#D8D8CF]/80 dark:border-[#242638] flex items-center justify-between text-[10px] font-mono text-[#85877E]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cloud Synced</span>
          </span>
          <span>v2.4.0</span>
        </div>
      </div>
    </div>
  );
};

