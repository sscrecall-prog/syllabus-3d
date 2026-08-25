import React, { useState, useMemo, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Topic, TopicStatus, Chapter, Subject } from '../../types/syllabus';
import {
  Search,
  ChevronDown,
  ChevronRight,
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
          classes: 'bg-[#DCE8B7] dark:bg-[#354126] text-[#354126] dark:text-[#A4B879] border-[#596B35]/30 font-bold'
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
          classes: 'bg-[#EEEEE8] dark:bg-[#1D201A] text-[#85877E] border-[#D8D8CF] dark:border-[#30342B]'
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-[#11120F] dark:text-[#F4F4ED] tracking-tight font-serif flex items-center gap-2.5">
            <span>Syllabus Explorer</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-[#DCE8B7] dark:bg-[#354126] text-[#354126] dark:text-[#A4B879] font-mono">
              {completedTopicsInSubject}/{totalTopicsInSubject} ({subjectMasteryPercent}%)
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#65675F] dark:text-[#A7AA9C] mt-1">
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

      {/* 2. Subject Horizontal Selector */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {currentExam.subjects.map(subj => {
            const isActive = activeSubject.id === subj.id;
            const IconComponent = iconMap[subj.icon] || BookOpen;

            return (
              <button
                key={subj.id}
                onClick={() => {
                  setSelectedSubjectId(subj.id);
                  if (onSelectSubjectId) onSelectSubjectId(subj.id);
                  setExpandedChapters({});
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-[#11120F] text-white border-transparent shadow-sm'
                    : 'bg-[#F7F6F0] dark:bg-[#1D201A] text-[#65675F] dark:text-[#A7AA9C] border-[#D8D8CF] dark:border-[#30342B] hover:border-[#596B35]'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-[#DCE8B7]' : 'text-[#596B35]'}`} />
                <span>{subj.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#EEEEE8] dark:bg-[#151713] text-[#85877E]'
                }`}>
                  {subj.chapters.length}
                </span>
              </button>
            );
          })}
        </div>

        {activeSubject && (
          <button
            onClick={() => setEditingSubject(activeSubject)}
            className="p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-[#65675F] hover:text-[#11120F] transition-all cursor-pointer shrink-0"
            title="Edit Subject"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth">
        <div className="relative flex-1 max-w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#596B35] pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-medium text-[#191A17] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#596B35]"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85877E]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={handleToggleAllChapters}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F7F6F0] dark:bg-[#1D201A] text-[#65675F] border border-[#D8D8CF] dark:border-[#30342B] hover:border-[#596B35] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-[#596B35]" />
            <span>{areAllExpanded ? 'Collapse All' : 'Expand All'}</span>
          </button>

          {[
            { id: 'all', label: 'All' },
            { id: 'completed', label: '✓ Mastered' },
            { id: 'in_progress', label: '⚡ In Progress' },
            { id: 'weak', label: '⚠️ Weak' }
          ].map(filt => (
            <button
              key={filt.id}
              onClick={() => setStatusFilter(filt.id as TopicStatus | 'all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                statusFilter === filt.id
                  ? 'bg-[#596B35] text-white border-[#596B35]'
                  : 'bg-[#F7F6F0] dark:bg-[#1D201A] text-[#65675F] border-[#D8D8CF] dark:border-[#30342B] hover:border-[#596B35]'
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CHAPTER CARDS (Academic Tactile Elevation) */}
      <div className="space-y-3.5">
        {filteredChapters.map(chapter => {
          const isExpanded = Boolean(expandedChapters[chapter.id]);
          const chCompleted = chapter.topics.filter(t => t.status === 'completed').length;
          const isFullComplete = chapter.topics.length > 0 && chCompleted === chapter.topics.length;
          const chPercent = chapter.topics.length > 0 ? Math.round((chCompleted / chapter.topics.length) * 100) : 0;

          return (
            <div
              key={chapter.id}
              className={`rounded-2xl border transition-all duration-200 shadow-subtle-depth overflow-hidden ${
                isFullComplete
                  ? 'bg-[#F7F9F2] dark:bg-[#181C15] border-[#596B35]/50'
                  : 'bg-white dark:bg-[#151713] border-[#D8D8CF] dark:border-[#30342B] hover:border-[#8FA35F]'
              }`}
            >
              <div
                onClick={() => toggleChapter(chapter.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    isFullComplete ? 'bg-[#596B35] text-white' : 'bg-[#EEEEE8] dark:bg-[#1D201A] text-[#596B35]'
                  }`}>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>

                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#191A17] dark:text-[#F4F4ED]">
                      {chapter.name}
                    </h4>
                    <p className="text-[11px] text-[#65675F] dark:text-[#85877E] line-clamp-1">
                      {chapter.description || 'Academic study unit'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg font-mono ${
                    isFullComplete
                      ? 'bg-[#596B35] text-white'
                      : 'bg-[#EEEEE8] dark:bg-[#1D201A] text-[#596B35] dark:text-[#A4B879]'
                  }`}>
                    {chPercent}%
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChapter({ subjectId: activeSubject.id, chapter });
                    }}
                    className="p-1.5 text-[#85877E] hover:text-[#11120F] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="divide-y divide-[#EEEEE8] dark:divide-[#1D201A] border-t border-[#D8D8CF] dark:border-[#30342B] bg-white dark:bg-[#151713]">
                  {chapter.topics.map(topic => {
                    const badge = getStatusBadgeUI(topic.status);
                    return (
                      <div
                        key={topic.id}
                        onClick={() => onOpenTopicDrawer(topic, activeSubject.name, chapter.name)}
                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#F7F6F0] dark:hover:bg-[#1D201A] transition-colors cursor-pointer"
                      >
                        <div className="space-y-1">
                          <h5 className="text-xs sm:text-sm font-bold text-[#191A17] dark:text-[#F4F4ED]">
                            {topic.name}
                          </h5>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {topic.subtopics.slice(0, 3).map((sub, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-[#EEEEE8] dark:bg-[#1D201A] text-[#65675F] dark:text-[#85877E]">
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className={`px-2.5 py-0.5 text-[11px] rounded-md border ${badge.classes}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <EditSubjectModal
        subject={editingSubject}
        isOpen={Boolean(editingSubject)}
        onClose={() => setEditingSubject(null)}
      />

      <EditChapterModal
        subjectId={editingChapter?.subjectId || ''}
        chapter={editingChapter?.chapter || null}
        isOpen={Boolean(editingChapter)}
        onClose={() => setEditingChapter(null)}
      />
    </div>
  );
};
