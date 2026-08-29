import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Topic, TopicStatus, Chapter, Subject } from '../../types/syllabus';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Plus,
  Calculator,
  BrainCircuit,
  BookOpen,
  Globe,
  Edit2,
  Trash2,
  FileText,
  AlertTriangle,
  Layers,
  X,
  CheckCircle2,
  Zap,
  Circle,
  Clock,
  RotateCw,
  Target
} from 'lucide-react';
import { EditSubjectModal } from '../modals/EditSubjectModal';
import { EditChapterModal } from '../modals/EditChapterModal';
import { soundManager } from '../../utils/soundEffects';

interface SyllabusViewProps {
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
  onOpenAddTopic: () => void;
  onOpenFocus?: (topicId?: string) => void;
  initialSubjectId?: string;
  onSelectSubjectId?: (id: string) => void;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  onOpenTopicDrawer,
  onOpenAddTopic,
  onOpenFocus,
  initialSubjectId,
  onSelectSubjectId
}) => {
  const { currentExam, deleteTopic, updateTopicStatus } = useSyllabus();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || '');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'all'>('all');

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ subjectId: string; chapter: Chapter } | null>(null);

  // Horizontal Drag and Scroll Refs & State for Subject Selector
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (initialSubjectId && currentExam?.subjects.some(s => s.id === initialSubjectId)) {
      setSelectedSubjectId(initialSubjectId);
    }
  }, [initialSubjectId, currentExam]);

  useEffect(() => {
    if (currentExam && currentExam.subjects.length > 0) {
      if (!selectedSubjectId || !currentExam.subjects.some(s => s.id === selectedSubjectId)) {
        setSelectedSubjectId(currentExam.subjects[0].id);
      }
    }
  }, [currentExam, selectedSubjectId]);

  // Handle hardware / browser popstate back button
  useEffect(() => {
    const handlePopState = () => {
      if (selectedChapterId) {
        setSelectedChapterId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedChapterId]);

  const updateScrollButtons = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [currentExam?.subjects]);

  const handleScrollLeft = () => {
    soundManager.playClick();
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 300);
    }
  };

  const handleScrollRight = () => {
    soundManager.playClick();
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 300);
    }
  };

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tabsContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tabsContainerRef.current.offsetLeft);
    setScrollLeftState(tabsContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tabsContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabsContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tabsContainerRef.current.scrollLeft = scrollLeftState - walk;
    updateScrollButtons();
  };

  const iconMap: Record<string, React.ElementType> = {
    Calculator,
    BrainCircuit,
    BookOpen,
    Globe
  };

  const activeSubject = currentExam?.subjects.find(s => s.id === selectedSubjectId) || currentExam?.subjects[0];

  // Specific selected chapter (when viewing a dedicated chapter page)
  const activeChapter = useMemo(() => {
    if (!activeSubject || !selectedChapterId) return null;
    return activeSubject.chapters.find(c => c.id === selectedChapterId) || null;
  }, [activeSubject, selectedChapterId]);

  // Index of active chapter for prev/next switcher
  const currentChapterIndex = useMemo(() => {
    if (!activeSubject || !selectedChapterId) return -1;
    return activeSubject.chapters.findIndex(c => c.id === selectedChapterId);
  }, [activeSubject, selectedChapterId]);

  const prevChapter = currentChapterIndex > 0 ? activeSubject?.chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < (activeSubject?.chapters.length || 0) - 1
    ? activeSubject?.chapters[currentChapterIndex + 1]
    : null;

  const handleSelectChapter = (chapterId: string) => {
    soundManager.playClick();
    setSelectedChapterId(chapterId);
    setSearchTerm('');
    window.history.pushState({ chapterId }, '');
  };

  const handleBackToChapters = () => {
    soundManager.playClick();
    setSelectedChapterId(null);
    setSearchTerm('');
  };

  // Filtered chapters for Subject Overview
  const filteredChapters = useMemo(() => {
    if (!activeSubject) return [];

    return activeSubject.chapters.map(ch => {
      const filteredTopics = ch.topics.filter(t => {
        const matchesSearch =
          searchTerm.trim() === '' ||
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.subtopics.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
          ch.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      return {
        ...ch,
        topics: filteredTopics
      };
    });
  }, [activeSubject, searchTerm, statusFilter]);

  // Topics of the active chapter
  const activeChapterTopics = useMemo(() => {
    if (!activeChapter) return [];
    return activeChapter.topics.filter(t => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subtopics.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeChapter, searchTerm, statusFilter]);

  if (!currentExam || !activeSubject) return null;

  const totalTopicsInSubject = activeSubject.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
  const completedTopicsInSubject = activeSubject.chapters.reduce(
    (acc, ch) => acc + ch.topics.filter(t => t.status === 'completed').length,
    0
  );
  const subjectMasteryPercent = totalTopicsInSubject > 0
    ? Math.round((completedTopicsInSubject / totalTopicsInSubject) * 100)
    : 0;

  // Status counts for subject or chapter
  const statusCounts = useMemo(() => {
    const topicsList = activeChapter ? activeChapter.topics : activeSubject.chapters.flatMap(ch => ch.topics);
    return {
      all: topicsList.length,
      completed: topicsList.filter(t => t.status === 'completed').length,
      in_progress: topicsList.filter(t => t.status === 'in_progress').length,
      weak: topicsList.filter(t => t.status === 'weak').length,
      not_started: topicsList.filter(t => t.status === 'not_started' || !t.status).length,
    };
  }, [activeSubject, activeChapter]);

  const getTopicCardStyle = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return {
          cardClasses: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30 border-l-4 border-l-emerald-500 hover:border-emerald-500 hover:shadow-md',
          titleClasses: 'text-emerald-950 dark:text-emerald-200 font-bold',
          badgeClasses: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 font-bold',
          badgeLabel: 'Mastered ✓',
          badgeIcon: CheckCircle2,
          btnClasses: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm',
          btnLabel: 'Mastered ✓'
        };
      case 'in_progress':
        return {
          cardClasses: 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/30 border-l-4 border-l-amber-500 hover:border-amber-500 hover:shadow-md',
          titleClasses: 'text-amber-950 dark:text-amber-200 font-bold',
          badgeClasses: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 font-bold animate-pulse',
          badgeLabel: 'In Progress ⚡',
          badgeIcon: Zap,
          btnClasses: 'bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm',
          btnLabel: 'Mark Done ➔'
        };
      case 'weak':
        return {
          cardClasses: 'bg-rose-50/75 dark:bg-rose-950/25 border-rose-300 dark:border-rose-500/35 border-l-4 border-l-rose-500 hover:border-rose-500 hover:shadow-md',
          titleClasses: 'text-rose-950 dark:text-rose-200 font-bold',
          badgeClasses: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold',
          badgeLabel: 'Weak Topic ⚠️',
          badgeIcon: AlertTriangle,
          btnClasses: 'bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm',
          btnLabel: 'Fix Weak Topic 🔥'
        };
      case 'revision_due':
        return {
          cardClasses: 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-300 dark:border-purple-500/30 border-l-4 border-l-purple-500 hover:border-purple-500 hover:shadow-md',
          titleClasses: 'text-purple-950 dark:text-purple-200 font-bold',
          badgeClasses: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/35 font-bold',
          badgeLabel: 'Revise Due ⏳',
          badgeIcon: Clock,
          btnClasses: 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm',
          btnLabel: 'Revise Now ⏳'
        };
      default: // not_started
        return {
          cardClasses: 'bg-white dark:bg-[#24283B] border-slate-200 dark:border-[#292E42] border-l-4 border-l-slate-300 dark:border-l-slate-600 hover:border-slate-400 hover:shadow-sm',
          titleClasses: 'text-[#191A17] dark:text-[#C0CAF5] font-bold',
          badgeClasses: 'bg-slate-100 dark:bg-[#1F2335] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-[#292E42] font-bold',
          badgeLabel: 'Not Started ⭕',
          badgeIcon: Circle,
          btnClasses: 'bg-[#EEEEE8] dark:bg-[#1F2335] text-[#191A17] dark:text-[#C0CAF5] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#1A1B26] font-bold',
          btnLabel: 'Start Topic ➔'
        };
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // VIEW 1: SPECIFIC CHAPTER TOPICS VIEW (When a chapter is clicked)
  // ═══════════════════════════════════════════════════════════════════
  if (activeChapter) {
    const totalInActiveChapter = activeChapter.topics.length;
    const completedInActiveChapter = activeChapter.topics.filter(t => t.status === 'completed').length;
    const inProgressInActiveChapter = activeChapter.topics.filter(t => t.status === 'in_progress').length;
    const weakInActiveChapter = activeChapter.topics.filter(t => t.status === 'weak').length;
    const chapterPercent = totalInActiveChapter > 0 ? Math.round((completedInActiveChapter / totalInActiveChapter) * 100) : 0;
    const isAllCompleted = totalInActiveChapter > 0 && completedInActiveChapter === totalInActiveChapter;

    return (
      <div className="space-y-4 pb-16 animate-fade-in select-none max-w-full overflow-x-hidden">
        
        {/* Navigation Top Header with Back to Chapters (Mobile-First Responsive Layout) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth space-y-3 max-w-full overflow-hidden">
          
          {/* Row 1: Back to Chapters & Action Tools */}
          <div className="flex items-center justify-between gap-2 w-full">
            <button
              onClick={handleBackToChapters}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] hover:bg-[#596B35] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-[#1A1B26] text-[#191A17] dark:text-[#C0CAF5] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
              title="Return to all chapters"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>All Chapters</span>
            </button>

            {/* Quick Actions / Mastery / Switcher */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Mastery Badge */}
              <div className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 border border-[#596B35]/30 dark:border-[#7AA2F7]/40 text-xs font-mono font-black text-[#354126] dark:text-[#7AA2F7]">
                <span>{completedInActiveChapter}/{totalInActiveChapter}</span>
                <span>({chapterPercent}%)</span>
              </div>

              {/* Prev Chapter */}
              {prevChapter && (
                <button
                  onClick={() => handleSelectChapter(prevChapter.id)}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] text-xs font-bold text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white border border-[#D8D8CF] dark:border-[#292E42] transition-colors cursor-pointer flex items-center gap-1"
                  title={`Previous: ${prevChapter.name}`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Prev</span>
                </button>
              )}

              {/* Next Chapter */}
              {nextChapter && (
                <button
                  onClick={() => handleSelectChapter(nextChapter.id)}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] text-xs font-bold text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white border border-[#D8D8CF] dark:border-[#292E42] transition-colors cursor-pointer flex items-center gap-1"
                  title={`Next: ${nextChapter.name}`}
                >
                  <span className="hidden md:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Edit Chapter */}
              <button
                onClick={() => setEditingChapter({ subjectId: activeSubject.id, chapter: activeChapter })}
                className="p-1.5 sm:p-2 rounded-xl text-[#85877E] hover:text-[#191A17] dark:hover:text-white hover:bg-[#F7F6F0] dark:hover:bg-[#1F2335] border border-[#D8D8CF]/60 dark:border-[#292E42] transition-colors cursor-pointer"
                title="Edit Chapter Details"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 2: Chapter Breadcrumb & Full Title with Safe Break-Word Wrapping */}
          <div className="space-y-1 min-w-0 max-w-full pt-2.5 border-t border-[#EEEEE8] dark:border-[#292E42]">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#596B35] dark:text-[#7AA2F7]">
              <span>{activeSubject.name}</span>
              <span>•</span>
              <span>Chapter {currentChapterIndex + 1} of {activeSubject.chapters.length}</span>
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-[#11120F] dark:text-[#C0CAF5] font-serif leading-snug break-words">
              {activeChapter.name}
            </h2>
          </div>
        </div>

        {/* Chapter Status Metrics Strip */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 max-w-full overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono font-bold flex-wrap">
            <span className="text-[#65675F] dark:text-[#A9B1D6]">{totalInActiveChapter} Topics Total</span>
            <span className="text-emerald-600 dark:text-emerald-400">• {completedInActiveChapter} Mastered</span>
            <span className="text-amber-600 dark:text-amber-400">• {inProgressInActiveChapter} In Progress</span>
            <span className="text-rose-600 dark:text-rose-400">• {weakInActiveChapter} Weak</span>
          </div>

          <button
            onClick={onOpenAddTopic}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#11120F] hover:bg-[#596B35] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#1A1B26] text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Topic</span>
          </button>
        </div>

        {/* Search & Status Filters for Chapter Topics */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-full">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search topics in this chapter..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-medium text-[#191A17] dark:text-[#C0CAF5] placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] transition-colors shadow-subtle-depth"
            />
            <Search className="w-4 h-4 text-[#85877E] absolute left-3 top-1/2 -translate-y-1/2" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85877E] hover:text-[#191A17] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All', count: statusCounts.all, activeColor: 'bg-[#11120F] dark:bg-white text-white dark:text-black' },
              { id: 'completed', label: '✓ Mastered', count: statusCounts.completed, activeColor: 'bg-emerald-600 text-white shadow-sm' },
              { id: 'in_progress', label: '⚡ In Progress', count: statusCounts.in_progress, activeColor: 'bg-amber-500 text-white shadow-sm' },
              { id: 'weak', label: '⚠️ Weak', count: statusCounts.weak, activeColor: 'bg-rose-600 text-white shadow-sm' },
              { id: 'not_started', label: '⭕ Not Started', count: statusCounts.not_started, activeColor: 'bg-slate-700 text-white' },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  statusFilter === st.id
                    ? `${st.activeColor} border-transparent shadow-sm`
                    : 'bg-white dark:bg-[#24283B] text-[#65675F] dark:text-[#A9B1D6] border-[#D8D8CF] dark:border-[#292E42] hover:border-[#596B35] dark:hover:border-[#7AA2F7]'
                }`}
              >
                <span>{st.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  statusFilter === st.id ? 'bg-white/20' : 'bg-[#EEEEE8] dark:bg-[#1F2335] text-[#85877E]'
                }`}>
                  {st.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Chapter Topics List */}
        <div className="space-y-2.5">
          {activeChapterTopics.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-white dark:bg-[#24283B] border border-dashed border-[#D8D8CF] dark:border-[#292E42] space-y-3">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-[#191A17] dark:text-[#C0CAF5]">No topics found</h4>
              <p className="text-xs text-[#85877E]">
                {searchTerm ? 'No topics match the search filter.' : 'Click "+ Add Topic" to add the first topic to this chapter.'}
              </p>
              <button
                onClick={onOpenAddTopic}
                className="px-4 py-2 rounded-xl bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#1A1B26] text-xs font-bold cursor-pointer"
              >
                + Add First Topic
              </button>
            </div>
          ) : (
            activeChapterTopics.map(topic => {
              const style = getTopicCardStyle(topic.status);
              const BadgeIcon = style.badgeIcon;

              return (
                <div
                  key={topic.id}
                  onClick={() => onOpenTopicDrawer(topic, activeSubject.name, activeChapter.name)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group active:scale-99 shadow-xs ${style.cardClasses}`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-xs sm:text-sm ${style.titleClasses} group-hover:underline transition-colors flex items-center gap-1.5`}>
                        <span>{topic.name}</span>
                      </h4>
                      
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] border font-mono ${style.badgeClasses}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{style.badgeLabel}</span>
                      </span>
                    </div>

                    {topic.subtopics && topic.subtopics.length > 0 && (
                      <p className="text-[11px] text-[#65675F] dark:text-[#A9B1D6] line-clamp-1">
                        {topic.subtopics.join(' • ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-[#85877E] font-mono">
                      <span>Acc: <strong className="text-[#191A17] dark:text-[#C0CAF5]">{topic.accuracy}%</strong></span>
                      <span>•</span>
                      <span>Study: <strong className="text-[#191A17] dark:text-[#C0CAF5]">{topic.studyTimeMinutes}m</strong></span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextStatus: TopicStatus = topic.status === 'completed' ? 'in_progress' : 'completed';
                        updateTopicStatus(topic.id, nextStatus);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${style.btnClasses}`}
                    >
                      {style.btnLabel}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Edit Chapter Modal */}
        {editingChapter && (
          <EditChapterModal
            isOpen={Boolean(editingChapter)}
            subjectId={editingChapter.subjectId}
            chapter={editingChapter.chapter}
            onClose={() => setEditingChapter(null)}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // VIEW 2: SUBJECTS & CHAPTERS LIST VIEW (Clicking chapter opens View 1)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-16 animate-fade-in select-none">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-[#11120F] dark:text-[#C0CAF5] tracking-tight font-serif flex items-center gap-2.5">
            <span>Syllabus Explorer</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#354126] dark:text-[#7AA2F7] font-mono">
              {completedTopicsInSubject}/{totalTopicsInSubject} ({subjectMasteryPercent}%)
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#65675F] dark:text-[#A9B1D6] mt-1">
            Select any chapter to view and manage its complete topic syllabus.
          </p>
        </div>

        <button
          onClick={onOpenAddTopic}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#11120F] hover:bg-[#596B35] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#1A1B26] text-xs font-bold shadow-sm transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Custom Topic</span>
        </button>
      </div>

      {/* 2. SUBJECT HORIZONTAL MOVABLE SELECTOR */}
      <div className="relative p-2 rounded-2xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] shadow-subtle-depth flex items-center gap-2 group">
        
        {/* Left Arrow Button */}
        <button
          onClick={handleScrollLeft}
          className={`p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-[#191A17] dark:text-[#C0CAF5] hover:bg-[#DCE8B7] dark:hover:bg-[#7AA2F7]/20 hover:text-[#596B35] dark:hover:text-[#7AA2F7] transition-all cursor-pointer shrink-0 z-10 shadow-sm ${
            canScrollLeft ? 'opacity-100' : 'opacity-40 hover:opacity-40 cursor-not-allowed'
          }`}
          title="Scroll Left"
          disabled={!canScrollLeft}
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Scrollable & Draggable Tabs Track */}
        <div
          ref={tabsContainerRef}
          onScroll={updateScrollButtons}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none py-0.5"
        >
          {currentExam.subjects.map(subj => {
            const isActive = activeSubject.id === subj.id;
            const IconComponent = iconMap[subj.icon] || BookOpen;

            return (
              <button
                key={subj.id}
                onClick={(e) => {
                  soundManager.playClick();
                  setSelectedSubjectId(subj.id);
                  if (onSelectSubjectId) onSelectSubjectId(subj.id);
                  (e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border shrink-0 ${
                  isActive
                    ? 'bg-[#11120F] dark:bg-[#7AA2F7] text-white dark:text-[#1A1B26] border-transparent shadow-sm'
                    : 'bg-[#F7F6F0] dark:bg-[#1F2335] text-[#191A17] dark:text-[#C0CAF5] border-[#D8D8CF] dark:border-[#292E42] hover:border-[#596B35] dark:hover:border-[#7AA2F7]'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{subj.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isActive
                    ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#1A1B26]'
                    : 'bg-[#EEEEE8] dark:bg-[#16161E] text-[#85877E]'
                }`}>
                  {subj.chapters.reduce((a, c) => a + c.topics.length, 0)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={handleScrollRight}
          className={`p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-[#191A17] dark:text-[#C0CAF5] hover:bg-[#DCE8B7] dark:hover:bg-[#7AA2F7]/20 hover:text-[#596B35] dark:hover:text-[#7AA2F7] transition-all cursor-pointer shrink-0 z-10 shadow-sm ${
            canScrollRight ? 'opacity-100' : 'opacity-40 hover:opacity-40 cursor-not-allowed'
          }`}
          title="Scroll Right"
          disabled={!canScrollRight}
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Edit Subject Action Button */}
        <div className="pl-1 border-l border-[#D8D8CF] dark:border-[#292E42] shrink-0">
          <button
            onClick={() => setEditingSubject(activeSubject)}
            className="p-2 rounded-xl text-[#85877E] hover:text-[#191A17] dark:hover:text-white hover:bg-[#F7F6F0] dark:hover:bg-[#1F2335] transition-colors cursor-pointer"
            title="Edit Subject"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chapters or topics..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#24283B] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-medium text-[#191A17] dark:text-[#C0CAF5] placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] transition-colors shadow-subtle-depth"
          />
          <Search className="w-4 h-4 text-[#85877E] absolute left-3 top-1/2 -translate-y-1/2" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85877E] hover:text-[#191A17] p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'All', count: statusCounts.all, activeColor: 'bg-[#11120F] dark:bg-white text-white dark:text-black' },
            { id: 'completed', label: '✓ Mastered', count: statusCounts.completed, activeColor: 'bg-emerald-600 text-white shadow-sm' },
            { id: 'in_progress', label: '⚡ In Progress', count: statusCounts.in_progress, activeColor: 'bg-amber-500 text-white shadow-sm' },
            { id: 'weak', label: '⚠️ Weak', count: statusCounts.weak, activeColor: 'bg-rose-600 text-white shadow-sm' },
            { id: 'not_started', label: '⭕ Not Started', count: statusCounts.not_started, activeColor: 'bg-slate-700 text-white' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === st.id
                  ? `${st.activeColor} border-transparent shadow-sm`
                  : 'bg-white dark:bg-[#24283B] text-[#65675F] dark:text-[#A9B1D6] border-[#D8D8CF] dark:border-[#292E42] hover:border-[#596B35] dark:hover:border-[#7AA2F7]'
              }`}
            >
              <span>{st.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                statusFilter === st.id ? 'bg-white/20' : 'bg-[#EEEEE8] dark:bg-[#1F2335] text-[#85877E]'
              }`}>
                {st.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. CHAPTER CARDS LIST (1-Click Navigates to Chapter Topics) */}
      <div className="space-y-3 sm:space-y-4">
        {filteredChapters.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl bg-white dark:bg-[#24283B] border border-dashed border-[#D8D8CF] dark:border-[#292E42] space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-[#191A17] dark:text-[#C0CAF5]">No chapters found</h4>
            <p className="text-xs text-[#85877E]">No chapters match your search filter.</p>
          </div>
        ) : (
          filteredChapters.map(chapter => {
            const totalInChapter = chapter.topics.length;
            const completedInChapter = chapter.topics.filter(t => t.status === 'completed').length;
            const inProgressInChapter = chapter.topics.filter(t => t.status === 'in_progress').length;
            const weakInChapter = chapter.topics.filter(t => t.status === 'weak').length;
            const chapterPercent = totalInChapter > 0 ? Math.round((completedInChapter / totalInChapter) * 100) : 0;
            const isAllCompleted = totalInChapter > 0 && completedInChapter === totalInChapter;

            return (
              <div
                key={chapter.id}
                onClick={() => handleSelectChapter(chapter.id)}
                className={`rounded-2xl border transition-all duration-200 shadow-subtle-depth overflow-hidden cursor-pointer group hover:scale-[1.008] active:scale-[0.995] ${
                  isAllCompleted
                    ? 'bg-[#F7F6F0] dark:bg-[#24283B] border-[#596B35]/30 dark:border-[#7AA2F7]/30 hover:border-[#596B35] dark:hover:border-[#7AA2F7]'
                    : 'bg-white dark:bg-[#24283B] border-[#D8D8CF] dark:border-[#292E42] hover:border-[#596B35] dark:hover:border-[#7AA2F7]'
                }`}
              >
                {/* Chapter Card Content */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-[#191A17] dark:text-[#C0CAF5] tracking-normal truncate group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors font-serif">
                        {chapter.name}
                      </h3>
                      {isAllCompleted && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#4F7A45]/15 text-[#4F7A45] flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Unit Complete</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Chapter status indicators strip */}
                    <div className="flex items-center gap-2 text-[11px] text-[#65675F] dark:text-[#A9B1D6] mt-1 flex-wrap font-mono">
                      <span>{totalInChapter} {totalInChapter === 1 ? 'Topic' : 'Topics'}</span>
                      {completedInChapter > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">• {completedInChapter} Mastered</span>
                      )}
                      {inProgressInChapter > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">• {inProgressInChapter} In Progress</span>
                      )}
                      {weakInChapter > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">• {weakInChapter} Weak</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Progress Badge */}
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold ${
                      isAllCompleted
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : chapterPercent > 0
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-slate-100 dark:bg-[#1F2335] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#292E42]'
                    }`}>
                      {chapterPercent}%
                    </div>

                    {/* Edit Chapter Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingChapter({ subjectId: activeSubject.id, chapter });
                      }}
                      className="p-2 rounded-xl text-[#85877E] hover:text-[#191A17] dark:hover:text-white hover:bg-[#F7F6F0] dark:hover:bg-[#1F2335] transition-colors cursor-pointer"
                      title="Edit Chapter"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {editingSubject && (
        <EditSubjectModal
          isOpen={Boolean(editingSubject)}
          subject={editingSubject}
          onClose={() => setEditingSubject(null)}
        />
      )}

      {editingChapter && (
        <EditChapterModal
          isOpen={Boolean(editingChapter)}
          subjectId={editingChapter.subjectId}
          chapter={editingChapter.chapter}
          onClose={() => setEditingChapter(null)}
        />
      )}
    </div>
  );
};
