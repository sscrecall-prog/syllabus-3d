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
    { id: 'planner', label: 'Study Planner', icon: CalendarCheck, badge: todayCount, badgeColor: 'bg-cyan-500' },
    { id: 'mindmap', label: 'Concept Mind Map', icon: Network },
    { id: 'syllabus', label: 'Syllabus Explorer', icon: FolderTree },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'revision', label: 'Revision Queue', icon: RotateCw, badge: dueRevisions.length, badgeColor: 'bg-amber-500' },
    { id: 'weak', label: 'Weak Topics', icon: AlertTriangle, badge: weakTopics.length, badgeColor: 'bg-rose-500' },
    { id: 'analytics', label: 'Progress & Stats', icon: BarChart3 },
    { id: 'heatmap', label: 'Study Heatmap', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col justify-between h-screen sticky top-0 bg-white dark:bg-slate-900/95 border-r border-slate-200/80 dark:border-slate-800/80 p-4 z-40">
      <div>
        <div className="flex items-center gap-3 px-3 py-2.5 mb-5">
          <img
            src="/logo.png"
            alt="SYLLABUS 3D Logo"
            className="w-9 h-9 object-contain drop-shadow-md hover:scale-105 transition-transform"
          />
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
              SYLLABUS <span className="text-brand-500">3D</span>
            </h1>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Prep Mastery
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddTopic}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Topic</span>
        </button>

        <nav className="space-y-1">
          {navSections.map(item => {
            const InfoIcon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id as AppView)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <InfoIcon className={`w-4.5 h-4.5 ${isActive ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor}`}>
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
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/30 hover:border-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/mock_tracker_logo.png"
              alt="Mock Tracker Logo"
              className="w-7 h-7 object-contain drop-shadow-sm group-hover:scale-110 transition-transform shrink-0"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                Mock Tracker
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Score & Percentiles
              </p>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        </a>

        {/* User Level Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {user?.name || profile.name}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400">
              Lvl {profile.level}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            {profile.levelTitle}
          </p>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full"
              style={{ width: `${(profile.xp % 300) / 3}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
