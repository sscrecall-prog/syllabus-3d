import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  Layers,
  BookOpen,
  Sparkles,
  Tag,
  Star,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  ExtractedSubjectItem,
  ExtractedChapterItem,
  ExtractedTopicItem
} from '../../types/aiSyllabus';
import { DifficultyLevel } from '../../types/syllabus';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface SyllabusReviewTreeProps {
  subjects: ExtractedSubjectItem[];
  onChange: (updatedSubjects: ExtractedSubjectItem[]) => void;
}

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ec4899', '#06b6d4', '#ea580c', '#6366f1',
  '#14b8a6', '#f43f5e', '#84cc16', '#a855f7'
];

export const SyllabusReviewTree: React.FC<SyllabusReviewTreeProps> = ({
  subjects,
  onChange
}) => {
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    subjects.forEach((s, idx) => {
      init[s.id] = idx === 0; // expand first subject by default
    });
    return init;
  });

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    subjects.forEach(s => {
      s.chapters.forEach((c, idx) => {
        init[c.id] = idx === 0;
      });
    });
    return init;
  });

  const [newSubtopicInputs, setNewSubtopicInputs] = useState<Record<string, string>>({});

  const toggleSubject = (subjectId: string) => {
    soundManager.playClick();
    setExpandedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const toggleChapter = (chapterId: string) => {
    soundManager.playClick();
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  // Subject Actions
  const handleUpdateSubject = (subjectId: string, updates: Partial<ExtractedSubjectItem>) => {
    onChange(
      subjects.map(s => (s.id === subjectId ? { ...s, ...updates } : s))
    );
  };

  const handleDeleteSubject = (subjectId: string) => {
    soundManager.playClick();
    haptics.medium();
    onChange(subjects.filter(s => s.id !== subjectId));
  };

  const handleAddChapter = (subjectId: string) => {
    soundManager.playClick();
    const newChapterId = `chap_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
    const newChapter: ExtractedChapterItem = {
      id: newChapterId,
      name: 'New Chapter Module',
      description: 'Comprehensive study unit',
      topics: [
        {
          id: `topic_${Date.now().toString(36)}`,
          name: 'Fundamental Concepts',
          difficulty: 'Medium',
          weightage: 3,
          subtopics: ['Concept Overview', 'High-Yield Formulae']
        }
      ]
    };

    onChange(
      subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: [...s.chapters, newChapter]
        };
      })
    );

    setExpandedChapters(prev => ({ ...prev, [newChapterId]: true }));
    setExpandedSubjects(prev => ({ ...prev, [subjectId]: true }));
  };

  // Chapter Actions
  const handleUpdateChapter = (
    subjectId: string,
    chapterId: string,
    updates: Partial<ExtractedChapterItem>
  ) => {
    onChange(
      subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.map(c => (c.id === chapterId ? { ...c, ...updates } : c))
        };
      })
    );
  };

  const handleDeleteChapter = (subjectId: string, chapterId: string) => {
    soundManager.playClick();
    onChange(
      subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.filter(c => c.id !== chapterId)
        };
      })
    );
  };

  const handleAddTopic = (subjectId: string, chapterId: string) => {
    soundManager.playClick();
    const newTopic: ExtractedTopicItem = {
      id: `topic_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
      name: 'New Topic',
      difficulty: 'Medium',
      weightage: 3,
      subtopics: ['Core Definitions', 'Question Solving Patterns']
    };

    onChange(
      subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id !== chapterId) return c;
            return {
              ...c,
              topics: [...c.topics, newTopic]
            };
          })
        };
      })
    );
  };

  // Topic Actions
  const handleUpdateTopic = (
    subjectId: string,
    chapterId: string,
    topicId: string,
    updates: Partial<ExtractedTopicItem>
  ) => {
    onChange(
      subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id !== chapterId) return c;
            return {
              ...c,
              topics: c.topics.map(t => (t.id === topicId ? { ...t, ...updates } : t))
            };
          })
        };
      })
    );
  };

  const handleDeleteTopic = (subjectId: string, chapterId: string, topicId: string) => {
    soundManager.playClick();
    onChange(
      subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id !== chapterId) return c;
            return {
              ...c,
              topics: c.topics.filter(t => t.id !== topicId)
            };
          })
        };
      })
    );
  };

  // Subtopic Tag Actions
  const handleAddSubtopic = (subjectId: string, chapterId: string, topicId: string) => {
    const val = (newSubtopicInputs[topicId] || '').trim();
    if (!val) return;

    soundManager.playClick();
    onChange(
      subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id !== chapterId) return c;
            return {
              ...c,
              topics: c.topics.map(t => {
                if (t.id !== topicId) return t;
                return {
                  ...t,
                  subtopics: [...t.subtopics, val]
                };
              })
            };
          })
        };
      })
    );

    setNewSubtopicInputs(prev => ({ ...prev, [topicId]: '' }));
  };

  const handleDeleteSubtopic = (
    subjectId: string,
    chapterId: string,
    topicId: string,
    indexToDelete: number
  ) => {
    soundManager.playClick();
    onChange(
      subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id !== chapterId) return c;
            return {
              ...c,
              topics: c.topics.map(t => {
                if (t.id !== topicId) return t;
                return {
                  ...t,
                  subtopics: t.subtopics.filter((_, idx) => idx !== indexToDelete)
                };
              })
            };
          })
        };
      })
    );
  };

  const getDifficultyBadgeColor = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Hard':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
  };

  const cycleDifficulty = (current: DifficultyLevel): DifficultyLevel => {
    if (current === 'Easy') return 'Medium';
    if (current === 'Medium') return 'Hard';
    return 'Easy';
  };

  return (
    <div className="space-y-4">
      {subjects.map((subject, sIdx) => {
        const isSubExpanded = !!expandedSubjects[subject.id];
        const totalTopicsCount = subject.chapters.reduce(
          (sum, ch) => sum + ch.topics.length,
          0
        );

        return (
          <div
            key={subject.id}
            className="rounded-2xl bg-white/5 dark:bg-[#11131F] border border-white/10 dark:border-white/[0.08] overflow-hidden transition-all shadow-md"
          >
            {/* Subject Header */}
            <div
              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none bg-gradient-to-r from-white/[0.04] to-transparent hover:from-white/[0.07] transition-colors"
              onClick={() => toggleSubject(subject.id)}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                  aria-label="Toggle subject"
                >
                  {isSubExpanded ? (
                    <ChevronDown className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Color Dot & Icon */}
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-sm border border-white/20"
                  style={{ backgroundColor: `${subject.color}25` }}
                >
                  <span>{subject.icon}</span>
                </div>

                {/* Subject Name Input */}
                <input
                  type="text"
                  value={subject.name}
                  onClick={e => e.stopPropagation()}
                  onChange={e => handleUpdateSubject(subject.id, { name: e.target.value })}
                  className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-cyan-400 focus:outline-none text-white font-extrabold text-sm sm:text-base px-1 py-0.5 w-full max-w-sm truncate"
                />
              </div>

              {/* Subject Meta Badges & Delete */}
              <div
                className="flex items-center gap-2 shrink-0"
                onClick={e => e.stopPropagation()}
              >
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
                  <span>{subject.chapters.length} Modules</span>
                  <span>·</span>
                  <span>{totalTopicsCount} Topics</span>
                </div>

                {/* Quick Color Picker */}
                <div className="flex items-center gap-1">
                  {PRESET_COLORS.slice(0, 4).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleUpdateSubject(subject.id, { color: c })}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        subject.color === c ? 'scale-125 ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Select ${c}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSubject(subject.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete Subject"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chapters Container */}
            {isSubExpanded && (
              <div className="p-3 sm:p-4 pt-1 space-y-3 border-t border-white/10 bg-black/20">
                {subject.chapters.map((chapter, cIdx) => {
                  const isChapExpanded = !!expandedChapters[chapter.id];

                  return (
                    <div
                      key={chapter.id}
                      className="rounded-xl bg-white/[0.04] dark:bg-[#161826] border border-white/10 overflow-hidden"
                    >
                      {/* Chapter Header */}
                      <div
                        className="p-3 flex items-center justify-between gap-2.5 cursor-pointer select-none hover:bg-white/[0.03] transition-colors"
                        onClick={() => toggleChapter(chapter.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            className="p-1 rounded text-slate-400"
                            aria-label="Toggle chapter"
                          >
                            {isChapExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>

                          <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                            {cIdx + 1}
                          </span>

                          <input
                            type="text"
                            value={chapter.name}
                            onClick={e => e.stopPropagation()}
                            onChange={e =>
                              handleUpdateChapter(subject.id, chapter.id, {
                                name: e.target.value
                              })
                            }
                            className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-400 focus:outline-none text-slate-100 font-bold text-xs sm:text-sm px-1 py-0.5 w-full max-w-xs truncate"
                          />
                        </div>

                        <div
                          className="flex items-center gap-2 shrink-0"
                          onClick={e => e.stopPropagation()}
                        >
                          <span className="text-[11px] font-mono text-slate-400">
                            {chapter.topics.length} topics
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteChapter(subject.id, chapter.id)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Chapter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Topics List */}
                      {isChapExpanded && (
                        <div className="p-3 pt-0 space-y-2 border-t border-white/5 bg-black/10">
                          {chapter.topics.map(topic => (
                            <div
                              key={topic.id}
                              className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                                  <input
                                    type="text"
                                    value={topic.name}
                                    onChange={e =>
                                      handleUpdateTopic(subject.id, chapter.id, topic.id, {
                                        name: e.target.value
                                      })
                                    }
                                    className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-cyan-400 focus:outline-none text-white text-xs font-semibold px-1 py-0.5 w-full truncate"
                                  />
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Difficulty Toggle Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateTopic(subject.id, chapter.id, topic.id, {
                                        difficulty: cycleDifficulty(topic.difficulty)
                                      })
                                    }
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border transition-colors cursor-pointer ${getDifficultyBadgeColor(
                                      topic.difficulty
                                    )}`}
                                    title="Click to toggle difficulty"
                                  >
                                    {topic.difficulty}
                                  </button>

                                  {/* Weightage Stars */}
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() =>
                                          handleUpdateTopic(subject.id, chapter.id, topic.id, {
                                            weightage: star
                                          })
                                        }
                                        className="p-0.5 text-amber-400/30 hover:text-amber-400 transition-colors"
                                      >
                                        <Star
                                          className={`w-3 h-3 ${
                                            star <= topic.weightage
                                              ? 'fill-amber-400 text-amber-400'
                                              : ''
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteTopic(subject.id, chapter.id, topic.id)
                                    }
                                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    title="Delete Topic"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Granular Subtopics Tag Cloud */}
                              <div className="pl-3.5 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {topic.subtopics.map((subtopic, subIdx) => (
                                    <span
                                      key={subIdx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 transition-colors group"
                                    >
                                      <span>{subtopic}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteSubtopic(
                                            subject.id,
                                            chapter.id,
                                            topic.id,
                                            subIdx
                                          )
                                        }
                                        className="opacity-50 group-hover:opacity-100 hover:text-rose-400 transition-opacity"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </span>
                                  ))}

                                  {/* Add Subtopic Input */}
                                  <div className="inline-flex items-center gap-1">
                                    <input
                                      type="text"
                                      placeholder="+ Subtopic..."
                                      value={newSubtopicInputs[topic.id] || ''}
                                      onChange={e =>
                                        setNewSubtopicInputs(prev => ({
                                          ...prev,
                                          [topic.id]: e.target.value
                                        }))
                                      }
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddSubtopic(subject.id, chapter.id, topic.id);
                                        }
                                      }}
                                      className="px-2 py-0.5 rounded-md bg-transparent border border-white/10 hover:border-cyan-400/50 focus:border-cyan-400 focus:outline-none text-[10px] text-white placeholder-slate-500 w-24 focus:w-36 transition-all"
                                    />
                                    {(newSubtopicInputs[topic.id] || '').trim() && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleAddSubtopic(subject.id, chapter.id, topic.id)
                                        }
                                        className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-[10px] font-bold"
                                      >
                                        Add
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Add Topic in Chapter */}
                          <button
                            type="button"
                            onClick={() => handleAddTopic(subject.id, chapter.id)}
                            className="w-full py-1.5 rounded-lg border border-dashed border-white/15 hover:border-blue-400/50 hover:bg-blue-500/5 text-[11px] font-semibold text-slate-400 hover:text-blue-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Topic to Chapter</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Chapter in Subject */}
                <button
                  type="button"
                  onClick={() => handleAddChapter(subject.id)}
                  className="w-full py-2 rounded-xl border border-dashed border-white/20 hover:border-cyan-400/60 hover:bg-cyan-500/5 text-xs font-bold text-slate-300 hover:text-cyan-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Module / Chapter to {subject.name}</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
