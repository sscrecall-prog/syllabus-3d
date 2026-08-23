import React, { useState, useMemo, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { StatusBadge } from '../common/StatusBadge';
import { ProgressRing } from '../common/ProgressRing';
import { Topic, TopicStatus } from '../../types/syllabus';
import { Search, ChevronDown, ChevronRight, Plus, Calculator, BrainCircuit, BookOpen, Globe } from 'lucide-react';
import { formatTimeAgo } from '../../utils/dateUtils';

interface SyllabusViewProps {
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
  onOpenAddTopic: () => void;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  onOpenTopicDrawer,
  onOpenAddTopic,
}) => {
  const { currentExam } = useSyllabus();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'all'>('all');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentExam && currentExam.subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(currentExam.subjects[0].id);
    }
  }, [currentExam, selectedSubjectId]);

  useEffect(() => {
    if (currentExam) {
      const initExp: Record<string, boolean> = {};
      currentExam.subjects.forEach(s => {
        s.chapters.forEach(ch => {
          initExp[ch.id] = true;
        });
      });
      setExpandedChapters(initExp);
    }
  }, [currentExam]);

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

  if (!currentExam || !activeSubject) return null;

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Syllabus Explorer
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            Subjects, chapters, and topic completion tracker.
          </p>
        </div>

        <button
          onClick={onOpenAddTopic}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Add Topic</span>
        </button>
      </div>

      {/* Swipeable Subject Picker */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 -mx-1 px-1">
        {currentExam.subjects.map(subj => {
          const isActive = activeSubject.id === subj.id;
          const IconComponent = iconMap[subj.icon] || BookOpen;
          return (
            <button
              key={subj.id}
              onClick={() => setSelectedSubjectId(subj.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 shadow-sm'
                  : 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-transparent'
              }`}
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `${subj.color}20`, color: subj.color }}
              >
                <IconComponent className="w-3 h-3" />
              </div>
              <span>{subj.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-2.5 sm:space-y-0 sm:flex items-center justify-between gap-3 p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filter topics..."
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'completed', label: 'Done' },
            { id: 'in_progress', label: 'In Prog' },
            { id: 'revision_due', label: 'Revise' },
            { id: 'weak', label: 'Weak' },
            { id: 'not_started', label: 'New' },
          ].map(filt => (
            <button
              key={filt.id}
              onClick={() => setStatusFilter(filt.id as TopicStatus | 'all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === filt.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chapters Accordion */}
      <div className="space-y-3.5 sm:space-y-5">
        {filteredChapters.map(chapter => {
          const isExpanded = expandedChapters[chapter.id];
          const chCompleted = chapter.topics.filter(t => t.status === 'completed').length;
          const chPercent = chapter.topics.length > 0 ? Math.round((chCompleted / chapter.topics.length) * 100) : 0;

          return (
            <div
              key={chapter.id}
              className="rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden"
            >
              <div
                onClick={() => toggleChapter(chapter.id)}
                className="p-3.5 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                  <div className="p-1 sm:p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {chapter.name}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {chapter.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {chCompleted} / {chapter.topics.length} Topics
                    </span>
                    <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${chPercent}%` }}
                      />
                    </div>
                  </div>
                  <ProgressRing progress={chPercent} size={40} strokeWidth={3.5} color={activeSubject.color} />
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/50">
                  {chapter.topics.length > 0 ? (
                    chapter.topics.map(topic => (
                      <div
                        key={topic.id}
                        onClick={() => onOpenTopicDrawer(topic, activeSubject.name, chapter.name)}
                        className="group p-3 sm:p-4 pl-4 sm:pl-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-500">
                              {topic.name}
                            </h5>
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {topic.difficulty}
                            </span>
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
                              {topic.weightage} Marks
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1">
                            {topic.subtopics.slice(0, 3).map((s, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded-md bg-slate-100/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 text-[10px]"
                              >
                                {s}
                              </span>
                            ))}
                            {topic.subtopics.length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{topic.subtopics.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 shrink-0">
                          {topic.lastStudied && (
                            <span className="text-[10px] text-slate-400">
                              {formatTimeAgo(topic.lastStudied)}
                            </span>
                          )}
                          <StatusBadge status={topic.status} size="sm" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-5 text-center text-xs text-slate-400">
                      No topics match this filter.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
