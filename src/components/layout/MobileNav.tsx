import React, { useState } from 'react';
import { AppView } from './Sidebar';
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  RotateCw,
  Plus,
  Grid,
  BrainCircuit,
  Layers,
  AlertTriangle,
  BarChart3,
  Settings,
  ExternalLink,
  Timer,
  X,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
import { soundManager } from '../../utils/soundEffects';

interface MobileNavProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAddTopic?: () => void;
  onOpenFocus?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeView,
  onSelectView,
  onOpenAddTopic,
  onOpenFocus
}) => {
  const { dueRevisions, plannerTasks, weakTopics, profile } = useSyllabus();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs = [
    { id: 'overview' as AppView, label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'planner' as AppView,
      label: 'Planner',
      icon: CalendarCheck,
      badge: plannerTasks.filter(t => t.status === 'today').length || null
    },
    { id: 'syllabus' as AppView, label: 'Syllabus', icon: BookOpen },
    {
      id: 'revision' as AppView,
      label: 'Revision',
      icon: RotateCw,
      badge: dueRevisions.length || null
    }
  ];

  const moreMenuItems = [
    {
      id: 'mindmap' as AppView,
      label: 'Concept Mind Map',
      desc: '3D Constellation Galaxy Tree',
      icon: BrainCircuit,
      color: 'text-purple-500 bg-purple-500/15'
    },
    {
      id: 'subjects' as AppView,
      label: 'Subjects & Chapters',
      desc: 'Mastery Breakdown & Weights',
      icon: Layers,
      color: 'text-blue-500 bg-blue-500/15'
    },
    {
      id: 'weak' as AppView,
      label: 'Weak Topics & Traps',
      desc: 'Mistake Notebook & Triage',
      icon: AlertTriangle,
      badge: weakTopics.length || null,
      color: 'text-rose-500 bg-rose-500/15'
    },
    {
      id: 'analytics' as AppView,
      label: 'Analytics & Heatmap',
      desc: 'Study Time & Daily Heatmap',
      icon: BarChart3,
      color: 'text-emerald-500 bg-emerald-500/15'
    },
    {
      id: 'settings' as AppView,
      label: 'Settings & JSON Backup',
      desc: 'Profile & Data Export/Import',
      icon: Settings,
      color: 'text-amber-500 bg-amber-500/15'
    }
  ];

  const handleSelectMoreItem = (view: AppView) => {
    soundManager.playClick();
    onSelectView(view);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* NATIVE MOBILE BOTTOM NAVIGATION DOCK */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#171717]/95 backdrop-blur-2xl border-t border-[#EBD3A0]/60 dark:border-[#2E2E2E] px-2 py-1.5 pb-safe flex items-center justify-around shadow-2xl transition-colors">
        
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => {
            soundManager.playClick();
            onSelectView('overview');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl relative transition-all cursor-pointer ${
            activeView === 'overview'
              ? 'text-[#8C6D15] dark:text-[#D4AF37] scale-105'
              : 'text-[#6B7280] dark:text-[#A3A3A3]'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeView === 'overview' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : ''}`}>
            <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-black mt-0.5">Home</span>
        </button>

        {/* Tab 2: Planner */}
        <button
          onClick={() => {
            soundManager.playClick();
            onSelectView('planner');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl relative transition-all cursor-pointer ${
            activeView === 'planner'
              ? 'text-[#8C6D15] dark:text-[#D4AF37] scale-105'
              : 'text-[#6B7280] dark:text-[#A3A3A3]'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all relative ${activeView === 'planner' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : ''}`}>
            <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
            {plannerTasks.filter(t => t.status === 'today').length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4AF37] text-[#171717] text-[9px] font-black flex items-center justify-center shadow-sm">
                {plannerTasks.filter(t => t.status === 'today').length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black mt-0.5">Planner</span>
        </button>

        {/* CENTER FLOATING ACTION BUTTON (Add Topic) */}
        {onOpenAddTopic && (
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenAddTopic();
            }}
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#B89327] text-[#171717] shadow-lg shadow-[#D4AF37]/35 -mt-4 border-2 border-white dark:border-[#171717] active:scale-90 transition-transform cursor-pointer"
            title="Add Custom Topic"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        )}

        {/* Tab 3: Syllabus */}
        <button
          onClick={() => {
            soundManager.playClick();
            onSelectView('syllabus');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl relative transition-all cursor-pointer ${
            activeView === 'syllabus'
              ? 'text-[#8C6D15] dark:text-[#D4AF37] scale-105'
              : 'text-[#6B7280] dark:text-[#A3A3A3]'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeView === 'syllabus' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : ''}`}>
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-black mt-0.5">Syllabus</span>
        </button>

        {/* Tab 4: More Menu */}
        <button
          onClick={() => {
            soundManager.playClick();
            setShowMoreMenu(true);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl relative transition-all cursor-pointer ${
            ['mindmap', 'subjects', 'revision', 'weak', 'analytics', 'settings'].includes(activeView)
              ? 'text-[#8C6D15] dark:text-[#D4AF37] scale-105'
              : 'text-[#6B7280] dark:text-[#A3A3A3]'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${
            ['mindmap', 'subjects', 'revision', 'weak', 'analytics', 'settings'].includes(activeView)
              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
              : ''
          }`}>
            <Grid className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-black mt-0.5">Menu</span>
        </button>
      </div>

      {/* NATIVE iOS/ANDROID "MORE FEATURES" BOTTOM SHEET */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in md:hidden">
          <div className="w-full bg-[#FAF8F5] dark:bg-[#1A1A1A] border-t border-[#EBD3A0] dark:border-[#333333] rounded-t-[32px] p-5 pb-safe space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up">
            
            {/* Handle Bar */}
            <div className="flex justify-center cursor-pointer" onClick={() => setShowMoreMenu(false)}>
              <div className="w-12 h-1.5 rounded-full bg-[#EBD3A0] dark:bg-[#383838]" />
            </div>

            {/* Menu Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#171717] dark:text-[#F5E6C8]">
                    More Features & Tools
                  </h3>
                  <p className="text-[10px] text-[#6B7280]">
                    Level {profile.level} • {profile.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-xl text-[#6B7280] hover:text-rose-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Focus Chamber 1-Tap Trigger */}
            {onOpenFocus && (
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenFocus();
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37]/20 to-[#B89327]/30 border border-[#D4AF37]/50 flex items-center justify-between text-[#8C6D15] dark:text-[#D4AF37] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#D4AF37] text-[#171717]">
                    <Timer className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black block">3D Pomodoro Focus Chamber</span>
                    <span className="text-[10px] text-[#6B7280] dark:text-[#A3A3A3]">Timed deep study session with audio</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Menu Links List */}
            <div className="space-y-2">
              {/* Revision link */}
              <button
                onClick={() => handleSelectMoreItem('revision')}
                className="w-full p-3 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl text-amber-500 bg-amber-500/15">
                    <RotateCw className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8] block">Spaced Revision Vault</span>
                    <span className="text-[10px] text-[#6B7280]">3D Flip Flashcards ({dueRevisions.length} due)</span>
                  </div>
                </div>
                {dueRevisions.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-white">
                    {dueRevisions.length}
                  </span>
                )}
              </button>

              {moreMenuItems.map(item => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMoreItem(item.id)}
                    className="w-full p-3 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37] flex items-center justify-between transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${item.color}`}>
                        <ItemIcon className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8] block">{item.label}</span>
                        <span className="text-[10px] text-[#6B7280]">{item.desc}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                    </div>
                  </button>
                );
              })}

              {/* External Mock Tracker link */}
              <a
                href="https://mock-percentile-tracker.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img src="/mock_tracker_logo.png" alt="Mock Tracker" className="w-6 h-6 object-contain" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8] block">Mock Percentile Tracker</span>
                    <span className="text-[10px] text-[#6B7280]">Scores, percentiles & analysis</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
