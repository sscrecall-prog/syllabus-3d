import React, { useState } from 'react';
import { AppView } from './Sidebar';
import {
  LayoutDashboard,
  FolderTree,
  RotateCw,
  AlertTriangle,
  MoreHorizontal,
  BookOpen,
  BarChart3,
  Calendar,
  CalendarCheck,
  Network,
  Settings,
  X,
  ExternalLink,
  Timer
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';

interface MobileNavProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenFocus?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeView, onSelectView, onOpenFocus }) => {
  const { dueRevisions, weakTopics, plannerTasks } = useSyllabus();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const todayCount = plannerTasks.filter(t => t.status === 'today' || t.status === 'in_progress').length;

  const primaryItems = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'planner', label: 'Planner', icon: CalendarCheck, badge: todayCount, badgeColor: 'bg-cyan-500' },
    { id: 'syllabus', label: 'Explorer', icon: FolderTree },
    { id: 'revision', label: 'Revise', icon: RotateCw, badge: dueRevisions.length, badgeColor: 'bg-amber-500' },
    { id: 'weak', label: 'Weak', icon: AlertTriangle, badge: weakTopics.length, badgeColor: 'bg-rose-500' },
  ];

  const moreItems = [
    { id: 'mindmap', label: 'Concept Mind Map', icon: Network, desc: 'Interactive concept constellation & graph' },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, desc: 'Quant, Reasoning, English, GA' },
    { id: 'analytics', label: 'Analytics & Medals', icon: BarChart3, desc: 'XP, Levels, 3D Medals & Readiness' },
    { id: 'heatmap', label: 'Study Heatmap', icon: Calendar, desc: '120-day consistency grid' },
    { id: 'settings', label: 'Settings', icon: Settings, desc: 'Profile, data backup & reset' }
  ];

  const isMoreActive = moreItems.some(i => i.id === activeView);

  return (
    <>
      {showMoreSheet && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-24 border-t border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-5" />
            
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Additional Modules & Tools
              </h4>
              <button 
                onClick={() => setShowMoreSheet(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3D Focus Chamber Mobile Trigger */}
            {onOpenFocus && (
              <button
                onClick={() => {
                  setShowMoreSheet(false);
                  onOpenFocus();
                }}
                className="w-full flex items-center justify-between p-3.5 mb-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 shadow-sm text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold flex items-center gap-1.5">
                      3D Pomodoro Focus Chamber
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Full-screen 3D timer & offline ambient sounds
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* External Mock Tracker Card */}
            <a
              href="https://mock-percentile-tracker.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3.5 mb-3 rounded-2xl bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-purple-600/15 border border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img
                  src="/mock_tracker_logo.png"
                  alt="Mock Tracker"
                  className="w-9 h-9 object-contain drop-shadow-sm"
                />
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    Mock Tracker
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Track mock scores & percentiles
                  </p>
                </div>
              </div>
            </a>

            <div className="space-y-2.5">
              {moreItems.map(item => {
                const IconComponent = item.icon;
                const isSel = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectView(item.id as AppView);
                      setShowMoreSheet(false);
                    }}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isSel
                        ? 'bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400'
                        : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSel ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold">{item.label}</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-1 py-1.5 flex items-center justify-around shadow-lg">
        {primaryItems.map(item => {
          const IconComponent = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectView(item.id as AppView);
                setShowMoreSheet(false);
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all min-w-[48px] cursor-pointer ${
                isActive
                  ? 'text-brand-500 bg-brand-500/10 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <IconComponent className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2.5 px-1 min-w-[15px] h-3.5 rounded-full ${item.badgeColor} text-white text-[9px] font-bold flex items-center justify-center shadow-sm`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-semibold mt-0.5">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setShowMoreSheet(prev => !prev)}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all min-w-[48px] cursor-pointer ${
            isMoreActive || showMoreSheet
              ? 'text-brand-500 bg-brand-500/10 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[9px] font-semibold mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
};
