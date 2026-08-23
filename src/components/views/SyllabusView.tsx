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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Syllabus Explorer
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Drill down into subjects, chapters, and complete individual topics.
          </p>
        </div>

        <button
          onClick={onOpenAddTopic}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Topic</span>
        </button>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
        {currentExam.subjects.map(subj => {
          const isActive = activeSubject.id === subj.id;
          const IconComponent = iconMap[subj.icon] || BookOpen;
          return (
            <button
              key={subj.id}
              onClick={() => setSelectedSubjectId(subj.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 shadow-md'
                  : 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${subj.color}20`, color: subj.color }}
              >
                <IconComponent className="w-3.5 h-3.5" />
              </div>
              <span>{subj.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filter topics or subtopics..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'completed', label: 'Completed' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'revision_due', label: 'Revision Due' },
            { id: 'weak', label: 'Weak' },
            { id: 'not_started', label: 'Not Started' },
          ].map(filt => (
            <button
              key={filt.id}
              onClick={() => setStatusFilter(filt.id as TopicStatus | 'all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === filt.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
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
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {chapter.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {chapter.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {chCompleted} / {chapter.topics.length} Topics
                    </span>
                    <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${chPercent}%` }}
                      />
                    </div>
                  </div>
                  <ProgressRing progress={chPercent} size={48} strokeWidth={4} color={activeSubject.color} />
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/50">
                  {chapter.topics.length > 0 ? (
                    chapter.topics.map(topic => (
                      <div
                        key={topic.id}
                        onClick={() => onOpenTopicDrawer(topic, activeSubject.name, chapter.name)}
                        className="group p-4 sm:p-5 pl-10 sm:pl-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-500">
                              {topic.name}
                            </h5>
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {topic.difficulty}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
                              {topic.weightage} Marks
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {topic.subtopics.slice(0, 4).map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-slate-100/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 text-[11px]"
                              >
                                {s}
                              </span>
                            ))}
                            {topic.subtopics.length > 4 && (
                              <span className="text-[10px] text-slate-400">
                                +{topic.subtopics.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {topic.lastStudied && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                              <span>{formatTimeAgo(topic.lastStudied)}</span>
                            </div>
                          )}
                          <StatusBadge status={topic.status} size="md" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No topics match your search or status filter.
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
