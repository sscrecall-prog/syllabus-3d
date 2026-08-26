import React, { useState, useMemo } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  RotateCw,
  Play,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  BookOpen,
  Filter,
  Search,
  X,
  Trophy,
  ArrowRight,
  Clock,
  Flame,
  Check,
  BrainCircuit,
  Award
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
  const { revisions, dueRevisions, allTopics, currentExam } = useSyllabus();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'stages' | 'history'>('today');
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
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* 1. Header with Title and Revision Session Launcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-[#171717] dark:text-[#F5F5F7] tracking-tight flex items-center gap-2.5">
            <RotateCw className="w-7 h-7 text-[#D4AF37]" />
            <span>Spaced Repetition & Revision Vault</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            Lock 100% of your syllabus into permanent memory via 1d → 3d → 7d → 21d active recall intervals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenRevisionSession}
            disabled={dueRevisions.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] text-xs font-black shadow-md shadow-[#D4AF37]/25 hover:shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-[#171717]" />
            <span>Start Due Revision ({dueRevisions.length})</span>
          </button>
        </div>
      </div>

      {/* 2. 4-Stage Retention Memory Pipeline Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Stage 1 */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#272730] shadow-md space-y-2 relative overflow-hidden group hover:border-[#D4AF37] transition-all">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              Stage 1 (1d)
            </span>
            <span className="text-[10px] text-[#6B7280]">Initial Recall</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#171717] dark:text-[#F5F5F7] font-mono">
            {stage1Count} <span className="text-xs font-medium text-[#6B7280]">cards</span>
          </h3>
          <p className="text-[11px] text-[#6B7280]">Fresh concepts learned</p>
        </div>

        {/* Stage 2 */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#272730] shadow-md space-y-2 relative overflow-hidden group hover:border-[#D4AF37] transition-all">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Stage 2 (3d)
            </span>
            <span className="text-[10px] text-[#6B7280]">Consolidation</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#171717] dark:text-[#F5F5F7] font-mono">
            {stage2Count} <span className="text-xs font-medium text-[#6B7280]">cards</span>
          </h3>
          <p className="text-[11px] text-[#6B7280]">Memory reinforcing</p>
        </div>

        {/* Stage 3 */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#272730] shadow-md space-y-2 relative overflow-hidden group hover:border-[#D4AF37] transition-all">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              Stage 3 (7d)
            </span>
            <span className="text-[10px] text-[#6B7280]">Long-Term</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#171717] dark:text-[#F5F5F7] font-mono">
            {stage3Count} <span className="text-xs font-medium text-[#6B7280]">cards</span>
          </h3>
          <p className="text-[11px] text-[#6B7280]">Transition to core recall</p>
        </div>

        {/* Stage 4 / Mastered */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#272730] shadow-md space-y-2 relative overflow-hidden group hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Stage 4 (21d+)
            </span>
            <span className="text-[10px] text-emerald-500 font-bold">★ Mastered</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono">
            {stage4Count} <span className="text-xs font-medium text-[#6B7280]">cards</span>
          </h3>
          <p className="text-[11px] text-[#6B7280]">Permanently locked</p>
        </div>
      </div>

      {/* 3. Search & Subject Filter Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#272730] shadow-md space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search topic or chapter in queue..."
              className="w-full pl-10 pr-8 py-2 rounded-2xl bg-[#FAF8F5] dark:bg-[#18181D] border border-[#EBD3A0] dark:border-[#272730] text-xs font-semibold text-[#171717] dark:text-white placeholder-[#6B7280] focus:ring-2 focus:ring-[#D4AF37]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#171717] dark:hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tab Selection Switch */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'today', label: `Due Today (${dueList.length})` },
              { id: 'upcoming', label: `Upcoming (${upcomingList.length})` },
              { id: 'history', label: `Mastered Vault (${historyList.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'today' | 'upcoming' | 'history')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-[#D4AF37] text-[#171717] border-[#D4AF37] shadow-sm'
                    : 'bg-[#FAF8F5] dark:bg-[#18181D] text-[#6B7280] border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Filter Pills */}
        {currentExam && currentExam.subjects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#EBD3A0]/40 dark:border-[#282828] no-scrollbar">
            <span className="text-xs font-bold text-[#6B7280] flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Subject:</span>
            </span>

            <button
              onClick={() => setSelectedSubjectFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                selectedSubjectFilter === 'all'
                  ? 'bg-[#D4AF37] text-[#171717] border-[#D4AF37] shadow-sm'
                  : 'bg-[#FAF8F5] dark:bg-[#18181D] text-[#6B7280] border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37]'
              }`}
            >
              All ({revisions.length})
            </button>

            {currentExam.subjects.map(s => {
              const count = revisions.filter(r => r.subjectName === s.name).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubjectFilter(s.name)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                    selectedSubjectFilter === s.name
                      ? 'bg-[#D4AF37] text-[#171717] border-[#D4AF37] shadow-sm'
                      : 'bg-[#FAF8F5] dark:bg-[#18181D] text-[#6B7280] border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ backgroundColor: s.color }} />
                  {s.name} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Revision Cards Stack */}
      <div className="space-y-3.5">
        {/* DUE TODAY TAB */}
        {activeTab === 'today' && (
          displayedDue.length > 0 ? (
            displayedDue.map(rev => {
              const topicObj = allTopics.find(t => t.topic.id === rev.topicId);

              return (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#272730] shadow-md hover:border-[#D4AF37] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[10px] font-black rounded-lg bg-[#D4AF37]/20 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/40 font-mono">
                        Stage {rev.stage} ({rev.intervalDays}d Interval)
                      </span>
                      <span className="text-xs font-bold text-[#6B7280] truncate">
                        {rev.subjectName} • {rev.chapterName}
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-black text-[#171717] dark:text-[#F5F5F7] group-hover:text-[#D4AF37] transition-colors">
                      {rev.topicName}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={onOpenRevisionSession}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] text-xs font-black shadow-md shadow-[#D4AF37]/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Revise 3D Flip Card</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            /* Luxury Trophy Empty State with Quick Actions */
            <div className="py-12 sm:py-16 px-6 text-center rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#272730] shadow-md space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mx-auto shadow-lg">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-[#171717] dark:text-[#F5F5F7]">
                  All Due Cards Cleared for Today! 🎉
                </h3>
                <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                  Your spaced repetition schedule is completely up-to-date. You can practice upcoming cards early or review your mastered vault below.
                </p>
              </div>

              {upcomingList.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className="px-5 py-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#18181D] hover:bg-[#F5E6C8]/40 dark:hover:bg-[#282828] border border-[#EBD3A0] dark:border-[#272730] text-xs font-bold text-[#171717] dark:text-[#F5F5F7] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View {upcomingList.length} Upcoming Scheduled Cards</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* UPCOMING TAB */}
        {activeTab === 'upcoming' && (
          displayedUpcoming.length > 0 ? (
            displayedUpcoming.map(rev => (
              <div
                key={rev.id}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#272730] shadow-md hover:border-[#D4AF37] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-200 dark:bg-[#23232A] text-[#6B7280]">
                      Stage {rev.stage}
                    </span>
                    <span className="text-xs text-[#6B7280]">{rev.subjectName} • {rev.chapterName}</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-[#171717] dark:text-[#F5F5F7]">
                    {rev.topicName}
                  </h4>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#18181D] border border-[#EBD3A0]/60 dark:border-[#272730] text-xs font-black text-[#D4AF37] font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateReadable(rev.scheduledDate)}</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-[#6B7280] rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#272730]">
              No upcoming revisions found matching filter.
            </div>
          )
        )}

        {/* HISTORY / MASTERED VAULT TAB */}
        {activeTab === 'history' && (
          displayedHistory.length > 0 ? (
            displayedHistory.map(rev => (
              <div
                key={rev.id}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#202020] border border-emerald-500/30 shadow-md flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-emerald-500/20 text-emerald-500">
                      ✓ Mastered
                    </span>
                    <span className="text-xs text-[#6B7280]">{rev.subjectName}</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-[#171717] dark:text-[#F5F5F7]">
                    {rev.topicName}
                  </h4>
                </div>

                <span className="text-xs text-[#6B7280] font-mono">
                  {rev.completedDate ? `Mastered on ${rev.completedDate}` : 'Retained'}
                </span>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-[#6B7280] rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#272730]">
              No mastered cards yet. Complete revision cards to fill your Mastered Vault!
            </div>
          )
        )}
      </div>
    </div>
  );
};
