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
  FolderOpen,
  Folder
} from 'lucide-react';
import { formatTimeAgo } from '../../utils/dateUtils';
import { EditSubjectModal } from '../modals/EditSubjectModal';
import { EditChapterModal } from '../modals/EditChapterModal';

interface SyllabusViewProps {
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
  onOpenAddTopic: () => void;
  onOpenFocus?: (topicId?: string) => void;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  onOpenTopicDrawer,
  onOpenAddTopic,
  onOpenFocus
}) => {
  const { currentExam, deleteTopic, updateTopicStatus } = useSyllabus();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'all'>('all');
  
  // All chapters start collapsed by default as requested
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Modals for editing subject & chapter
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ subjectId: string; chapter: Chapter } | null>(null);

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

  // Expand / Collapse all chapters
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

  // Auto-expand chapters when searching with text
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const autoExp: Record<string, boolean> = {};
      filteredChapters.forEach(ch => {
        if (ch.topics.length > 0) {
          autoExp[ch.id] = true;
        }
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

  const getDifficultyColor = (diff: string) => {
    if (diff === 'Easy') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (diff === 'Hard') return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
    return 'text-[#8C6D15] dark:text-[#D4AF37] bg-[#D4AF37]/15 border-[#D4AF37]/35';
  };

  const getStatusBadgeUI = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Mastered ✓',
          classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-bold'
        };
      case 'in_progress':
        return {
          label: 'In Progress ⚡',
          classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40 font-bold'
        };
      case 'revision_due':
        return {
          label: 'Revise Due ⏳',
          classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 font-bold'
        };
      case 'weak':
        return {
          label: 'Weak Topic ⚠️',
          classes: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 font-bold'
        };
      default:
        return {
          label: 'Not Started ⭕',
          classes: 'bg-[#FAF8F5] dark:bg-[#1A1A1A] text-[#6B7280] border-[#EBD3A0]/60 dark:border-[#383838]'
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header with Title and Add Topic Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-[#171717] dark:text-[#F5E6C8] tracking-tight flex items-center gap-2.5">
            <span>Syllabus Explorer</span>
            <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-[#D4AF37]/20 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/40 font-mono">
              {completedTopicsInSubject}/{totalTopicsInSubject} Mastered ({subjectMasteryPercent}%)
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            Click on any chapter to expand and view its topic list.
          </p>
        </div>

        <button
          onClick={onOpenAddTopic}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] text-xs font-black shadow-md shadow-[#D4AF37]/25 hover:shadow-lg transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Custom Topic</span>
        </button>
      </div>

      {/* 2. Luxury Horizontal Subject Selector Carousel */}
      <div className="flex items-center gap-2.5 p-2 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-md overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {currentExam.subjects.map(subj => {
            const isActive = activeSubject.id === subj.id;
            const IconComponent = iconMap[subj.icon] || BookOpen;
            const chCount = subj.chapters.length;

            return (
              <button
                key={subj.id}
                onClick={() => {
                  setSelectedSubjectId(subj.id);
                  // Keep collapsed when changing subjects
                  setExpandedChapters({});
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89327] text-[#171717] border-transparent shadow-md shadow-[#D4AF37]/25 scale-[1.02]'
                    : 'bg-[#FAF8F5] dark:bg-[#171717] text-[#6B7280] dark:text-[#A0A0A0] border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37] hover:text-[#171717] dark:hover:text-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-xl flex items-center justify-center ${
                    isActive
                      ? 'bg-black/15 text-[#171717]'
                      : 'bg-[#D4AF37]/15 text-[#D4AF37]'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <span>{subj.name}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  isActive ? 'bg-black/15 text-[#171717]' : 'bg-slate-200 dark:bg-[#2A2A2A] text-[#6B7280]'
                }`}>
                  {chCount} ch
                </span>
              </button>
            );
          })}
        </div>

        {/* Edit Subject Settings Trigger */}
        {activeSubject && (
          <button
            onClick={() => setEditingSubject(activeSubject)}
            className="p-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37] text-[#6B7280] hover:text-[#D4AF37] transition-all cursor-pointer shrink-0"
            title="Edit Active Subject"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Luxury Search, Filter & Accordion Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-md">
        {/* Search Input */}
        <div className="relative flex-1 max-w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37] pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search topics or subtopics..."
            className="w-full pl-10 pr-8 py-2 rounded-2xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0] dark:border-[#383838] text-xs font-semibold text-[#171717] dark:text-white placeholder-[#6B7280] focus:ring-2 focus:ring-[#D4AF37]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#171717] dark:hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills & Expand All Button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {/* Quick Expand / Collapse All Toggle */}
          <button
            onClick={handleToggleAllChapters}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] dark:bg-[#171717] text-[#6B7280] hover:text-[#171717] dark:hover:text-white border border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37] transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title={areAllExpanded ? 'Collapse All Chapters' : 'Expand All Chapters'}
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{areAllExpanded ? 'Collapse All' : 'Expand All'}</span>
          </button>

          <div className="h-4 w-px bg-[#EBD3A0]/60 dark:bg-[#2E2E2E] shrink-0" />

          {[
            { id: 'all', label: 'All' },
            { id: 'completed', label: '✓ Mastered' },
            { id: 'in_progress', label: '⚡ In Progress' },
            { id: 'revision_due', label: '⏳ Revise Due' },
            { id: 'weak', label: '⚠️ Weak Topics' },
            { id: 'not_started', label: '⭕ Not Started' },
          ].map(filt => (
            <button
              key={filt.id}
              onClick={() => setStatusFilter(filt.id as TopicStatus | 'all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                statusFilter === filt.id
                  ? 'bg-[#D4AF37] text-[#171717] border-[#D4AF37] shadow-sm'
                  : 'bg-[#FAF8F5] dark:bg-[#171717] text-[#6B7280] border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37]'
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Chapters Accordion Stack (Click to expand specific chapter) */}
      <div className="space-y-4">
        {filteredChapters.map(chapter => {
          const isExpanded = Boolean(expandedChapters[chapter.id]);
          const chCompleted = chapter.topics.filter(t => t.status === 'completed').length;
          const chPercent = chapter.topics.length > 0 ? Math.round((chCompleted / chapter.topics.length) * 100) : 0;

          return (
            <div
              key={chapter.id}
              className={`rounded-3xl bg-white dark:bg-[#202020] border transition-all duration-300 shadow-md overflow-hidden ${
                isExpanded
                  ? 'border-[#D4AF37] shadow-lg ring-1 ring-[#D4AF37]/30'
                  : 'border-[#EBD3A0] dark:border-[#333333] hover:border-[#D4AF37]/70'
              }`}
            >
              {/* Chapter Header Click Target (Expands only this chapter) */}
              <div
                onClick={() => toggleChapter(chapter.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-[#FAF8F5]/70 dark:bg-[#1A1A1A]/70 cursor-pointer select-none group transition-colors hover:bg-[#F5E6C8]/30 dark:hover:bg-[#222222]"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Rotating Chevron Indicator */}
                  <div className={`p-2 rounded-xl transition-all duration-200 shrink-0 ${
                    isExpanded
                      ? 'bg-[#D4AF37] text-[#171717] shadow-sm rotate-0'
                      : 'bg-white dark:bg-[#242424] border border-[#EBD3A0]/60 dark:border-[#383838] text-[#D4AF37] group-hover:scale-105'
                  }`}>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>

                  <div>
                    <h4 className={`text-sm sm:text-base font-black transition-colors ${
                      isExpanded
                        ? 'text-[#D4AF37]'
                        : 'text-[#171717] dark:text-[#F5E6C8] group-hover:text-[#D4AF37]'
                    }`}>
                      {chapter.name}
                    </h4>
                    <p className="text-[11px] text-[#6B7280] line-clamp-1">
                      {chapter.description || 'Custom study unit'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8] font-mono">
                      {chCompleted} / {chapter.topics.length} Mastered
                    </span>
                    <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-[#2A2A2A] mt-1 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${chPercent}%` }}
                      />
                    </div>
                  </div>

                  <span className="px-2.5 py-1 text-xs font-black rounded-full bg-[#D4AF37]/15 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
                    {chPercent}%
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChapter({ subjectId: activeSubject.id, chapter });
                    }}
                    className="p-2 rounded-xl text-[#6B7280] hover:text-[#D4AF37] hover:bg-[#F5E6C8]/40 dark:hover:bg-[#282828] transition-colors cursor-pointer"
                    title="Edit Chapter Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Topics List Rows (Only visible when isExpanded === true) */}
              {isExpanded && (
                <div className="divide-y divide-[#EBD3A0]/40 dark:divide-[#282828] border-t border-[#EBD3A0]/60 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] animate-fade-in">
                  {chapter.topics.length > 0 ? (
                    chapter.topics.map(topic => {
                      const badge = getStatusBadgeUI(topic.status);
                      const hasNotes = Boolean(topic.notes && topic.notes.trim().length > 0);
                      const mistakeCount = topic.mistakes?.length || 0;

                      return (
                        <div
                          key={topic.id}
                          onClick={() => onOpenTopicDrawer(topic, activeSubject.name, chapter.name)}
                          className="group p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#242424] transition-all"
                        >
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-xs sm:text-sm font-extrabold text-[#171717] dark:text-[#F5E6C8] group-hover:text-[#D4AF37] transition-colors">
                                {topic.name}
                              </h5>

                              {/* Difficulty Badge */}
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${getDifficultyColor(topic.difficulty)}`}>
                                {topic.difficulty}
                              </span>

                              {/* Notes Indicator */}
                              {hasNotes && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-[#D4AF37]/15 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/30 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  <span>Notes</span>
                                </span>
                              )}

                              {/* Mistakes Indicator */}
                              {mistakeCount > 0 && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{mistakeCount} Mistake{mistakeCount > 1 ? 's' : ''}</span>
                                </span>
                              )}
                            </div>

                            {/* Subtopics Checklist Chips */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {topic.subtopics.slice(0, 4).map((sub, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-white dark:bg-[#262626] border border-[#EBD3A0]/60 dark:border-[#333333] text-[#6B7280] dark:text-[#B0B0B0] text-[10px] font-medium"
                                >
                                  {sub}
                                </span>
                              ))}
                              {topic.subtopics.length > 4 && (
                                <span className="text-[10px] font-bold text-[#D4AF37]">
                                  +{topic.subtopics.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Side: Status Badge, Last Studied & Quick Actions */}
                          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EBD3A0]/30 dark:border-[#282828]">
                            {topic.lastStudied && (
                              <span className="text-[10px] font-medium text-[#6B7280]">
                                {formatTimeAgo(topic.lastStudied)}
                              </span>
                            )}

                            {/* Status Chip Button */}
                            <span className={`px-3 py-1 text-xs rounded-xl border ${badge.classes}`}>
                              {badge.label}
                            </span>

                            {/* Delete Topic Action */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTopic(topic.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-[#6B7280] hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                              title="Delete Topic"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-[#6B7280]">
                      No topics in this chapter. Click &quot;Add Custom Topic&quot; to add concepts.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Subject Modal */}
      <EditSubjectModal
        subject={editingSubject}
        isOpen={Boolean(editingSubject)}
        onClose={() => setEditingSubject(null)}
      />

      {/* Edit Chapter Modal */}
      <EditChapterModal
        subjectId={editingChapter?.subjectId || ''}
        chapter={editingChapter?.chapter || null}
        isOpen={Boolean(editingChapter)}
        onClose={() => setEditingChapter(null)}
      />
    </div>
  );
};
