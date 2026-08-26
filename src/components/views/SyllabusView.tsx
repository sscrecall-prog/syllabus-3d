import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Topic, TopicStatus, Chapter, Subject } from '../../types/syllabus';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
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
  ChevronsUpDown,
  CheckCircle2
} from 'lucide-react';
import { formatTimeAgo } from '../../utils/dateUtils';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'all'>('all');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ subjectId: string; chapter: Chapter } | null>(null);

  // Horizontal Drag and Scroll Refs & State
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

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const activeSubject = currentExam?.subjects.find(s => s.id === selectedSubjectId) || currentExam?.subjects[0];

  const allCurrentChapterIds = useMemo(() => {
    return activeSubject?.chapters.map(c => c.id) || [];
  }, [activeSubject]);

  const areAllExpanded = useMemo(() => {
    if (allCurrentChapterIds.length === 0) return false;
    return allCurrentChapterIds.every(id => expandedChapters[id]);
  }, [allCurrentChapterIds, expandedChapters]);

  const handleToggleAllChapters = () => {
    const newState = !areAllExpanded;
    const updated: Record<string, boolean> = { ...expandedChapters };
    allCurrentChapterIds.forEach(id => {
      updated[id] = newState;
    });
    setExpandedChapters(updated);
  };

  const filteredChapters = useMemo(() => {
    if (!activeSubject) return [];

    return activeSubject.chapters.map(ch => {
      const filteredTopics = ch.topics.filter(t => {
        const matchesSearch =
          searchTerm.trim() === '' ||
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.subtopics.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      return {
        ...ch,
        topics: filteredTopics
      };
    });
  }, [activeSubject, searchTerm, statusFilter]);

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const autoExp: Record<string, boolean> = {};
      filteredChapters.forEach(ch => {
        if (ch.topics.length > 0) autoExp[ch.id] = true;
      });
      setExpandedChapters(prev => ({ ...prev, ...autoExp }));
    }
  }, [searchTerm, filteredChapters]);

  if (!currentExam || !activeSubject) return null;

  const totalTopicsInSubject = activeSubject.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
  const completedTopicsInSubject = activeSubject.chapters.reduce(
    (acc, ch) => acc + ch.topics.filter(t => t.status === 'completed').length,
    0
  );
  const subjectMasteryPercent = totalTopicsInSubject > 0
    ? Math.round((completedTopicsInSubject / totalTopicsInSubject) * 100)
    : 0;

  const getStatusBadgeUI = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Mastered ✓',
          classes: 'bg-[#4F7A45]/15 text-[#4F7A45] border-[#4F7A45]/30 font-bold'
        };
      case 'in_progress':
        return {
          label: 'In Progress ⚡',
          classes: 'bg-[#DCE8B7] dark:bg-[#8B5CF6]/20 text-[#354126] dark:text-[#8B5CF6] border-[#596B35]/30 font-bold'
        };
      case 'revision_due':
        return {
          label: 'Revise Due ⏳',
          classes: 'bg-[#C49A3A]/15 text-[#C49A3A] border-[#C49A3A]/30 font-bold'
        };
      case 'weak':
        return {
          label: 'Weak Topic ⚠️',
          classes: 'bg-[#B94A48]/15 text-[#B94A48] border-[#B94A48]/30 font-bold'
        };
      default:
        return {
          label: 'Not Started ⭕',
          classes: 'bg-[#EEEEE8] dark:bg-[#23232A] text-[#85877E] border-[#D8D8CF] dark:border-[#272730]'
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-[#11120F] dark:text-[#F5F5F7] tracking-tight font-serif flex items-center gap-2.5">
            <span>Syllabus Explorer</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-[#DCE8B7] dark:bg-[#8B5CF6]/20 text-[#354126] dark:text-[#8B5CF6] font-mono">
              {completedTopicsInSubject}/{totalTopicsInSubject} ({subjectMasteryPercent}%)
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#65675F] dark:text-[#A1A1AA] mt-1">
            Systematic chapter breakdown and topic-level mastery tracking.
          </p>
        </div>

        <button
          onClick={onOpenAddTopic}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold shadow-sm transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Custom Topic</span>
        </button>
      </div>

      {/* 2. SUBJECT HORIZONTAL MOVABLE SELECTOR WITH NAVIGATION CONTROLS */}
      <div className="relative p-2 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth flex items-center gap-2 group">
        
        {/* Left Arrow Button */}
        <button
          onClick={handleScrollLeft}
          className={`p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-[#191A17] dark:text-[#F5F5F7] hover:bg-[#DCE8B7] dark:hover:bg-[#8B5CF6]/20 hover:text-[#596B35] transition-all cursor-pointer shrink-0 z-10 shadow-sm ${
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
                  setExpandedChapters({});
                  // Auto scroll tab into view
                  (e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border shrink-0 ${
                  isActive
                    ? 'bg-[#11120F] text-white border-transparent shadow-sm'
                    : 'bg-[#F7F6F0] dark:bg-[#23232A] text-[#65675F] dark:text-[#A1A1AA] border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35]'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-[#DCE8B7]' : 'text-[#596B35]'}`} />
                <span>{subj.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#EEEEE8] dark:bg-[#18181D] text-[#85877E]'
                }`}>
                  {subj.chapters.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={handleScrollRight}
          className={`p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-[#191A17] dark:text-[#F5F5F7] hover:bg-[#DCE8B7] dark:hover:bg-[#8B5CF6]/20 hover:text-[#596B35] transition-all cursor-pointer shrink-0 z-10 shadow-sm ${
            canScrollRight ? 'opacity-100' : 'opacity-40 hover:opacity-40 cursor-not-allowed'
          }`}
          title="Scroll Right"
          disabled={!canScrollRight}
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Edit Active Subject Button */}
        {activeSubject && (
          <button
            onClick={() => setEditingSubject(activeSubject)}
            className="p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-[#65675F] hover:text-[#11120F] dark:hover:text-white transition-all cursor-pointer shrink-0 shadow-sm"
            title="Edit Subject"
          >
            <Edit2 className="w-4 h-4 text-[#596B35] dark:text-[#8B5CF6]" />
          </button>
        )}
      </div>

      {/* 3. Search and Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85877E]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topics, subtopics..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] focus:outline-none focus:border-[#596B35] shadow-subtle-depth"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85877E] hover:text-[#191A17]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleToggleAllChapters}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-xs font-bold text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle-depth"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            <span>{areAllExpanded ? 'Collapse All' : 'Expand All'}</span>
          </button>

          {(['all', 'completed', 'in_progress', 'weak'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer border ${
                statusFilter === st
                  ? 'bg-[#11120F] text-white border-transparent shadow-sm'
                  : 'bg-white dark:bg-[#18181D] text-[#65675F] dark:text-[#A1A1AA] border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35]'
              }`}
            >
              {st === 'all' ? 'All' : st === 'completed' ? '✓ Mastered' : st === 'in_progress' ? '⚡ In Progress' : '⚠️ Weak'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CHAPTERS & TOPICS LIST */}
      <div className="space-y-3 sm:space-y-4">
        {filteredChapters.map(chapter => {
          const isExpanded = expandedChapters[chapter.id] ?? false;
          const totalInChapter = chapter.topics.length;
          const completedInChapter = chapter.topics.filter(t => t.status === 'completed').length;
          const chapterPercent = totalInChapter > 0 ? Math.round((completedInChapter / totalInChapter) * 100) : 0;
          const isAllCompleted = totalInChapter > 0 && completedInChapter === totalInChapter;

          return (
            <div
              key={chapter.id}
              className={`rounded-2xl border transition-all duration-200 shadow-subtle-depth overflow-hidden ${
                isAllCompleted
                  ? 'bg-[#F7F6F0] dark:bg-[#18181D] border-[#596B35]/30'
                  : 'bg-white dark:bg-[#18181D] border-[#D8D8CF] dark:border-[#272730]'
              }`}
            >
              {/* Chapter Header */}
              <div
                onClick={() => toggleChapter(chapter.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#EEEEE8]/50 dark:hover:bg-[#1D201A]/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button className="p-1 rounded-lg bg-[#F7F6F0] dark:bg-[#23232A] text-[#596B35] dark:text-[#8B5CF6]">
                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-[#191A17] dark:text-[#F5F5F7] uppercase tracking-wide truncate">
                        {chapter.name}
                      </h3>
                      {isAllCompleted && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#4F7A45]/15 text-[#4F7A45] flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Unit Complete</span>
                        </span>
                      )}
                    </div>
                    {chapter.description && (
                      <p className="text-xs text-[#65675F] dark:text-[#85877E] mt-0.5 truncate">
                        {chapter.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {/* Progress Badge */}
                  <span className="text-xs font-mono font-bold text-[#596B35] dark:text-[#8B5CF6]">
                    {chapterPercent}%
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChapter({ subjectId: activeSubject.id, chapter });
                    }}
                    className="p-1.5 rounded-lg text-[#85877E] hover:text-[#191A17] dark:hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Topics List (Collapsible) */}
              {isExpanded && (
                <div className="p-3 sm:p-5 pt-0 space-y-2 border-t border-[#EEEEE8] dark:border-[#1D201A] bg-[#F7F6F0]/40 dark:bg-[#0B0B0D]/40">
                  {chapter.topics.length === 0 ? (
                    <p className="text-xs text-[#85877E] py-3 text-center">
                      No topics match the filter.
                    </p>
                  ) : (
                    chapter.topics.map(topic => {
                      const badgeUI = getStatusBadgeUI(topic.status);

                      return (
                        <div
                          key={topic.id}
                          onClick={() => onOpenTopicDrawer(topic, activeSubject.name, chapter.name)}
                          className="p-3 sm:p-4 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group shadow-sm active:scale-99"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-[#191A17] dark:text-[#F5F5F7] group-hover:text-[#596B35] transition-colors">
                                {topic.name}
                              </h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] border font-mono ${badgeUI.classes}`}>
                                {badgeUI.label}
                              </span>
                            </div>

                            {topic.subtopics && topic.subtopics.length > 0 && (
                              <p className="text-[11px] text-[#65675F] dark:text-[#85877E] line-clamp-1">
                                {topic.subtopics.join(' • ')}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EEEEE8] dark:border-[#1D201A]">
                            <div className="flex items-center gap-2 text-[10px] text-[#85877E] font-mono">
                              <span>Acc: <strong className="text-[#191A17] dark:text-[#F5F5F7]">{topic.accuracy}%</strong></span>
                              <span>•</span>
                              <span>Study: <strong className="text-[#191A17] dark:text-[#F5F5F7]">{topic.studyTimeMinutes}m</strong></span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextStatus: TopicStatus = topic.status === 'completed' ? 'in_progress' : 'completed';
                                updateTopicStatus(topic.id, nextStatus);
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                topic.status === 'completed'
                                  ? 'bg-[#4F7A45] text-white shadow-sm'
                                  : 'bg-[#EEEEE8] dark:bg-[#23232A] text-[#191A17] dark:text-[#F5F5F7] hover:bg-[#DCE8B7] dark:hover:bg-[#8B5CF6]/20'
                              }`}
                            >
                              {topic.status === 'completed' ? 'Mastered ✓' : 'Mark Done'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
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
