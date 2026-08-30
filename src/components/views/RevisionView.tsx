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
  Clock} from 'lucide-react';
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
  onOpenTopicDrawer}) => {
  const { revisions, dueRevisions, allTopics, currentExam } = useSyllabus();

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
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-20 max-w-5xl mx-auto select-none">
      
      {/* 1. HEADER & START REVISION BUTTON */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#596B35]/15 dark:bg-[#8B5CF6]/20 text-[#596B35] dark:text-[#8B5CF6] flex items-center justify-center">
                <RotateCw className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-2xl font-bold text-[#191A17] dark:text-[#F5F5F7]">
                Spaced Repetition & Revision
              </h2>
            </div>
            <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] font-normal leading-relaxed">
              Lock concepts into permanent memory with active recall intervals (1d → 3d → 7d → 21d+).
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenRevisionSession();
            }}
            disabled={dueRevisions.length === 0}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
              dueRevisions.length > 0
                ? 'bg-[#11120F] dark:bg-[#8B5CF6] text-white hover:bg-[#596B35] dark:hover:bg-[#7C3AED] shadow-[#8B5CF6]/25'
                : 'bg-[#EEEEE8] dark:bg-[#23232A] text-[#85877E] dark:text-[#71717A] cursor-not-allowed opacity-60'
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

      {/* 2. 4-STAGE RETENTION PIPELINE CARDS (MOBILE-OPTIMIZED GRID) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* Stage 1 */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-blue-500/50 shadow-subtle-depth space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
              Stage 1 • 1d
            </span>
            <span className="text-[10px] text-[#85877E] dark:text-[#71717A] hidden xs:inline">Day 1</span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-[#191A17] dark:text-[#F5F5F7]">
              {stage1Count} <span className="text-xs font-normal text-[#65675F] dark:text-[#A1A1AA]">cards</span>
            </div>
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">Initial Recall</p>
            <p className="text-[10px] text-[#85877E] dark:text-[#71717A] truncate">Fresh concepts learned</p>
          </div>
        </div>

        {/* Stage 2 */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-amber-500/50 shadow-subtle-depth space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              Stage 2 • 3d
            </span>
            <span className="text-[10px] text-[#85877E] dark:text-[#71717A] hidden xs:inline">Day 3</span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-[#191A17] dark:text-[#F5F5F7]">
              {stage2Count} <span className="text-xs font-normal text-[#65675F] dark:text-[#A1A1AA]">cards</span>
            </div>
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">Consolidation</p>
            <p className="text-[10px] text-[#85877E] dark:text-[#71717A] truncate">Memory reinforcing</p>
          </div>
        </div>

        {/* Stage 3 */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-purple-500/50 shadow-subtle-depth space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
              Stage 3 • 7d
            </span>
            <span className="text-[10px] text-[#85877E] dark:text-[#71717A] hidden xs:inline">Day 7</span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-[#191A17] dark:text-[#F5F5F7]">
              {stage3Count} <span className="text-xs font-normal text-[#65675F] dark:text-[#A1A1AA]">cards</span>
            </div>
            <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5">Long-Term</p>
            <p className="text-[10px] text-[#85877E] dark:text-[#71717A] truncate">Core memory recall</p>
          </div>
        </div>

        {/* Stage 4 / Mastered */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-emerald-500/50 shadow-subtle-depth space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              Stage 4 • 21d+
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">★ Mastered</span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stage4Count} <span className="text-xs font-normal text-[#65675F] dark:text-[#A1A1AA]">cards</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Permanently Locked</p>
            <p className="text-[10px] text-[#85877E] dark:text-[#71717A] truncate">Exam-ready recall</p>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & QUEUE FILTER BAR */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-3">
        
        {/* Search & Tabs Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85877E] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search topics in revision queue..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#8B5CF6]"
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

          {/* Queue Tab Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'today', label: 'Due Today', count: dueList.length },
              { id: 'upcoming', label: 'Upcoming', count: upcomingList.length },
              { id: 'history', label: 'Mastered', count: historyList.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#11120F] dark:bg-[#8B5CF6] text-white border-transparent shadow-sm'
                    : 'bg-[#F7F6F0] dark:bg-[#23232A] text-[#65675F] dark:text-[#A1A1AA] border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-[#EEEEE8] dark:bg-[#18181D] text-[#85877E] dark:text-[#A1A1AA]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Subject Filter Pills Row */}
        {currentExam && currentExam.subjects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 border-t border-[#D8D8CF]/60 dark:border-[#272730] no-scrollbar">
            <span className="text-[11px] font-semibold text-[#85877E] dark:text-[#A1A1AA] flex items-center gap-1 shrink-0 mr-0.5">
              <Filter className="w-3 h-3" />
              <span>Subject:</span>
            </span>

            <button
              onClick={() => setSelectedSubjectFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                selectedSubjectFilter === 'all'
                  ? 'bg-[#596B35] dark:bg-[#8B5CF6] text-white border-transparent shadow-sm'
                  : 'bg-[#F7F6F0] dark:bg-[#23232A] text-[#65675F] dark:text-[#A1A1AA] border-[#D8D8CF] dark:border-[#272730]'
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
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                    selectedSubjectFilter === s.name
                      ? 'bg-[#596B35] dark:bg-[#8B5CF6] text-white border-transparent shadow-sm'
                      : 'bg-[#F7F6F0] dark:bg-[#23232A] text-[#65675F] dark:text-[#A1A1AA] border-[#D8D8CF] dark:border-[#272730]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color || '#596B35' }} />
                  <span>{s.name}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. REVISION CARDS QUEUE */}
      <div className="space-y-2.5 sm:space-y-3">
        
        {/* DUE TODAY LIST */}
        {activeTab === 'today' && (
          displayedDue.length > 0 ? (
            displayedDue.map(rev => {
              const topicObj = allTopics.find(t => t.topic.id === rev.topicId);

              return (
                <div
                  key={rev.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] dark:hover:border-[#8B5CF6] shadow-subtle-depth transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#596B35]/15 dark:bg-[#8B5CF6]/20 text-[#596B35] dark:text-[#8B5CF6] border border-[#596B35]/25 dark:border-[#8B5CF6]/30 font-mono">
                        Stage {rev.stage} • {rev.intervalDays}d
                      </span>
                      <span className="text-[11px] font-medium text-[#65675F] dark:text-[#A1A1AA] truncate">
                        {rev.subjectName} • {rev.chapterName}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-semibold text-[#191A17] dark:text-[#F5F5F7] group-hover:text-[#596B35] dark:group-hover:text-[#8B5CF6] transition-colors">
                      {rev.topicName}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                    {topicObj && onOpenTopicDrawer && (
                      <button
                        onClick={() => onOpenTopicDrawer(topicObj.topic, rev.subjectName, rev.chapterName)}
                        className="px-3 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-semibold text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white cursor-pointer"
                      >
                        Notes & Details
                      </button>
                    )}

                    <button
                      onClick={onOpenRevisionSession}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#11120F] dark:bg-[#8B5CF6] hover:bg-[#596B35] dark:hover:bg-[#7C3AED] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Review Card</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            /* Clean Empty State */
            <div className="py-10 sm:py-14 px-4 text-center rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#596B35]/15 dark:bg-[#8B5CF6]/20 border border-[#596B35]/30 dark:border-[#8B5CF6]/30 flex items-center justify-center text-[#596B35] dark:text-[#8B5CF6] mx-auto shadow-sm">
                <Trophy className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-[#191A17] dark:text-[#F5F5F7]">
                  All Due Revisions Cleared Today! 🎉
                </h3>
                <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] max-w-md mx-auto">
                  Your spaced repetition queue is fully up to date. You can review upcoming cards early or inspect your mastered vault.
                </p>
              </div>

              {upcomingList.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setActiveTab('upcoming');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] hover:bg-[#DCE8B7] dark:hover:bg-[#8B5CF6]/20 border border-[#D8D8CF] dark:border-[#272730] text-xs font-semibold text-[#191A17] dark:text-[#F5F5F7] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View {upcomingList.length} Upcoming Cards</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#596B35] dark:text-[#8B5CF6]" />
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* UPCOMING LIST */}
        {activeTab === 'upcoming' && (
          displayedUpcoming.length > 0 ? (
            displayedUpcoming.map(rev => (
              <div
                key={rev.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth flex items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#EEEEE8] dark:bg-[#23232A] text-[#65675F] dark:text-[#A1A1AA]">
                      Stage {rev.stage}
                    </span>
                    <span className="text-[11px] text-[#65675F] dark:text-[#A1A1AA] truncate">
                      {rev.subjectName} • {rev.chapterName}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#191A17] dark:text-[#F5F5F7] truncate">
                    {rev.topicName}
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-bold text-[#596B35] dark:text-[#8B5CF6] font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateReadable(rev.scheduledDate)}</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-xs text-[#65675F] dark:text-[#A1A1AA] rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730]">
              No upcoming revisions found matching filter.
            </div>
          )
        )}

        {/* MASTERED VAULT LIST */}
        {activeTab === 'history' && (
          displayedHistory.length > 0 ? (
            displayedHistory.map(rev => (
              <div
                key={rev.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181D] border border-emerald-500/30 shadow-subtle-depth flex items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      ✓ Mastered
                    </span>
                    <span className="text-[11px] text-[#65675F] dark:text-[#A1A1AA] truncate">{rev.subjectName}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#191A17] dark:text-[#F5F5F7] truncate">
                    {rev.topicName}
                  </h4>
                </div>

                <span className="text-xs text-[#65675F] dark:text-[#A1A1AA] font-mono shrink-0">
                  {rev.completedDate ? `Mastered on ${rev.completedDate}` : 'Retained'}
                </span>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-xs text-[#65675F] dark:text-[#A1A1AA] rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730]">
              No mastered cards yet. Complete revision cards to fill your Mastered Vault!
            </div>
          )
        )}
      </div>
    </div>
  );
};
