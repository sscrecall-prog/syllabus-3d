import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Exam,
  Subject,
  Chapter,
  Topic,
  TopicStatus,
  MistakeType,
  RevisionRecord,
  AchievementBadge,
  UserProgressProfile,
  DailyActivity,
  OverallStats,
  SubjectStats,
  DifficultyLevel
} from '../types/syllabus';
import { INITIAL_EXAMS, INITIAL_ACHIEVEMENTS, INITIAL_PROFILE, INITIAL_ACTIVITY_HISTORY } from '../data/initialData';
import { calculateInitialRevisions, gradeRevision, getTodayDateString } from '../utils/spacedRepetition';
import { soundManager } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

export interface CreateCustomTopicPayload {
  isNewSubject: boolean;
  subjectId?: string;
  newSubjectName?: string;
  newSubjectColor?: string;
  newSubjectIcon?: string;

  isNewChapter: boolean;
  chapterId?: string;
  newChapterName?: string;
  newChapterDescription?: string;

  topicName: string;
  difficulty: DifficultyLevel;
  weightage: number;
  subtopics: string[];
}

interface SyllabusContextType {
  exams: Exam[];
  currentExam: Exam | undefined;
  selectedExamId: string;
  setSelectedExamId: (id: string) => void;
  profile: UserProgressProfile;
  updateProfile: (updates: Partial<UserProgressProfile>) => void;
  achievements: AchievementBadge[];
  activityHistory: DailyActivity[];
  overallStats: OverallStats;
  subjectStats: SubjectStats[];
  allTopics: Array<{ subjectName: string; subjectColor: string; chapterName: string; topic: Topic }>;
  weakTopics: Array<{ subjectName: string; subjectColor: string; chapterName: string; topic: Topic }>;
  revisions: RevisionRecord[];
  dueRevisions: RevisionRecord[];

  updateTopicStatus: (topicId: string, status: TopicStatus, accuracy?: number) => void;
  updateTopicNotes: (topicId: string, notes: string) => void;
  addTopicMistake: (topicId: string, desc: string, type: MistakeType, solution: string) => void;
  resolveTopicMistake: (topicId: string, mistakeId: string) => void;
  completeRevisionCard: (revisionId: string, grade: 'again' | 'hard' | 'good' | 'easy') => void;
  addTopic: (subjectId: string, chapterId: string, topicData: Partial<Topic> & { name: string }) => void;
  addCustomTopicWithHierarchy: (payload: CreateCustomTopicPayload) => void;

  // Full Edit & Delete Methods
  editSubject: (subjectId: string, updates: { name?: string; color?: string; icon?: string }) => void;
  deleteSubject: (subjectId: string) => void;
  editChapter: (subjectId: string, chapterId: string, updates: { name?: string; description?: string }) => void;
  deleteChapter: (subjectId: string, chapterId: string) => void;
  editTopic: (topicId: string, updates: { name?: string; difficulty?: DifficultyLevel; weightage?: number; subtopics?: string[] }) => void;
  deleteTopic: (topicId: string) => void;
  addSubtopic: (topicId: string, subtopicName: string) => void;
  deleteSubtopic: (topicId: string, subtopicIndex: number) => void;

  logStudySession: (minutes: number) => void;
  resetToDemo: () => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

const SyllabusContext = createContext<SyllabusContextType | undefined>(undefined);

export const SyllabusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exams, setExams] = useState<Exam[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_exams');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_EXAMS;
  });

  const [profile, setProfile] = useState<UserProgressProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_profile');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_PROFILE;
  });

  const [achievements, setAchievements] = useState<AchievementBadge[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_achievements');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_ACHIEVEMENTS;
  });

  const [activityHistory, setActivityHistory] = useState<DailyActivity[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_activity');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_ACTIVITY_HISTORY;
  });

  const [revisions, setRevisions] = useState<RevisionRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_revisions');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    const initRevs: RevisionRecord[] = [];
    const ssc = INITIAL_EXAMS[0];
    ssc.subjects.forEach(s => {
      s.chapters.forEach(ch => {
        ch.topics.forEach(t => {
          if (t.status === 'completed' || t.status === 'revision_due' || t.status === 'weak') {
            const cDate = t.lastStudied || '2026-08-15';
            const rList = calculateInitialRevisions(t.id, t.name, s.id, s.name, ch.id, ch.name, cDate);
            initRevs.push(...rList);
          }
        });
      });
    });
    return initRevs;
  });

  useEffect(() => {
    localStorage.setItem('syllabus3d_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('syllabus3d_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('syllabus3d_achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('syllabus3d_activity', JSON.stringify(activityHistory));
  }, [activityHistory]);

  useEffect(() => {
    localStorage.setItem('syllabus3d_revisions', JSON.stringify(revisions));
  }, [revisions]);

  const currentExam = useMemo(() => {
    return exams.find(e => e.id === profile.selectedExamId) || exams[0];
  }, [exams, profile.selectedExamId]);

  const allTopics = useMemo(() => {
    if (!currentExam) return [];
    const list: Array<{ subjectName: string; subjectColor: string; chapterName: string; topic: Topic }> = [];
    currentExam.subjects.forEach(s => {
      s.chapters.forEach(ch => {
        ch.topics.forEach(t => {
          list.push({ subjectName: s.name, subjectColor: s.color, chapterName: ch.name, topic: t });
        });
      });
    });
    return list;
  }, [currentExam]);

  const weakTopics = useMemo(() => {
    return allTopics.filter(item => item.topic.isWeak || item.topic.status === 'weak' || (item.topic.accuracy > 0 && item.topic.accuracy < 60));
  }, [allTopics]);

  const dueRevisions = useMemo(() => {
    const today = getTodayDateString();
    return revisions.filter(r => !r.completedDate && r.scheduledDate <= today);
  }, [revisions]);

  const overallStats = useMemo((): OverallStats => {
    if (!currentExam) {
      return {
        totalTopics: 0,
        completedCount: 0,
        inProgressCount: 0,
        notStartedCount: 0,
        revisionDueCount: 0,
        weakCount: 0,
        completionPercentage: 0,
        weeklyCompletedCount: 0,
        weeklyTargetPercentage: 0,
        totalStudyHours: 0,
        averageAccuracy: 0
      };
    }

    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let revisionDue = 0;
    let weak = 0;
    let totalMins = 0;
    let totalAccuracy = 0;
    let accuracyCount = 0;

    allTopics.forEach(({ topic: t }) => {
      total++;
      totalMins += t.studyTimeMinutes;
      if (t.accuracy > 0) {
        totalAccuracy += t.accuracy;
        accuracyCount++;
      }
      if (t.status === 'completed') completed++;
      else if (t.status === 'in_progress') inProgress++;
      else if (t.status === 'revision_due') revisionDue++;
      else if (t.status === 'weak') weak++;
      else notStarted++;
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      totalTopics: total,
      completedCount: completed,
      inProgressCount: inProgress,
      notStartedCount: notStarted,
      revisionDueCount: revisionDue,
      weakCount: weak,
      completionPercentage: percent,
      weeklyCompletedCount: 7,
      weeklyTargetPercentage: 88,
      totalStudyHours: Math.round((totalMins / 60) * 10) / 10,
      averageAccuracy: accuracyCount > 0 ? Math.round(totalAccuracy / accuracyCount) : 78
    };
  }, [currentExam, allTopics]);

  const subjectStats = useMemo((): SubjectStats[] => {
    if (!currentExam) return [];
    return currentExam.subjects.map(s => {
      let total = 0;
      let completed = 0;
      let weak = 0;
      let totalMins = 0;
      let accuracySum = 0;
      let accuracyCount = 0;
      let lastDate: string | null = null;

      s.chapters.forEach(ch => {
        ch.topics.forEach(t => {
          total++;
          totalMins += t.studyTimeMinutes;
          if (t.status === 'completed') completed++;
          if (t.status === 'weak' || t.isWeak) weak++;
          if (t.accuracy > 0) {
            accuracySum += t.accuracy;
            accuracyCount++;
          }
          if (t.lastStudied) {
            if (!lastDate || t.lastStudied > lastDate) {
              lastDate = t.lastStudied;
            }
          }
        });
      });

      return {
        subjectId: s.id,
        subjectName: s.name,
        color: s.color,
        icon: s.icon,
        completedTopics: completed,
        totalTopics: total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgAccuracy: accuracyCount > 0 ? Math.round(accuracySum / accuracyCount) : 0,
        totalStudyHours: Math.round((totalMins / 60) * 10) / 10,
        weakCount: weak,
        lastStudied: lastDate
      };
    });
  }, [currentExam]);

  const updateProfile = (updates: Partial<UserProgressProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const setSelectedExamId = (examId: string) => {
    updateProfile({ selectedExamId: examId });
  };

  const updateTopicStatus = (topicId: string, status: TopicStatus, accuracy?: number) => {
    const today = getTodayDateString();
    let topicRef: Topic | null = null;
    let subjectRef: Subject | null = null;
    let chapterRef: Chapter | null = null;

    setExams(prevExams => {
      return prevExams.map(exam => ({
        ...exam,
        subjects: exam.subjects.map(subj => ({
          ...subj,
          chapters: subj.chapters.map(chap => ({
            ...chap,
            topics: chap.topics.map(top => {
              if (top.id === topicId) {
                topicRef = top;
                subjectRef = subj;
                chapterRef = chap;
                return {
                  ...top,
                  status,
                  completionPercentage: status === 'completed' || status === 'revision_due' ? 100 : status === 'in_progress' ? 50 : 0,
                  lastStudied: today,
                  accuracy: accuracy !== undefined ? accuracy : top.accuracy,
                  isWeak: status === 'weak' || (accuracy !== undefined && accuracy < 60)
                };
              }
              return top;
            })
          }))
        }))
      }));
    });

    if (status === 'completed') {
      soundManager.playCompleteChime();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      setProfile(prev => {
        const newXp = prev.xp + 40;
        const newLevel = Math.floor(newXp / 300) + 1;
        if (newLevel > prev.level) {
          soundManager.playLevelUp();
        }
        return { ...prev, xp: newXp, level: newLevel };
      });

      if (topicRef && subjectRef && chapterRef) {
        const newRevs = calculateInitialRevisions(
          (topicRef as Topic).id,
          (topicRef as Topic).name,
          (subjectRef as Subject).id,
          (subjectRef as Subject).name,
          (chapterRef as Chapter).id,
          (chapterRef as Chapter).name,
          today
        );
        setRevisions(prev => [...prev, ...newRevs]);
      }
    } else {
      soundManager.playClick();
    }
  };

  const updateTopicNotes = (topicId: string, notes: string) => {
    setExams(prevExams => prevExams.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(chap => ({
          ...chap,
          topics: chap.topics.map(top => (top.id === topicId ? { ...top, notes } : top))
        }))
      }))
    })));
  };

  const addTopicMistake = (topicId: string, desc: string, type: MistakeType, solution: string) => {
    const newMistake = {
      id: 'mist_' + Math.random().toString(36).substr(2, 9),
      topicId,
      questionDescription: desc,
      mistakeType: type,
      correctApproach: solution,
      dateLogged: getTodayDateString(),
      resolved: false
    };

    setExams(prevExams => prevExams.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(chap => ({
          ...chap,
          topics: chap.topics.map(top => (top.id === topicId ? {
            ...top,
            mistakes: [...top.mistakes, newMistake],
            isWeak: true
          } : top))
        }))
      }))
    })));
  };

  const resolveTopicMistake = (topicId: string, mistakeId: string) => {
    setExams(prevExams => prevExams.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(chap => ({
          ...chap,
          topics: chap.topics.map(top => (top.id === topicId ? {
            ...top,
            mistakes: top.mistakes.map(m => (m.id === mistakeId ? { ...m, resolved: true } : m))
          } : top))
        }))
      }))
    })));
  };

  const completeRevisionCard = (revisionId: string, grade: 'again' | 'hard' | 'good' | 'easy') => {
    const today = getTodayDateString();
    setRevisions(prev => prev.map(rev => {
      if (rev.id !== revisionId) return rev;
      const { nextRevisionDate, nextStage } = gradeRevision(rev, grade);
      return {
        ...rev,
        completedDate: today,
        status: 'completed',
        scheduledDate: nextRevisionDate,
        stage: nextStage,
        history: [...rev.history, { date: today, grade, nextIntervalDays: nextStage }]
      };
    }));
    soundManager.playCompleteChime();
  };

  const addTopic = (subjectId: string, chapterId: string, topicData: Partial<Topic> & { name: string }) => {
    const newT: Topic = {
      id: 'top_' + Math.random().toString(36).substr(2, 9),
      name: topicData.name,
      subtopics: topicData.subtopics || [],
      status: 'not_started' as TopicStatus,
      completionPercentage: 0,
      studyTimeMinutes: 0,
      lastStudied: null,
      nextRevision: null,
      accuracy: 0,
      mockAttempts: 0,
      difficulty: topicData.difficulty || 'Medium',
      isWeak: false,
      weightage: topicData.weightage || 3,
      notes: '',
      mistakes: []
    };

    setExams(prevExams => prevExams.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          chapters: subj.chapters.map(chap => {
            if (chap.id !== chapterId) return chap;
            return {
              ...chap,
              topics: [...chap.topics, newT]
            };
          })
        };
      })
    })));
  };

  const addCustomTopicWithHierarchy = (payload: CreateCustomTopicPayload) => {
    const newTopic: Topic = {
      id: 'top_' + Math.random().toString(36).substr(2, 9),
      name: payload.topicName.trim(),
      subtopics: payload.subtopics && payload.subtopics.length > 0 ? payload.subtopics : ['Core Concepts'],
      status: 'not_started' as TopicStatus,
      completionPercentage: 0,
      studyTimeMinutes: 0,
      lastStudied: null,
      nextRevision: null,
      accuracy: 0,
      mockAttempts: 0,
      difficulty: payload.difficulty || 'Medium',
      isWeak: false,
      weightage: payload.weightage || 3,
      notes: '',
      mistakes: []
    };

    setExams(prevExams => prevExams.map(exam => {
      if (exam.id !== profile.selectedExamId) return exam;

      let subjects = [...exam.subjects];

      // 1. Determine Subject
      let targetSubjectId = payload.subjectId;
      if (payload.isNewSubject || !targetSubjectId) {
        const newSubId = 'sub_' + Math.random().toString(36).substr(2, 9);
        targetSubjectId = newSubId;
        const newSubject: Subject = {
          id: newSubId,
          name: payload.newSubjectName?.trim() || 'Custom Subject',
          icon: payload.newSubjectIcon || 'BookOpen',
          color: payload.newSubjectColor || '#6366f1',
          totalChapters: 1,
          chapters: []
        };
        subjects.push(newSubject);
      }

      // 2. Determine Chapter inside Subject
      subjects = subjects.map(subj => {
        if (subj.id !== targetSubjectId) return subj;

        let chapters = [...subj.chapters];
        let targetChapterId = payload.chapterId;

        if (payload.isNewChapter || !targetChapterId || payload.isNewSubject) {
          const newChId = 'ch_' + Math.random().toString(36).substr(2, 9);
          targetChapterId = newChId;
          const newChapter: Chapter = {
            id: newChId,
            name: payload.newChapterName?.trim() || 'General Concepts',
            description: payload.newChapterDescription?.trim() || 'Custom study unit',
            topics: [newTopic]
          };
          chapters.push(newChapter);
        } else {
          chapters = chapters.map(ch => {
            if (ch.id !== targetChapterId) return ch;
            return {
              ...ch,
              topics: [...ch.topics, newTopic]
            };
          });
        }

        return {
          ...subj,
          totalChapters: chapters.length,
          chapters
        };
      });

      return {
        ...exam,
        subjects
      };
    }));

    soundManager.playClick();
  };

  // ==================== EDIT & DELETE METHODS ====================

  const editSubject = (subjectId: string, updates: { name?: string; color?: string; icon?: string }) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          name: updates.name !== undefined ? updates.name.trim() : subj.name,
          color: updates.color !== undefined ? updates.color : subj.color,
          icon: updates.icon !== undefined ? updates.icon : subj.icon
        };
      })
    })));
    soundManager.playClick();
  };

  const deleteSubject = (subjectId: string) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.filter(subj => subj.id !== subjectId)
    })));
    setRevisions(prev => prev.filter(r => r.subjectId !== subjectId));
    soundManager.playClick();
  };

  const editChapter = (subjectId: string, chapterId: string, updates: { name?: string; description?: string }) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          chapters: subj.chapters.map(ch => {
            if (ch.id !== chapterId) return ch;
            return {
              ...ch,
              name: updates.name !== undefined ? updates.name.trim() : ch.name,
              description: updates.description !== undefined ? updates.description.trim() : ch.description
            };
          })
        };
      })
    })));
    soundManager.playClick();
  };

  const deleteChapter = (subjectId: string, chapterId: string) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => {
        if (subj.id !== subjectId) return subj;
        const newChapters = subj.chapters.filter(ch => ch.id !== chapterId);
        return {
          ...subj,
          totalChapters: newChapters.length,
          chapters: newChapters
        };
      })
    })));
    setRevisions(prev => prev.filter(r => r.chapterId !== chapterId));
    soundManager.playClick();
  };

  const editTopic = (topicId: string, updates: { name?: string; difficulty?: DifficultyLevel; weightage?: number; subtopics?: string[] }) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            return {
              ...t,
              name: updates.name !== undefined ? updates.name.trim() : t.name,
              difficulty: updates.difficulty !== undefined ? updates.difficulty : t.difficulty,
              weightage: updates.weightage !== undefined ? updates.weightage : t.weightage,
              subtopics: updates.subtopics !== undefined ? updates.subtopics : t.subtopics
            };
          })
        }))
      }))
    })));
    setRevisions(prev => prev.map(r => r.topicId === topicId ? { ...r, topicName: updates.name?.trim() || r.topicName } : r));
    soundManager.playClick();
  };

  const deleteTopic = (topicId: string) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.filter(t => t.id !== topicId)
        }))
      }))
    })));
    setRevisions(prev => prev.filter(r => r.topicId !== topicId));
    soundManager.playClick();
  };

  const addSubtopic = (topicId: string, subtopicName: string) => {
    if (!subtopicName.trim()) return;
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            return {
              ...t,
              subtopics: [...t.subtopics, subtopicName.trim()]
            };
          })
        }))
      }))
    })));
    soundManager.playClick();
  };

  const deleteSubtopic = (topicId: string, subtopicIndex: number) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const updated = t.subtopics.filter((_, idx) => idx !== subtopicIndex);
            return {
              ...t,
              subtopics: updated
            };
          })
        }))
      }))
    })));
    soundManager.playClick();
  };

  const logStudySession = (minutes: number) => {
    const today = getTodayDateString();
    setActivityHistory(prev => {
      const existing = prev.find(a => a.date === today);
      if (existing) {
        return prev.map(a => (a.date === today ? { ...a, studyMinutes: a.studyMinutes + minutes } : a));
      }
      return [...prev, { date: today, studyMinutes: minutes, topicsCompleted: 0, revisionsCompleted: 0 }];
    });
  };

  const resetToDemo = () => {
    localStorage.removeItem('syllabus3d_exams');
    localStorage.removeItem('syllabus3d_profile');
    localStorage.removeItem('syllabus3d_achievements');
    localStorage.removeItem('syllabus3d_activity');
    localStorage.removeItem('syllabus3d_revisions');
    setExams(INITIAL_EXAMS);
    setProfile(INITIAL_PROFILE);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setActivityHistory(INITIAL_ACTIVITY_HISTORY);
  };

  const exportData = () => {
    return JSON.stringify({
      version: '1.0.0',
      exams,
      profile,
      achievements,
      activityHistory,
      revisions
    }, null, 2);
  };

  const importData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.exams) setExams(parsed.exams);
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.achievements) setAchievements(parsed.achievements);
      if (parsed.activityHistory) setActivityHistory(parsed.activityHistory);
      if (parsed.revisions) setRevisions(parsed.revisions);
      return true;
    } catch (err) {
      return false;
    }
  };

  return (
    <SyllabusContext.Provider
      value={{
        exams,
        currentExam,
        selectedExamId: profile.selectedExamId,
        setSelectedExamId,
        profile,
        updateProfile,
        achievements,
        activityHistory,
        overallStats,
        subjectStats,
        allTopics,
        weakTopics,
        revisions,
        dueRevisions,
        updateTopicStatus,
        updateTopicNotes,
        addTopicMistake,
        resolveTopicMistake,
        completeRevisionCard,
        addTopic,
        addCustomTopicWithHierarchy,
        editSubject,
        deleteSubject,
        editChapter,
        deleteChapter,
        editTopic,
        deleteTopic,
        addSubtopic,
        deleteSubtopic,
        logStudySession,
        resetToDemo,
        exportData,
        importData
      }}
    >
      {children}
    </SyllabusContext.Provider>
  );
};

export const useSyllabus = () => {
  const context = useContext(SyllabusContext);
  if (!context) {
    throw new Error('useSyllabus must be used within SyllabusProvider');
  }
  return context;
};
