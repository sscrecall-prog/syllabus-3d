import React from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  RotateCw,
  AlertTriangle,
  BarChart3,
  Calendar,
  CalendarCheck,
  Network,
  Settings,
  Plus,
  ExternalLink
} from 'lucide-react';

export type AppView = 'overview' | 'syllabus' | 'subjects' | 'planner' | 'mindmap' | 'revision' | 'weak' | 'analytics' | 'heatmap' | 'settings';

interface SidebarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAddTopic: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenAddTopic
}) => {
  const { dueRevisions, weakTopics, plannerTasks, profile } = useSyllabus();
  const { user } = useAuth();

  const todayCount = plannerTasks.filter(t => t.status === 'today' || t.status === 'in_progress').length;

  const navSections = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Study Planner', icon: CalendarCheck, badge: todayCount, badgeColor: 'bg-[#D4AF37] text-[#171717]' },
    { id: 'mindmap', label: 'Concept Mind Map', icon: Network },
    { id: 'syllabus', label: 'Syllabus Explorer', icon: FolderTree },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'revision', label: 'Spaced Revision', icon: RotateCw, badge: dueRevisions.length, badgeColor: 'bg-rose-500 text-white' },
    { id: 'weak', label: 'Weak Topics', icon: AlertTriangle, badge: weakTopics.length, badgeColor: 'bg-amber-500 text-[#171717]' },
    { id: 'analytics', label: 'Analytics & Heatmap', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#FAF8F5] dark:bg-[#171717] border-r border-[#EBD3A0]/60 dark:border-[#2E2E2E] p-4 justify-between select-none z-20">
      <div className="space-y-5">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 px-2 py-1">
          <img
            src="/logo.png"
            alt="SYLLABUS 3D Logo"
            className="w-9 h-9 object-contain drop-shadow-md rounded-xl"
          />
          <div>
            <h1 className="text-base font-black tracking-tight text-[#171717] dark:text-[#F5E6C8]">
              SYLLABUS <span className="text-[#D4AF37]">3D</span>
            </h1>
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Smart Exam Tracker
            </p>
          </div>
        </div>

        {/* Action Button: Add Custom Topic */}
        <button
          onClick={onOpenAddTopic}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] font-extrabold text-xs shadow-md shadow-[#D4AF37]/25 hover:shadow-lg transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Custom Topic</span>
        </button>

        {/* Main Navigation Items */}
        <nav className="space-y-1">
          {navSections.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id as AppView)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-[#F5E6C8]/60 dark:bg-[#D4AF37]/15 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                    : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F5E6C8]/30 dark:hover:bg-[#222222] hover:text-[#171717] dark:hover:text-[#F5E6C8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-[#D4AF37]' : 'text-[#6B7280]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black rounded-full shadow-sm ${
                      item.badgeColor || 'bg-[#D4AF37] text-[#171717]'
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

      <div className="space-y-3">
        {/* Mock Tracker External Link Button */}
        <a
          href="https://mock-percentile-tracker.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#333333] hover:border-[#D4AF37] hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/mock_tracker_logo.png"
              alt="Mock Tracker Logo"
              className="w-7 h-7 object-contain drop-shadow-sm group-hover:scale-110 transition-transform shrink-0"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8] flex items-center gap-1">
                Mock Tracker
              </span>
              <p className="text-[10px] text-[#6B7280] truncate">
                Score & Percentiles
              </p>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
        </a>

        {/* User Level Card */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0]/80 dark:border-[#333333] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8]">
              {user?.name || profile.name}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#8C6D15] dark:text-[#D4AF37]">
              Lvl {profile.level}
            </span>
          </div>
          <p className="text-[11px] text-[#6B7280] mb-2 font-medium">
            {profile.levelTitle}
          </p>
          <div className="w-full h-1.5 rounded-full bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#383838] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B89327] rounded-full transition-all duration-500"
              style={{ width: `${(profile.xp % 300) / 3}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
