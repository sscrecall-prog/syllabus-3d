import React, { useState, useMemo } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  RotateCw,
  Play,
  Calendar,
  Filter,
  Search,
  X,
  Trophy,
  ArrowRight,
  Clock,
  Zap,
  BrainCircuit,
  ShieldCheck,
  Layers,
  Sparkles,
  Calculator,
  Globe,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { getTodayDateString, formatDateReadable, isDatePastOrToday } from '../../utils/dateUtils';
import { RevisionRecord, Topic } from '../../types/syllabus';
import { soundManager } from '../../utils/soundEffects';

interface RevisionViewProps {
  onOpenRevisionSession: () => void;
  onOpenTopicDrawer?: (topic: Topic, subName: string, chName: string) => void;
  onOpenFocus?: (topicId?: string) => void;
}

export const RevisionView: React.FC<RevisionViewProps> = ({
  onOpenRevisionSession,
  onOpenTopicDrawer,
  onOpenFocus
}) => {
  const { revisions, dueRevisions, allTopics, currentExam, resyncAllRevisions } = useSyllabus();
  const [justSynced, setJustSynced] = useState(false);

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'history'>('today');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const today = getTodayDateString();

  // Filtered lists
  const dueList = useMemo(() => {
    return revisions.filter(r => !r.completedDate && (isDatePastOrToday ? isDatePastOrToday(r.scheduledDate) : r.scheduledDate <= today));
  }, [revisions, today]);

  const upcomingList = useMemo(() => {
    return revisions.filter(r => !r.completedDate && r.scheduledDate > today);
  }, [revisions, today]);

  const historyList = useMemo(() => {
    return revisions.filter(r => r.completedDate);
  }, [revisions]);

  // Subject Icon & Theme Meta
  const getSubjectMeta = (name: string, fallbackColor?: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('quant') || lower.includes('math')) {
      return {
        icon: Calculator,
        color: fallbackColor || '#EF4444',
        gradient: 'from-[#3b0b11] to-[#25070b]',
        border: 'border-red-500/30',
        text: 'text-red-400',
        bg: 'bg-red-500/10'
      };
    }
    if (lower.includes('gk') || lower.includes('general awareness') || lower.includes('knowledge') || lower.includes('gs') || lower.includes('pyq')) {
      return {
        icon: Globe,
        color: fallbackColor || '#0EA5E9',
        gradient: 'from-[#0c2340] to-[#08172c]',
        border: 'border-sky-500/30',
        text: 'text-sky-400',
        bg: 'bg-sky-500/10'
      };
    }
    if (lower.includes('reasoning') || lower.includes('intelligence')) {
      return {
        icon: BrainCircuit,
        color: fallbackColor || '#A855F7',
        gradient: 'from-[#2a134a] to-[#1a0c2e]',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        bg: 'bg-purple-500/10'
      };
    }
    if (lower.includes('english') || lower.includes('editorial') || lower.includes('comprehension')) {
      return {
        icon: BookOpen,
        color: fallbackColor || '#10B981',
        gradient: 'from-[#0a3225] to-[#062017]',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10'
      };
    }
    return {
      icon: Layers,
      color: fallbackColor || '#7AA2F7',
      gradient: 'from-[#181926] to-[#12131d]',
      border: 'border-[#3b3d56]',
      text: 'text-indigo-400',
      bg: 'bg-indigo-500/10'
    };
  };

  // Stage Meta & Styling
  const getStageMeta = (stage: number) => {
    switch (stage) {
      case 1:
        return {
          label: 'Stage 1 • 1d',
          phase: 'Initial Recall',
          subtitle: 'Fresh concepts learned',
          badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
          accent: '#3B82F6',
          icon: Zap
        };
      case 2:
        return {
          label: 'Stage 2 • 3d',
          phase: 'Consolidation',
          subtitle: 'Memory reinforcing',
          badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
          accent: '#F59E0B',
          icon: Flame
        };
      case 3:
        return {
          label: 'Stage 3 • 7d',
          phase: 'Long-Term',
          subtitle: 'Core memory recall',
          badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25',
          accent: '#A855F7',
          icon: BrainCircuit
        };
      case 4:
      default:
        return {
          label: 'Stage 4 • 21d+',
          phase: 'Permanently Locked',
          subtitle: 'Exam-ready recall',
          badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
          accent: '#10B981',
          icon: ShieldCheck
        };
    }
  };

  // Apply Subject & Search Filters
  const filterRecordList = (list: RevisionRecord[]) => {
    return list.filter(r => {
      const matchesSubject = selectedSubjectFilter === 'all' || r.subjectName === selectedSubjectFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.chapterName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSubject && matchesSearch;
    });
  };

  const displayedDue = useMemo(() => filterRecordList(dueList), [dueList, selectedSubjectFilter, searchQuery]);
  const displayedUpcoming = useMemo(() => filterRecordList(upcomingList), [upcomingList, selectedSubjectFilter, searchQuery]);
  const displayedHistory = useMemo(() => filterRecordList(historyList), [historyList, selectedSubjectFilter, searchQuery]);

  // 4-Stage Retention Pipeline Breakdown
  const stage1Count = revisions.filter(r => r.stage === 1 && !r.completedDate).length;
  const stage2Count = revisions.filter(r => r.stage === 2 && !r.completedDate).length;
  const stage3Count = revisions.filter(r => r.stage === 3 && !r.completedDate).length;
  const stage4Count = revisions.filter(r => r.stage >= 4 || r.completedDate).length;

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-20 max-w-5xl mx-auto select-none font-sans animate-fade-in">
      
      {/* 1. EXECUTIVE HERO BANNER */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Title and Icon Capsule */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0a3225] via-[#104b38] to-[#062017] border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
              <RotateCw className="w-6 h-6 stroke-[2.3] animate-spin-slow" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2563EB] dark:text-[#7AA2F7]">
                <span>Ebbinghaus Spaced Repetition</span>
                <span>•</span>
                <span>Memory Retention Engine</span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight uppercase truncate">
                Spaced Repetition & Revision
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-[#65675F] dark:text-[#94A3B8] font-medium hidden sm:block">
                  Lock concepts into permanent memory with active recall intervals (1d → 3d → 7d → 21d+).
                </p>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Reactive Sync
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Cluster: Live Sync + Start Session */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                soundManager.playClick();
                resyncAllRevisions();
                setJustSynced(true);
                setTimeout(() => setJustSynced(false), 2200);
              }}
              title="Instantly re-verify and align spaced revision intervals with your syllabus topics"
              className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all border cursor-pointer active:scale-95 ${
                justSynced
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black shadow-xs'
                  : 'bg-[#F8FAFC] dark:bg-[#20212E] text-[#65675F] dark:text-[#CBD5E1] border-[#E2E8F0] dark:border-[#2E3044] hover:border-emerald-500/50'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${justSynced ? 'text-emerald-500 fill-emerald-500 animate-pulse' : 'text-amber-500'}`} />
              <span>{justSynced ? '✓ Synced with Topics!' : '⚡ Live Resync'}</span>
            </button>

            {/* High-Impact Action Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenRevisionSession();
              }}
              disabled={dueRevisions.length === 0}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shrink-0 border tap-bounce ${
                dueRevisions.length > 0
                  ? 'bg-[#0F172A] dark:bg-white text-white dark:text-black hover:bg-[#2563EB] dark:hover:bg-[#E2E4F0] border-transparent shadow-[0_4px_15px_rgba(0,0,0,0.15)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                  : 'bg-[#F8FAFC] dark:bg-[#1E1F2A] text-[#85877E] dark:text-[#71717A] border-[#E2E8F0] dark:border-[#2E3044] cursor-not-allowed opacity-75'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${dueRevisions.length > 0 ? 'fill-current' : ''}`} />
              <span>
                {dueRevisions.length > 0
                  ? `Start Due Revision (${dueRevisions.length})`
                  : 'All Revisions Cleared ✓'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4-STAGE RETENTION PIPELINE BENTO CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        
        {/* Stage 1 */}
        <div className="group relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] hover:border-blue-500/50 shadow-subtle-depth space-y-2.5 transition-all duration-200 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60 group-hover:opacity-100" />
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-black rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
              Stage 1 • 1d
            </span>
            <span className="text-[11px] font-mono text-[#85877E] dark:text-[#71717A] hidden xs:inline">Day 1</span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#191A17] dark:text-[#F5F5F7]">
              {stage1Count} <span className="text-xs font-sans font-medium text-[#65675F] dark:text-[#A1A1AA]">cards</span>
            </div>
            <p className="text-xs sm:text-[13px] font-bold text-blue-600 dark:text-blue-400 mt-1">Initial Recall</p>
            <p className="text-[11px] text-[#85877E] dark:text-[#71717A] truncate mt-0.5 font-medium">Fresh concepts learned</p>
          </div>
        </div>

        {/* Stage 2 */}
        <div className="group relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] hover:border-amber-500/50 shadow-subtle-depth space-y-2.5 transition-all duration-200 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60 group-hover:opacity-100" />
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-black rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              Stage 2 • 3d
            </span>
            <span className="text-[11px] font-mono text-[#85877E] dark:text-[#71717A] hidden xs:inline">Day 3</span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#191A17] dark:text-[#F5F5F7]">
              {stage2Count} <span className="text-xs font-sans font-medium text-[#65675F] dark:text-[#A1A1AA]">cards</span>
            </div>
            <p className="text-xs sm:text-[13px] font-bold text-amber-600 dark:text-amber-400 mt-1">Consolidation</p>
            <p className="text-[11px] text-[#85877E] dark:text-[#71717A] truncate mt-0.5 font-medium">Memory reinforcing</p>
          </div>
        </div>

        {/* Stage 3 */}
        <div className="group relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] hover:border-purple-500/50 shadow-subtle-depth space-y-2.5 transition-all duration-200 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60 group-hover:opacity-100" />
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-black rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
              Stage 3 • 7d
            </span>
            <span className="text-[11px] font-mono text-[#85877E] dark:text-[#71717A] hidden xs:inline">Day 7</span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#191A17] dark:text-[#F5F5F7]">
              {stage3Count} <span className="text-xs font-sans font-medium text-[#65675F] dark:text-[#A1A1AA]">cards</span>
            </div>
            <p className="text-xs sm:text-[13px] font-bold text-purple-600 dark:text-purple-400 mt-1">Long-Term Sync</p>
            <p className="text-[11px] text-[#85877E] dark:text-[#71717A] truncate mt-0.5 font-medium">Core memory recall</p>
          </div>
        </div>

        {/* Stage 4 / Mastered */}
        <div className="group relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] hover:border-emerald-500/50 shadow-subtle-depth space-y-2.5 transition-all duration-200 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60 group-hover:opacity-100" />
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-black rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              Stage 4 • 21d+
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" />
              <span>Mastered</span>
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {stage4Count} <span className="text-xs font-sans font-medium text-[#65675F] dark:text-[#A1A1AA]">cards</span>
            </div>
            <p className="text-xs sm:text-[13px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">Permanently Locked</p>
            <p className="text-[11px] text-[#85877E] dark:text-[#71717A] truncate mt-0.5 font-medium">Exam-ready recall</p>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & QUEUE FILTER TOOLBAR */}
      <div className="p-3.5 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-3.5">
        
        {/* Search & Tabs Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85877E] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search topics in revision queue..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] placeholder-[#85877E] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#7AA2F7]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85877E] hover:text-[#191A17] dark:hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Queue Tab Switchers */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] shadow-2xs overflow-x-auto no-scrollbar">
            {[
              { id: 'today', label: 'Due Today', count: dueList.length, icon: Clock },
              { id: 'upcoming', label: 'Upcoming', count: upcomingList.length, icon: Calendar },
              { id: 'history', label: 'Mastered Vault', count: historyList.length, icon: Trophy },
            ].map(tab => {
              const TabIcon = tab.icon;
              const isSel = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundManager.playClick();
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSel
                      ? 'bg-[#11120F] dark:bg-white text-white dark:text-black shadow-xs font-black'
                      : 'text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                    isSel
                      ? 'bg-white/20 dark:bg-black/20'
                      : 'bg-[#EEEEE8] dark:bg-[#20212E] text-[#85877E]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Filter Pills */}
        {currentExam && currentExam.subjects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-[#EEEEE8] dark:border-[#242533] no-scrollbar">
            <button
              onClick={() => {
                soundManager.playClick();
                setSelectedSubjectFilter('all');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 active:scale-95 ${
                selectedSubjectFilter === 'all'
                  ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs font-black'
                  : 'bg-[#F8FAFC] dark:bg-[#14151F] text-[#65675F] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#272730] hover:border-[#2563EB] dark:hover:border-[#7AA2F7]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All ({revisions.length})</span>
            </button>

            {currentExam.subjects.map(s => {
              const count = revisions.filter(r => r.subjectName === s.name).length;
              const isSelected = selectedSubjectFilter === s.name;
              const meta = getSubjectMeta(s.name, s.color);
              const SubjIcon = meta.icon;

              return (
                <button
                  key={s.id}
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedSubjectFilter(s.name);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs font-black'
                      : 'bg-[#F8FAFC] dark:bg-[#14151F] text-[#65675F] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#272730] hover:border-[#2563EB] dark:hover:border-[#7AA2F7]'
                  }`}
                >
                  <SubjIcon className="w-3.5 h-3.5" style={{ color: isSelected ? undefined : meta.color }} />
                  <span>{s.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                    isSelected ? 'bg-white/20 dark:bg-black/20' : 'bg-[#E2E8F0] dark:bg-[#20212E] text-[#85877E]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. REVISION CARDS QUEUE */}
      <div className="space-y-3">
        
        {/* DUE TODAY LIST */}
        {activeTab === 'today' && (
          displayedDue.length > 0 ? (
            displayedDue.map(rev => {
              const topicObj = allTopics.find(t => t.topic.id === rev.topicId);
              const meta = getSubjectMeta(rev.subjectName);
              const SubjIcon = meta.icon;
              const stageMeta = getStageMeta(rev.stage);
              const difficulty = topicObj?.topic.difficulty || 'Medium';
              const isWeak = topicObj?.topic.isWeak || topicObj?.topic.status === 'weak';
              const accuracy = topicObj?.topic.accuracy;
              const isOverdue = rev.scheduledDate < today;

              return (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] hover:border-emerald-500/50 dark:hover:border-emerald-500/40 shadow-subtle-depth transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group relative overflow-hidden"
                >
                  {/* Subtle Left Accent Line */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 opacity-80 group-hover:opacity-100"
                    style={{ backgroundColor: stageMeta.accent }}
                  />

                  <div className="flex items-center gap-3.5 min-w-0 flex-1 pl-1">
                    
                    {/* 3D Squircle Subject Badge */}
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${meta.gradient} border ${meta.border} ${meta.text} flex items-center justify-center shadow-xs shrink-0`}
                    >
                      <SubjIcon className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <span className={`px-2.5 py-0.5 text-[11px] font-mono font-black rounded-lg border ${stageMeta.badgeClass}`}>
                          {stageMeta.label}
                        </span>

                        {/* Difficulty Badge */}
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border ${
                          difficulty.toLowerCase() === 'hard'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25'
                            : difficulty.toLowerCase() === 'easy'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
                        }`}>
                          {difficulty}
                        </span>

                        {/* Weak Area Pill */}
                        {isWeak && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Weak</span>
                          </span>
                        )}

                        {/* Accuracy Pill */}
                        {accuracy !== undefined && accuracy > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 tabular-nums">
                            🎯 {accuracy}%
                          </span>
                        )}

                        {/* Due/Overdue Tag */}
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border ${
                          isOverdue
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isOverdue ? `Overdue (${formatDateReadable(rev.scheduledDate)})` : 'Due Today'}
                        </span>

                        <span className="text-[11px] font-mono font-medium text-[#65675F] dark:text-[#A1A1AA] truncate">
                          {rev.subjectName} • {rev.chapterName}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-black text-[#191A17] dark:text-[#F5F5F7] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {rev.topicName}
                      </h4>
                    </div>
                  </div>

                  {/* Actions (Focus Chamber + Review Card) */}
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    {onOpenTopicDrawer && topicObj && (
                      <button
                        onClick={() => onOpenTopicDrawer(topicObj.topic, rev.subjectName, rev.chapterName)}
                        className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#20212E] hover:bg-[#EEEEE8] dark:hover:bg-[#2A2B3D] text-xs font-bold text-[#65675F] dark:text-[#CBD5E1] border border-[#E2E8F0] dark:border-[#2E3044] transition-all cursor-pointer active:scale-95 shrink-0"
                        title="View Topic Details"
                      >
                        Inspect
                      </button>
                    )}

                    <button
                      onClick={onOpenRevisionSession}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#0F172A] dark:bg-white text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-emerald-400 text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all tap-bounce"
                    >
                      <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Review Card</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            /* Clean Empty State */
            <div className="py-12 sm:py-16 px-4 text-center rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-3.5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0a3225] to-[#062017] border border-emerald-500/30 text-emerald-300 flex items-center justify-center mx-auto shadow-md">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-[#191A17] dark:text-[#F5F5F7] uppercase tracking-tight">
                  All Due Revisions Cleared Today! 🎉
                </h3>
                <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] max-w-md mx-auto font-medium">
                  Your spaced repetition queue is fully up to date. You can review upcoming cards early or inspect your mastered vault.
                </p>
              </div>

              {upcomingList.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setActiveTab('upcoming');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#20212E] hover:bg-[#EEEEE8] dark:hover:bg-[#282938] border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs tap-bounce"
                  >
                    <span>View {upcomingList.length} Upcoming Cards</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* UPCOMING LIST */}
        {activeTab === 'upcoming' && (
          displayedUpcoming.length > 0 ? (
            displayedUpcoming.map(rev => {
              const topicObj = allTopics.find(t => t.topic.id === rev.topicId);
              const meta = getSubjectMeta(rev.subjectName);
              const SubjIcon = meta.icon;
              const stageMeta = getStageMeta(rev.stage);
              const difficulty = topicObj?.topic.difficulty || 'Medium';
              const isWeak = topicObj?.topic.isWeak || topicObj?.topic.status === 'weak';
              const accuracy = topicObj?.topic.accuracy;

              return (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-[#2563EB]/40 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${meta.gradient} border ${meta.border} ${meta.text} flex items-center justify-center shrink-0`}
                    >
                      <SubjIcon className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <span className={`px-2 py-0.5 text-[11px] font-mono font-black rounded-lg border ${stageMeta.badgeClass}`}>
                          {stageMeta.label}
                        </span>

                        {/* Difficulty Badge */}
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border ${
                          difficulty.toLowerCase() === 'hard'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25'
                            : difficulty.toLowerCase() === 'easy'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
                        }`}>
                          {difficulty}
                        </span>

                        {/* Weak Area Pill */}
                        {isWeak && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Weak</span>
                          </span>
                        )}

                        {/* Accuracy Pill */}
                        {accuracy !== undefined && accuracy > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 tabular-nums">
                            🎯 {accuracy}%
                          </span>
                        )}

                        <span className="text-[11px] font-mono text-[#65675F] dark:text-[#A1A1AA] truncate">
                          {rev.subjectName} • {rev.chapterName}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-[#191A17] dark:text-[#F5F5F7] truncate">
                        {rev.topicName}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    {onOpenTopicDrawer && topicObj && (
                      <button
                        onClick={() => onOpenTopicDrawer(topicObj.topic, rev.subjectName, rev.chapterName)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-[#20212E] hover:bg-[#EEEEE8] dark:hover:bg-[#2A2B3D] text-xs font-bold text-[#65675F] dark:text-[#CBD5E1] border border-[#E2E8F0] dark:border-[#2E3044] transition-all cursor-pointer active:scale-95 shrink-0"
                        title="View Topic Details"
                      >
                        Inspect
                      </button>
                    )}

                    <span className="px-3 py-1 rounded-xl bg-[#F8FAFC] dark:bg-[#20212E] border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold text-[#2563EB] dark:text-[#7AA2F7] font-mono flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDateReadable(rev.scheduledDate)}</span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 sm:py-16 px-4 text-center rounded-3xl bg-white dark:bg-[#18181D] border border-dashed border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-[#2563EB]/15 to-purple-500/10 text-[#2563EB] dark:text-[#7AA2F7] border border-[#2563EB]/25 flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-7 h-7 stroke-[1.8]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-[#191A17] dark:text-[#F5F5F7] uppercase tracking-tight">
                  No Upcoming Revisions Queued
                </h3>
                <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] max-w-md mx-auto font-medium">
                  You're all caught up on scheduled reviews! New spaced repetition intervals will automatically appear here as you study topics.
                </p>
              </div>
              {dueRevisions.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setActiveTab('today');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#20212E] hover:bg-[#2563EB] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-black text-[#2563EB] dark:text-[#7AA2F7] border border-[#DBEAFE] dark:border-[#7AA2F7]/30 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs tap-bounce"
                  >
                    <span>View Due Today ({dueRevisions.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* MASTERED VAULT LIST */}
        {activeTab === 'history' && (
          displayedHistory.length > 0 ? (
            displayedHistory.map(rev => {
              const meta = getSubjectMeta(rev.subjectName);
              const SubjIcon = meta.icon;

              return (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-emerald-500/30 shadow-subtle-depth flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${meta.gradient} border ${meta.border} ${meta.text} flex items-center justify-center shrink-0`}
                    >
                      <SubjIcon className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          ✓ Mastered
                        </span>
                        <span className="text-[11px] font-mono text-[#65675F] dark:text-[#A1A1AA] truncate">{rev.subjectName}</span>
                      </div>
                      <h4 className="text-sm font-black text-[#191A17] dark:text-[#F5F5F7] truncate">
                        {rev.topicName}
                      </h4>
                    </div>
                  </div>

                  <span className="text-xs text-[#65675F] dark:text-[#A1A1AA] font-mono shrink-0">
                    {rev.completedDate ? `Mastered on ${rev.completedDate}` : 'Retained'}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-12 sm:py-16 px-4 text-center rounded-3xl bg-white dark:bg-[#18181D] border border-dashed border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/15 via-emerald-500/15 to-blue-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center mx-auto shadow-sm">
                <Trophy className="w-7 h-7 stroke-[1.8]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-[#191A17] dark:text-[#F5F5F7] uppercase tracking-tight">
                  Mastered Vault is Empty
                </h3>
                <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] max-w-md mx-auto font-medium">
                  Topics reach the Mastered Vault once you complete Stage 4 (30 days retention cycle). Keep revising your active topics!
                </p>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveTab('today');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#20212E] hover:bg-[#2563EB] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-black text-[#2563EB] dark:text-[#7AA2F7] border border-[#DBEAFE] dark:border-[#7AA2F7]/30 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs tap-bounce"
                >
                  <span>Go to Active Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};


