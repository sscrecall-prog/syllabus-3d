import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Exam,
  Subject,
  Chapter,
  Topic,
  TopicStatus,
  TopicPdfAttachment,
  TopicLecture,
  TopicAudioMemo,
  TopicImageAttachment,
  TopicNoteItem,
  LectureTimestamp,
  MistakeType,
  MistakeRecord,
  RevisionRecord,
  AchievementBadge,
  UserProgressProfile,
  UserProfileItem,
  DailyActivity,
  OverallStats,
  SubjectStats,
  DifficultyLevel,
  PlannerTask,
  PlannerColumnStatus,
  TaskPriority,
  TaskCategory,
  ExternalPlatform,
  PlatformCategory,
  Top3Target,
  DailyReflection
} from '../types/syllabus';
import { INITIAL_EXAMS, INITIAL_ACHIEVEMENTS, INITIAL_PROFILE, INITIAL_ACTIVITY_HISTORY } from '../data/initialData';
import {
  calculateInitialRevisions,
  gradeRevision,
  getTodayDateString,
  generateAdaptiveRevisionRecords,
  syncAllRevisionsWithSyllabus,
  calculateAdaptiveIntervals,
  addDays
} from '../utils/spacedRepetition';
import {
  loadStoredTop3Targets,
  saveStoredTop3Targets,
  loadStoredReflections,
  saveStoredReflection,
  deleteStoredReflection
} from '../utils/dailyProductivityStorage';
import { soundManager } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';
import { storageManager, StorageHealthMetrics, FullAppSnapshot } from '../services/storageManager';

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

export interface CreateMultipleCustomTopicsPayload {
  isNewSubject: boolean;
  subjectId?: string;
  newSubjectName?: string;
  newSubjectColor?: string;
  newSubjectIcon?: string;

  isNewChapter: boolean;
  chapterId?: string;
  newChapterName?: string;
  newChapterDescription?: string;

  topics: Array<{
    name: string;
    difficulty?: DifficultyLevel;
    weightage?: number;
    subtopics?: string[];
  }>;
}

const INITIAL_PLANNER_TASKS: PlannerTask[] = [
  {
    id: 'plan_1',
    topicName: 'Percentage & Fractional Conversions',
    subjectName: 'Quantitative Aptitude',
    subjectColor: '#3b82f6',
    status: 'today',
    scheduledDate: getTodayDateString(),
    estimatedMinutes: 45,
    isCustom: false,
    priority: 'high',
    category: 'concept'
  },
  {
    id: 'plan_2',
    topicName: 'Syllogism & Venn Diagrams',
    subjectName: 'Reasoning Ability',
    subjectColor: '#8b5cf6',
    status: 'today',
    scheduledDate: getTodayDateString(),
    estimatedMinutes: 30,
    isCustom: false,
    priority: 'medium',
    category: 'practice'
  },
  {
    id: 'plan_3',
    topicName: 'Error Spotting & Subject-Verb Rules',
    subjectName: 'English Language',
    subjectColor: '#10b981',
    status: 'in_progress',
    scheduledDate: getTodayDateString(),
    estimatedMinutes: 40,
    isCustom: false,
    priority: 'high',
    category: 'revision'
  },
  {
    id: 'plan_4',
    topicName: 'Full Mock Test Analysis & Mistake Log',
    subjectName: 'Custom Target',
    subjectColor: '#ec4899',
    status: 'upcoming',
    scheduledDate: getTodayDateString(),
    estimatedMinutes: 60,
    isCustom: true,
    priority: 'high',
    category: 'mock'
  }
];

const INITIAL_PLATFORMS: ExternalPlatform[] = [
  {
    id: 'plat_pw',
    name: 'Physics Wallah (PW)',
    url: 'https://www.pw.live/study/batches',
    category: 'course',
    description: 'Live & recorded batches, DPPs, and comprehensive lecture notes',
    color: '#5A4FCF',
    icon: '⚡',
    loginHint: 'PW Mobile / Email',
    notes: 'Access Lakshya, Shaurya, or Parakram batch video lectures & DPP PDFs',
    pinned: true,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_careerwill',
    name: 'Careerwill',
    url: 'https://careerwill.com/',
    category: 'course',
    description: 'SSC, Banking & State exams video batches by top educators',
    color: '#E11D48',
    icon: '🎓',
    loginHint: 'Careerwill Registered Phone',
    notes: 'Maths Special, Reasoning, English & GS live classes',
    pinned: true,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_testbook',
    name: 'Testbook Pass & Mock Series',
    url: 'https://testbook.com/test-series',
    category: 'test_series',
    description: 'All India Live Mocks, Previous Year Papers & Percentile Analysis',
    color: '#0284C7',
    icon: '📝',
    loginHint: 'Testbook Account Email',
    notes: 'Attempt full-length Tier 1 & Tier 2 mocks, log errors directly in Mistake Journal',
    pinned: true,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_oliveboard',
    name: 'Oliveboard Mocks & Tests',
    url: 'https://www.oliveboard.in/',
    category: 'test_series',
    description: 'High-difficulty mock tests, sectional tests & topic quizzes',
    color: '#16A34A',
    icon: '🎯',
    loginHint: 'Oliveboard User Email',
    notes: 'Hard-level mock tests to test speed and accuracy under pressure',
    pinned: true,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_unacademy',
    name: 'Unacademy Plus',
    url: 'https://unacademy.com/',
    category: 'course',
    description: 'Live interactive classes, doubt solving, and structured syllabus courses',
    color: '#08BD80',
    icon: '🏛️',
    loginHint: 'Unacademy Plus Account',
    notes: 'Topic-wise live sessions and recorded educator courses',
    pinned: false,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_khan_academy',
    name: 'Khan Academy (Foundations)',
    url: 'https://www.khanacademy.org/',
    category: 'course',
    description: 'Master math, algebra, geometry & science concepts with mastery quizzes',
    color: '#14BF96',
    icon: '📖',
    loginHint: 'Khan Academy Account',
    notes: 'Free interactive practice for fundamental arithmetic & geometry',
    pinned: false,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'plat_rbe',
    name: 'RBE (Revolution by Education)',
    url: 'https://rbeeducation.com/',
    category: 'test_series',
    description: 'Exam survey analysis, rank predictor, and sectional mock tests',
    color: '#F59E0B',
    icon: '📊',
    loginHint: 'RBE Portal Login',
    notes: 'Check cut-off trends, normalization shifts, and free exam mocks',
    pinned: false,
    createdAt: '2026-08-01T00:00:00.000Z'
  }
];

interface SyllabusContextType {
  exams: Exam[];
  currentExam: Exam | undefined;
  selectedExamId: string;
  setSelectedExamId: (id: string) => void;
  updateCurrentExamDetails: (updates: { name?: string; examDate?: string; targetYear?: number }) => void;
  profile: UserProgressProfile;
  updateProfile: (updates: Partial<UserProgressProfile>) => void;
  profiles: UserProfileItem[];
  activeProfileId: string;
  createProfile: (profileData: {
    name: string;
    avatarUrl?: string;
    avatarEmoji?: string;
    avatarColor?: string;
    targetExamId: string;
    targetExamDate?: string;
    cloneCurrentSyllabus?: boolean;
  }) => string;
  switchProfile: (profileId: string) => void;
  updateProfileById: (profileId: string, updates: Partial<UserProfileItem>) => void;
  deleteProfile: (profileId: string) => boolean;
  achievements: AchievementBadge[];
  activityHistory: DailyActivity[];
  overallStats: OverallStats;
  subjectStats: SubjectStats[];
  allTopics: Array<{ subjectName: string; subjectColor: string; chapterName: string; topic: Topic }>;
  weakTopics: Array<{ subjectName: string; subjectColor: string; chapterName: string; topic: Topic }>;
  revisions: RevisionRecord[];
  dueRevisions: RevisionRecord[];
  resyncAllRevisions: () => void;

  // Planner
  plannerTasks: PlannerTask[];
  addPlannerTask: (task: Omit<PlannerTask, 'id'>) => void;
  togglePlannerTask: (taskId: string) => void;
  movePlannerTask: (taskId: string, newStatus: PlannerColumnStatus) => void;
  deletePlannerTask: (taskId: string) => void;
  clearCompletedPlannerTasks: () => void;

  // Study Station / External Platforms
  platforms: ExternalPlatform[];
  addPlatform: (platform: Omit<ExternalPlatform, 'id' | 'createdAt'>) => void;
  editPlatform: (platformId: string, updates: Partial<ExternalPlatform>) => void;
  deletePlatform: (platformId: string) => void;
  togglePinPlatform: (platformId: string) => void;
  recordPlatformAccess: (platformId: string) => void;

  // Top 3 Non-Negotiable Targets
  top3Targets: Top3Target[];
  updateTop3Target: (targetId: string, text: string, meta?: { topicId?: string; subjectName?: string; subjectColor?: string }) => void;
  toggleTop3Target: (targetId: string) => void;
  clearTop3Target: (targetId: string) => void;

  // Daily Evening Reflections
  reflectionsHistory: DailyReflection[];
  saveDailyReflection: (reflection: Omit<DailyReflection, 'id' | 'timestamp'>) => void;
  deleteDailyReflection: (id: string) => void;

  updateTopicStatus: (topicId: string, status: TopicStatus, accuracy?: number) => void;
  updateTopicNotes: (topicId: string, notes: string, noteItems?: TopicNoteItem[]) => void;
  addTopicMistake: (topicId: string, descOrPayload: string | Partial<MistakeRecord>, type?: MistakeType, solution?: string) => void;
  resolveTopicMistake: (topicId: string, mistakeId: string) => void;
  deleteTopicMistake?: (topicId: string, mistakeId: string) => void;
  editTopicMistake?: (topicId: string, mistakeId: string, updates: Partial<MistakeRecord>) => void;
  completeRevisionCard: (revisionId: string, grade: 'again' | 'hard' | 'good' | 'easy') => void;
  addTopic: (subjectId: string, chapterId: string, topicData: Partial<Topic> & { name: string }) => void;
  addCustomTopicWithHierarchy: (payload: CreateCustomTopicPayload) => void;
  addMultipleCustomTopicsWithHierarchy: (payload: CreateMultipleCustomTopicsPayload) => void;

  addSubject: (subjectData: { name: string; color?: string; icon?: string; initialChapterName?: string }) => void;
  editSubject: (subjectId: string, updates: { name?: string; color?: string; icon?: string }) => void;
  deleteSubject: (subjectId: string) => void;
  addChapter: (subjectId: string, chapterData: { name: string; description?: string }) => void;
  editChapter: (subjectId: string, chapterId: string, updates: { name?: string; description?: string }) => void;
  deleteChapter: (subjectId: string, chapterId: string) => void;
  editTopic: (topicId: string, updates: { name?: string; difficulty?: DifficultyLevel; weightage?: number; subtopics?: string[]; accuracy?: number; studyTimeMinutes?: number }) => void;
  deleteTopic: (topicId: string) => void;
  addSubtopic: (topicId: string, subtopicName: string) => void;
  addMultipleSubtopics: (topicId: string, subtopicsToAdd: string[]) => void;
  deleteSubtopic: (topicId: string, subtopicIndex: number) => void;
  addTopicPdfAttachment?: (topicId: string, attachment: TopicPdfAttachment) => void;
  deleteTopicPdfAttachment?: (topicId: string, attachmentId: string) => void;
  addTopicLecture?: (topicId: string, lecture: { title: string; youtubeUrl: string; duration?: string; notes?: string }) => void;
  deleteTopicLecture?: (topicId: string, lectureId: string) => void;
  addLectureTimestamp?: (topicId: string, lectureId: string, timestamp: { timeSeconds: number; timeLabel: string; title: string }) => void;
  deleteLectureTimestamp?: (topicId: string, lectureId: string, timestampId: string) => void;
  addTopicAudioMemo?: (topicId: string, memo: { title: string; durationSeconds: number; storageKey?: string; audioDataUrl?: string; transcript?: string }) => void;
  deleteTopicAudioMemo?: (topicId: string, memoId: string) => void;
  addTopicImageAttachment?: (topicId: string, image: { title?: string; dataUrl: string; fileSize?: number }) => void;
  deleteTopicImageAttachment?: (topicId: string, imageId: string) => void;

  logStudySession: (minutes: number, topicId?: string) => void;
  updateTopicMetrics?: (topicId: string, updates: { accuracy?: number; studyTimeMinutes?: number; addMinutes?: number }) => void;
  resetToDemo: () => void;
  clearAllDemoData: () => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  restoreSafetySnapshot: () => Promise<boolean>;
  getStorageMetrics: () => StorageHealthMetrics;
  lastSavedAt: string;
  isAutoSaving: boolean;
}

const SyllabusContext = createContext<SyllabusContextType | undefined>(undefined);

const loadInitialActiveDataset = () => {
  if (typeof window === 'undefined') return null;
  const activeId = localStorage.getItem('syllabus3d_active_profile_id') || 'profile_default';
  if (activeId === 'profile_default') return null;
  try {
    const raw = localStorage.getItem(`syllabus3d_profile_data_${activeId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

export const SyllabusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const initialActiveDataset = useMemo(() => loadInitialActiveDataset(), []);

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_active_profile_id');
      if (saved) return saved;
    }
    return 'profile_default';
  });

  const [profiles, setProfiles] = useState<UserProfileItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_profiles');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
      const savedProf = localStorage.getItem('syllabus3d_profile');
      if (savedProf) {
        try {
          const p = JSON.parse(savedProf);
          return [{
            id: 'profile_default',
            name: p.name || INITIAL_PROFILE.name,
            avatarUrl: p.avatarUrl,
            avatarEmoji: p.avatarEmoji || '🦁',
            avatarColor: p.avatarColor || 'from-amber-500 to-orange-600',
            targetExamId: p.selectedExamId || INITIAL_PROFILE.selectedExamId,
            targetExamDate: p.targetExamDate || INITIAL_PROFILE.targetExamDate,
            currentStreak: p.currentStreak || INITIAL_PROFILE.currentStreak,
            longestStreak: p.longestStreak || INITIAL_PROFILE.longestStreak,
            level: p.level || INITIAL_PROFILE.level,
            levelTitle: p.levelTitle || INITIAL_PROFILE.levelTitle,
            xp: p.xp || INITIAL_PROFILE.xp,
            soundEnabled: p.soundEnabled ?? true,
            createdAt: '2026-08-01T00:00:00.000Z',
            lastActiveAt: new Date().toISOString()
          }];
        } catch (e) {}
      }
    }
    return [{
      id: 'profile_default',
      name: INITIAL_PROFILE.name,
      avatarEmoji: '🦁',
      avatarColor: 'from-amber-500 to-orange-600',
      targetExamId: INITIAL_PROFILE.selectedExamId,
      targetExamDate: INITIAL_PROFILE.targetExamDate,
      currentStreak: INITIAL_PROFILE.currentStreak,
      longestStreak: INITIAL_PROFILE.longestStreak,
      level: INITIAL_PROFILE.level,
      levelTitle: INITIAL_PROFILE.levelTitle,
      xp: INITIAL_PROFILE.xp,
      soundEnabled: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      lastActiveAt: new Date().toISOString()
    }];
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    if (initialActiveDataset?.exams) return initialActiveDataset.exams;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_exams');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_EXAMS;
  });

  const [profile, setProfile] = useState<UserProgressProfile>(() => {
    if (initialActiveDataset?.profile) return initialActiveDataset.profile;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_profile');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_PROFILE;
  });

  const [achievements, setAchievements] = useState<AchievementBadge[]>(() => {
    if (initialActiveDataset?.achievements) return initialActiveDataset.achievements;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_achievements');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_ACHIEVEMENTS;
  });

  const [activityHistory, setActivityHistory] = useState<DailyActivity[]>(() => {
    if (initialActiveDataset?.activityHistory) return initialActiveDataset.activityHistory;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_activity');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_ACTIVITY_HISTORY;
  });

  const [revisions, setRevisions] = useState<RevisionRecord[]>(() => {
    if (initialActiveDataset?.revisions) return initialActiveDataset.revisions;
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

  const [plannerTasks, setPlannerTasks] = useState<PlannerTask[]>(() => {
    if (initialActiveDataset?.plannerTasks) return initialActiveDataset.plannerTasks;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_planner');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_PLANNER_TASKS;
  });

  // Sync profile name with logged-in user
  useEffect(() => {
    if (user?.name && profile.name !== user.name) {
      setProfile(p => ({ ...p, name: user.name }));
    }
  }, [user]);

  // Debounced Batch Persistence & Quota Protection
  useEffect(() => {
    if (activeProfileId === 'profile_default') {
      storageManager.debouncedSave('syllabus3d_exams', exams);
    }
  }, [exams, activeProfileId]);

  useEffect(() => {
    if (activeProfileId === 'profile_default') {
      storageManager.debouncedSave('syllabus3d_profile', profile);
    }
  }, [profile, activeProfileId]);

  useEffect(() => {
    if (activeProfileId === 'profile_default') {
      storageManager.debouncedSave('syllabus3d_achievements', achievements);
    }
  }, [achievements, activeProfileId]);

  useEffect(() => {
    if (activeProfileId === 'profile_default') {
      storageManager.debouncedSave('syllabus3d_activity', activityHistory);
    }
  }, [activityHistory, activeProfileId]);

  useEffect(() => {
    if (activeProfileId === 'profile_default') {
      storageManager.debouncedSave('syllabus3d_revisions', revisions);
    }
  }, [revisions, activeProfileId]);

  useEffect(() => {
    if (activeProfileId === 'profile_default') {
      storageManager.debouncedSave('syllabus3d_planner', plannerTasks);
    }
  }, [plannerTasks, activeProfileId]);

  const [platforms, setPlatforms] = useState<ExternalPlatform[]>(() => {
    if (initialActiveDataset?.platforms) return initialActiveDataset.platforms;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syllabus3d_platforms');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return INITIAL_PLATFORMS;
  });

  useEffect(() => {
    if (activeProfileId === 'profile_default') {
      storageManager.debouncedSave('syllabus3d_platforms', platforms);
    }
  }, [platforms, activeProfileId]);

  // ──── TOP 3 NON-NEGOTIABLE TARGETS & DAILY REFLECTION STATE ────
  const [top3Targets, setTop3Targets] = useState<Top3Target[]>(() => {
    if (initialActiveDataset?.top3Targets) return initialActiveDataset.top3Targets;
    return loadStoredTop3Targets();
  });
  const [reflectionsHistory, setReflectionsHistory] = useState<DailyReflection[]>(() => {
    if (initialActiveDataset?.reflectionsHistory) return initialActiveDataset.reflectionsHistory;
    return loadStoredReflections();
  });

  useEffect(() => {
    if (activeProfileId === 'profile_default') {
      saveStoredTop3Targets(top3Targets);
    }
  }, [top3Targets, activeProfileId]);

  // Save active profile's scoped dataset when it's not profile_default
  useEffect(() => {
    if (activeProfileId && activeProfileId !== 'profile_default') {
      const activeData = {
        exams,
        profile,
        achievements,
        activityHistory,
        revisions,
        plannerTasks,
        platforms,
        top3Targets,
        reflectionsHistory
      };
      storageManager.debouncedSave(`syllabus3d_profile_data_${activeProfileId}`, activeData);
    }
  }, [activeProfileId, exams, profile, achievements, activityHistory, revisions, plannerTasks, platforms, top3Targets, reflectionsHistory]);

  // Persist profiles list
  useEffect(() => {
    storageManager.debouncedSave('syllabus3d_profiles', profiles);
  }, [profiles]);

  // Keep active profile in profiles list synchronized with profile state
  useEffect(() => {
    setProfiles(prev => {
      const idx = prev.findIndex(p => p.id === activeProfileId);
      if (idx === -1) return prev;
      const cur = prev[idx];
      if (
        cur.name === profile.name &&
        cur.avatarUrl === profile.avatarUrl &&
        cur.avatarEmoji === profile.avatarEmoji &&
        cur.avatarColor === profile.avatarColor &&
        cur.currentStreak === profile.currentStreak &&
        cur.longestStreak === profile.longestStreak &&
        cur.level === profile.level &&
        cur.xp === profile.xp &&
        cur.targetExamId === profile.selectedExamId &&
        cur.targetExamDate === profile.targetExamDate
      ) {
        return prev;
      }
      const updated = [...prev];
      updated[idx] = {
        ...cur,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        avatarEmoji: profile.avatarEmoji,
        avatarColor: profile.avatarColor,
        currentStreak: profile.currentStreak,
        longestStreak: profile.longestStreak,
        level: profile.level,
        levelTitle: profile.levelTitle,
        xp: profile.xp,
        targetExamId: profile.selectedExamId,
        targetExamDate: profile.targetExamDate,
        lastActiveAt: new Date().toISOString()
      };
      return updated;
    });
  }, [profile, activeProfileId]);

  // ──── LIVE AUTO-SAVE SYNC STATUS ────
  const [lastSavedAt, setLastSavedAt] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);

  const triggerAutoSave = () => {
    setIsAutoSaving(true);
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setTimeout(() => setIsAutoSaving(false), 900);
  };

  // Wire debounced auto-save notification
  useEffect(() => {
    const unsub = storageManager.onAutoSave(() => {
      triggerAutoSave();
    });
    return unsub;
  }, []);

  // Automated Rolling Safety Snapshot to IndexedDB (Idle 4.5s debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      storageManager.createSafetySnapshot({
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        exams,
        profile,
        achievements,
        activityHistory,
        revisions,
        plannerTasks,
        platforms,
        top3Targets,
        reflectionsHistory
      }).catch(() => {});
    }, 4500);

    return () => clearTimeout(timer);
  }, [exams, profile, achievements, activityHistory, revisions, plannerTasks, platforms, top3Targets, reflectionsHistory]);

  const currentExam = useMemo(() => {
    if (exams.length === 0) return undefined;
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
      averageAccuracy: accuracyCount > 0 ? Math.round(totalAccuracy / accuracyCount) : 0
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

  const updateCurrentExamDetails = (updates: { name?: string; examDate?: string; targetYear?: number }) => {
    if (!currentExam) return;
    setExams(prev => prev.map(e => {
      if (e.id !== currentExam.id) return e;
      return {
        ...e,
        name: updates.name !== undefined ? updates.name : e.name,
        examDate: updates.examDate !== undefined ? updates.examDate : e.examDate,
        targetYear: updates.targetYear !== undefined ? updates.targetYear : e.targetYear
      };
    }));
    if (updates.examDate) {
      updateProfile({ targetExamDate: updates.examDate });
    }
  };

  // Planner Methods
  const addPlannerTask = (taskData: Omit<PlannerTask, 'id'>) => {
    const newTask: PlannerTask = {
      ...taskData,
      id: 'task_' + Math.random().toString(36).substr(2, 9)
    };
    setPlannerTasks(prev => [newTask, ...prev]);
    soundManager.playClick();
  };

  const togglePlannerTask = (taskId: string) => {
    setPlannerTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const isComp = t.status === 'completed';
      const nextStatus: PlannerColumnStatus = isComp ? 'today' : 'completed';
      if (!isComp) {
        soundManager.playCompleteChime();
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
      } else {
        soundManager.playClick();
      }
      return {
        ...t,
        status: nextStatus,
        completedAt: !isComp ? getTodayDateString() : undefined
      };
    }));
  };

  const movePlannerTask = (taskId: string, newStatus: PlannerColumnStatus) => {
    setPlannerTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      if (newStatus === 'completed') {
        soundManager.playCompleteChime();
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
      } else {
        soundManager.playClick();
      }
      return {
        ...t,
        status: newStatus,
        completedAt: newStatus === 'completed' ? getTodayDateString() : undefined
      };
    }));
  };

  const deletePlannerTask = (taskId: string) => {
    setPlannerTasks(prev => prev.filter(t => t.id !== taskId));
    soundManager.playClick();
  };

  const clearCompletedPlannerTasks = () => {
    setPlannerTasks(prev => prev.filter(t => t.status !== 'completed'));
    soundManager.playClick();
  };

  // Study Station / External Platforms CRUD
  const addPlatform = (platformData: Omit<ExternalPlatform, 'id' | 'createdAt'>) => {
    const newPlatform: ExternalPlatform = {
      ...platformData,
      id: `plat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setPlatforms(prev => [newPlatform, ...prev]);
    soundManager.playCompleteChime();
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  const editPlatform = (platformId: string, updates: Partial<ExternalPlatform>) => {
    setPlatforms(prev => prev.map(p => p.id === platformId ? { ...p, ...updates } : p));
    soundManager.playClick();
  };

  const deletePlatform = (platformId: string) => {
    setPlatforms(prev => prev.filter(p => p.id !== platformId));
    soundManager.playClick();
  };

  const togglePinPlatform = (platformId: string) => {
    setPlatforms(prev => prev.map(p => p.id === platformId ? { ...p, pinned: !p.pinned } : p));
    soundManager.playClick();
  };

  const recordPlatformAccess = (platformId: string) => {
    setPlatforms(prev => prev.map(p => p.id === platformId ? { ...p, lastAccessedAt: new Date().toISOString() } : p));
  };


  const updateTopicStatus = (topicId: string, status: TopicStatus, accuracy?: number) => {
    const today = getTodayDateString();

    // 1. Synchronously locate topic, subject, and chapter from current exams state
    let foundTopic: Topic | null = null;
    let foundSubject: Subject | null = null;
    let foundChapter: Chapter | null = null;

    for (const exam of exams) {
      for (const subj of exam.subjects) {
        for (const chap of subj.chapters) {
          const top = chap.topics.find(t => t.id === topicId);
          if (top) {
            foundTopic = top;
            foundSubject = subj;
            foundChapter = chap;
            break;
          }
        }
        if (foundTopic) break;
      }
      if (foundTopic) break;
    }

    const effectiveAcc = accuracy !== undefined ? accuracy : (foundTopic?.accuracy || 0);
    const isTopicWeak = status === 'weak' || (effectiveAcc > 0 && effectiveAcc < 60);

    let nextRevisionDate: string | null = null;

    // 2. Reactively manage Spaced Revision records based on the new status
    if (foundTopic && foundSubject && foundChapter) {
      if (status === 'completed') {
        const newRevs = generateAdaptiveRevisionRecords({
          topicId: foundTopic.id,
          topicName: foundTopic.name,
          subjectId: foundSubject.id,
          subjectName: foundSubject.name,
          chapterId: foundChapter.id,
          chapterName: foundChapter.name,
          difficulty: foundTopic.difficulty,
          accuracy: effectiveAcc,
          isWeak: isTopicWeak,
          completionDate: today
        });
        nextRevisionDate = newRevs[0]?.scheduledDate || addDays(today, 1);

        // Replace any uncompleted/pending revisions for this topic with the fresh adaptive schedule
        setRevisions(prev => [
          ...prev.filter(r => r.topicId !== topicId || r.completedDate !== null),
          ...newRevs
        ]);
      } else if (status === 'revision_due') {
        const newRevs = generateAdaptiveRevisionRecords({
          topicId: foundTopic.id,
          topicName: foundTopic.name,
          subjectId: foundSubject.id,
          subjectName: foundSubject.name,
          chapterId: foundChapter.id,
          chapterName: foundChapter.name,
          difficulty: foundTopic.difficulty,
          accuracy: effectiveAcc,
          isWeak: isTopicWeak,
          completionDate: today
        });
        // Immediately schedule Stage 1 for Today
        if (newRevs[0]) newRevs[0].scheduledDate = today;
        nextRevisionDate = today;

        setRevisions(prev => [
          ...prev.filter(r => r.topicId !== topicId || r.completedDate !== null),
          ...newRevs
        ]);
      } else if (status === 'weak') {
        // High-priority retention curve for weak topics
        const newRevs = generateAdaptiveRevisionRecords({
          topicId: foundTopic.id,
          topicName: foundTopic.name,
          subjectId: foundSubject.id,
          subjectName: foundSubject.name,
          chapterId: foundChapter.id,
          chapterName: foundChapter.name,
          difficulty: 'Hard',
          accuracy: effectiveAcc > 0 ? Math.min(50, effectiveAcc) : 45,
          isWeak: true,
          completionDate: today
        });
        if (newRevs[0]) newRevs[0].scheduledDate = today;
        nextRevisionDate = today;

        setRevisions(prev => [
          ...prev.filter(r => r.topicId !== topicId || r.completedDate !== null),
          ...newRevs
        ]);
      } else {
        // Status is 'not_started' or 'in_progress': Prune uncompleted/pending revisions to prevent ghost cards
        setRevisions(prev => prev.filter(r => r.topicId !== topicId || r.completedDate !== null));
        nextRevisionDate = null;
      }
    }

    // 3. Update exams tree
    setExams(prevExams => prevExams.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(chap => ({
          ...chap,
          topics: chap.topics.map(top => {
            if (top.id === topicId) {
              return {
                ...top,
                status,
                completionPercentage: status === 'completed' || status === 'revision_due' ? 100 : status === 'in_progress' ? 50 : 0,
                lastStudied: status === 'not_started' ? null : today,
                nextRevision: nextRevisionDate,
                accuracy: effectiveAcc,
                isWeak: isTopicWeak
              };
            }
            return top;
          })
        }))
      }))
    })));

    // 4. Rewards, Audio & Haptic Feedback
    if (status === 'completed') {
      soundManager.playCompleteChime();
      haptics.success();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      setProfile(prev => {
        const newXp = prev.xp + 40;
        const newLevel = Math.floor(newXp / 300) + 1;
        if (newLevel > prev.level) {
          soundManager.playLevelUp();
        }
        return { ...prev, xp: newXp, level: newLevel };
      });
    } else {
      soundManager.playClick();
    }
  };

  const updateTopicNotes = (topicId: string, notes: string, noteItems?: TopicNoteItem[]) => {
    setExams(prevExams => prevExams.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(chap => ({
          ...chap,
          topics: chap.topics.map(top => (top.id === topicId ? {
            ...top,
            notes,
            noteItems: noteItems !== undefined ? noteItems : top.noteItems
          } : top))
        }))
      }))
    })));
  };

  const addTopicMistake = (
    topicId: string,
    descOrPayload: string | Partial<MistakeRecord>,
    type: MistakeType = 'conceptual',
    solution: string = ''
  ) => {
    let newMistake: MistakeRecord;
    if (typeof descOrPayload === 'object') {
      newMistake = {
        id: 'mist_' + Math.random().toString(36).substr(2, 9),
        topicId,
        questionDescription: descOrPayload.questionDescription || '',
        mistakeType: descOrPayload.mistakeType || 'conceptual',
        correctApproach: descOrPayload.correctApproach || '',
        dateLogged: getTodayDateString(),
        resolved: false,
        wrongLogic: descOrPayload.wrongLogic || '',
        examinerTrap: descOrPayload.examinerTrap || '',
        goldenRule: descOrPayload.goldenRule || '',
        severity: descOrPayload.severity || 'medium',
        mockSource: descOrPayload.mockSource || ''
      };
    } else {
      newMistake = {
        id: 'mist_' + Math.random().toString(36).substr(2, 9),
        topicId,
        questionDescription: descOrPayload,
        mistakeType: type,
        correctApproach: solution,
        dateLogged: getTodayDateString(),
        resolved: false
      };
    }

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

  const deleteTopicMistake = (topicId: string, mistakeId: string) => {
    setExams(prevExams => prevExams.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(chap => ({
          ...chap,
          topics: chap.topics.map(top => (top.id === topicId ? {
            ...top,
            mistakes: top.mistakes.filter(m => m.id !== mistakeId)
          } : top))
        }))
      }))
    })));
  };

  const editTopicMistake = (topicId: string, mistakeId: string, updates: Partial<MistakeRecord>) => {
    setExams(prevExams => prevExams.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(chap => ({
          ...chap,
          topics: chap.topics.map(top => (top.id === topicId ? {
            ...top,
            mistakes: top.mistakes.map(m => (m.id === mistakeId ? { ...m, ...updates } : m))
          } : top))
        }))
      }))
    })));
  };

  const completeRevisionCard = (revisionId: string, grade: 'again' | 'hard' | 'good' | 'easy') => {
    const today = getTodayDateString();
    let updatedTopicId: string | null = null;
    let nextDate: string | null = null;

    setRevisions(prev => prev.map(rev => {
      if (rev.id !== revisionId) return rev;
      updatedTopicId = rev.topicId;
      const { nextRevisionDate, nextStage } = gradeRevision(rev, grade);
      nextDate = nextRevisionDate;

      const isPermanentlyMastered = nextStage >= 4 && grade !== 'again';
      return {
        ...rev,
        completedDate: isPermanentlyMastered ? today : null,
        scheduledDate: nextRevisionDate,
        stage: nextStage,
        history: [
          ...(rev.history || []),
          { date: today, grade, nextIntervalDays: nextStage }
        ]
      };
    }));

    // Update corresponding topic in exams tree
    if (updatedTopicId && nextDate) {
      setExams(prevExams => prevExams.map(exam => ({
        ...exam,
        subjects: exam.subjects.map(subj => ({
          ...subj,
          chapters: subj.chapters.map(chap => ({
            ...chap,
            topics: chap.topics.map(top => {
              if (top.id === updatedTopicId) {
                return {
                  ...top,
                  lastStudied: today,
                  nextRevision: nextDate,
                  status: (top.status === 'revision_due' ? 'completed' : top.status) as TopicStatus
                };
              }
              return top;
            })
          }))
        }))
      })));
    }

    // Record revision in activityHistory for today
    setActivityHistory(prev => {
      const existingToday = prev.find(a => a.date === today);
      if (existingToday) {
        return prev.map(a =>
          a.date === today
            ? { ...a, revisionsCompleted: (a.revisionsCompleted || 0) + 1, studyMinutes: a.studyMinutes + 10 }
            : a
        );
      }
      return [...prev, { date: today, studyMinutes: 15, topicsCompleted: 0, revisionsCompleted: 1 }];
    });

    // Reward XP
    setProfile(prev => ({ ...prev, xp: prev.xp + 25 }));
    soundManager.playCompleteChime();
    haptics.success();
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
    addMultipleCustomTopicsWithHierarchy({
      isNewSubject: payload.isNewSubject,
      subjectId: payload.subjectId,
      newSubjectName: payload.newSubjectName,
      newSubjectColor: payload.newSubjectColor,
      newSubjectIcon: payload.newSubjectIcon,
      isNewChapter: payload.isNewChapter,
      chapterId: payload.chapterId,
      newChapterName: payload.newChapterName,
      newChapterDescription: payload.newChapterDescription,
      topics: [{
        name: payload.topicName,
        difficulty: payload.difficulty,
        weightage: payload.weightage,
        subtopics: payload.subtopics
      }]
    });
  };

  const addMultipleCustomTopicsWithHierarchy = (payload: CreateMultipleCustomTopicsPayload) => {
    if (!payload.topics || payload.topics.length === 0) return;

    const newTopicObjects: Topic[] = payload.topics.map(t => ({
      id: 'top_' + Math.random().toString(36).substr(2, 9),
      name: t.name.trim(),
      subtopics: t.subtopics && t.subtopics.length > 0 ? t.subtopics : ['Core Concepts'],
      status: 'not_started' as TopicStatus,
      completionPercentage: 0,
      studyTimeMinutes: 0,
      lastStudied: null,
      nextRevision: null,
      accuracy: 0,
      mockAttempts: 0,
      difficulty: t.difficulty || 'Medium',
      isWeak: false,
      weightage: t.weightage || 3,
      notes: '',
      mistakes: []
    }));

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
          color: payload.newSubjectColor || '#D4AF37',
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
            topics: newTopicObjects
          };
          chapters.push(newChapter);
        } else {
          chapters = chapters.map(ch => {
            if (ch.id !== targetChapterId) return ch;
            return {
              ...ch,
              topics: [...ch.topics, ...newTopicObjects]
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

    soundManager.playCompleteChime();
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.8 } });
  };

  const addSubject = (subjectData: { name: string; color?: string; icon?: string; initialChapterName?: string }) => {
    const subName = subjectData.name.trim();
    if (!subName) return;
    const newSubId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newChId = 'ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newChapter: Chapter = {
      id: newChId,
      name: subjectData.initialChapterName?.trim() || 'General Concepts',
      description: 'Core foundation unit',
      topics: []
    };
    const newSubject: Subject = {
      id: newSubId,
      name: subName,
      icon: subjectData.icon || 'BookOpen',
      color: subjectData.color || '#3b82f6',
      totalChapters: 1,
      chapters: [newChapter]
    };

    setExams(prev => prev.map(exam => {
      if (exam.id !== profile.selectedExamId) return exam;
      return {
        ...exam,
        subjects: [...exam.subjects, newSubject]
      };
    }));

    soundManager.playCompleteChime();
  };

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
    if (updates.name) {
      const newName = updates.name.trim();
      setRevisions(prev => prev.map(r => r.subjectId === subjectId ? { ...r, subjectName: newName } : r));
    }
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

  const addChapter = (subjectId: string, chapterData: { name: string; description?: string }) => {
    const chName = chapterData.name.trim();
    if (!chName) return;
    const newChId = 'ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newChapter: Chapter = {
      id: newChId,
      name: chName,
      description: chapterData.description?.trim() || 'Custom study unit',
      topics: []
    };

    setExams(prev => prev.map(exam => {
      if (exam.id !== profile.selectedExamId) return exam;
      return {
        ...exam,
        subjects: exam.subjects.map(subj => {
          if (subj.id !== subjectId) return subj;
          const updated = [...subj.chapters, newChapter];
          return {
            ...subj,
            totalChapters: updated.length,
            chapters: updated
          };
        })
      };
    }));

    soundManager.playCompleteChime();
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
    if (updates.name) {
      const newName = updates.name.trim();
      setRevisions(prev => prev.map(r => r.chapterId === chapterId ? { ...r, chapterName: newName } : r));
    }
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

  const editTopic = (topicId: string, updates: { name?: string; difficulty?: DifficultyLevel; weightage?: number; subtopics?: string[]; accuracy?: number; studyTimeMinutes?: number }) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const newAcc = updates.accuracy !== undefined ? updates.accuracy : t.accuracy;
            return {
              ...t,
              name: updates.name !== undefined ? updates.name.trim() : t.name,
              difficulty: updates.difficulty !== undefined ? updates.difficulty : t.difficulty,
              weightage: updates.weightage !== undefined ? updates.weightage : t.weightage,
              subtopics: updates.subtopics !== undefined ? updates.subtopics : t.subtopics,
              accuracy: newAcc,
              studyTimeMinutes: updates.studyTimeMinutes !== undefined ? updates.studyTimeMinutes : t.studyTimeMinutes,
              isWeak: t.status === 'weak' || (newAcc > 0 && newAcc < 60)
            };
          })
        }))
      }))
    })));

    // Instantly sync with revision records
    setRevisions(prev => prev.map(r => {
      if (r.topicId !== topicId) return r;
      const newTopicName = updates.name !== undefined ? updates.name.trim() : r.topicName;
      let newInterval = r.intervalDays;

      // If difficulty or accuracy changed on an active pending card, adapt the interval
      if ((updates.difficulty || updates.accuracy !== undefined) && !r.completedDate) {
        const adaptiveIntervals = calculateAdaptiveIntervals(
          updates.difficulty || 'Medium',
          updates.accuracy,
          false
        );
        newInterval = adaptiveIntervals[r.stage - 1] || r.intervalDays;
      }

      return {
        ...r,
        topicName: newTopicName,
        intervalDays: newInterval
      };
    }));

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

  const addMultipleSubtopics = (topicId: string, subtopicsToAdd: string[]) => {
    const cleaned = subtopicsToAdd
      .map(s => s.trim().replace(/^[•*]\s*/, '').trim())
      .filter(s => s.length > 0);
    if (cleaned.length === 0) return;

    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const existing = t.subtopics || [];
            return {
              ...t,
              subtopics: [...existing, ...cleaned]
            };
          })
        }))
      }))
    })));
    soundManager.playCompleteChime();
  };

  const addSubtopic = (topicId: string, subtopicName: string) => {
    if (!subtopicName.trim()) return;
    if (subtopicName.includes(',') || subtopicName.includes('\n')) {
      const parts = subtopicName.split(/[\n,]/).map(s => s.trim().replace(/^[•*]\s*/, '').trim()).filter(Boolean);
      if (parts.length > 0) {
        addMultipleSubtopics(topicId, parts);
        return;
      }
    }
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
              subtopics: [...t.subtopics, subtopicName.trim().replace(/^[•*]\s*/, '').trim()]
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

  const addTopicPdfAttachment = (topicId: string, attachment: TopicPdfAttachment) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const existing = t.pdfAttachments || [];
            return {
              ...t,
              pdfAttachments: [...existing, attachment]
            };
          })
        }))
      }))
    })));
    soundManager.playClick();
  };

  const deleteTopicPdfAttachment = (topicId: string, attachmentId: string) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const existing = t.pdfAttachments || [];
            return {
              ...t,
              pdfAttachments: existing.filter(a => a.id !== attachmentId)
            };
          })
        }))
      }))
    })));
    soundManager.playClick();
  };

  const addTopicLecture = (topicId: string, lecture: { title: string; youtubeUrl: string; duration?: string; notes?: string }) => {
    const newLecture: TopicLecture = {
      id: `lec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: lecture.title.trim(),
      youtubeUrl: lecture.youtubeUrl.trim(),
      addedAt: getTodayDateString(),
      duration: lecture.duration,
      notes: lecture.notes
    };
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const existing = t.lectures || [];
            return {
              ...t,
              lectures: [...existing, newLecture]
            };
          })
        }))
      }))
    })));
    soundManager.playCompleteChime();
  };

  const deleteTopicLecture = (topicId: string, lectureId: string) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const existing = t.lectures || [];
            return {
              ...t,
              lectures: existing.filter(l => l.id !== lectureId)
            };
          })
        }))
      }))
    })));
    soundManager.playClick();
  };

  const addLectureTimestamp = (
    topicId: string,
    lectureId: string,
    timestamp: { timeSeconds: number; timeLabel: string; title: string }
  ) => {
    const newTs: LectureTimestamp = {
      id: `ts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timeSeconds: timestamp.timeSeconds,
      timeLabel: timestamp.timeLabel.trim(),
      title: timestamp.title.trim()
    };

    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const lectures = (t.lectures || []).map(lec => {
              if (lec.id !== lectureId) return lec;
              const existingTimestamps = lec.timestamps || [];
              return {
                ...lec,
                timestamps: [...existingTimestamps, newTs].sort((a, b) => a.timeSeconds - b.timeSeconds)
              };
            });
            return { ...t, lectures };
          })
        }))
      }))
    })));
    soundManager.playCompleteChime();
  };

  const deleteLectureTimestamp = (topicId: string, lectureId: string, timestampId: string) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const lectures = (t.lectures || []).map(lec => {
              if (lec.id !== lectureId) return lec;
              return {
                ...lec,
                timestamps: (lec.timestamps || []).filter(ts => ts.id !== timestampId)
              };
            });
            return { ...t, lectures };
          })
        }))
      }))
    })));
    soundManager.playClick();
  };

  const addTopicAudioMemo = (topicId: string, memo: { title: string; durationSeconds: number; storageKey?: string; audioDataUrl?: string; transcript?: string }) => {
    const newMemo: TopicAudioMemo = {
      id: `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: memo.title.trim(),
      durationSeconds: memo.durationSeconds,
      recordedAt: getTodayDateString(),
      storageKey: memo.storageKey,
      audioDataUrl: memo.audioDataUrl,
      transcript: memo.transcript
    };
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const existing = t.audioMemos || [];
            return {
              ...t,
              audioMemos: [...existing, newMemo]
            };
          })
        }))
      }))
    })));
    soundManager.playCompleteChime();
  };

  const deleteTopicAudioMemo = (topicId: string, memoId: string) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const existing = t.audioMemos || [];
            return {
              ...t,
              audioMemos: existing.filter(m => m.id !== memoId)
            };
          })
        }))
      }))
    })));
    soundManager.playClick();
  };

  const addTopicImageAttachment = (topicId: string, image: { title?: string; dataUrl: string; fileSize?: number }) => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newImage: TopicImageAttachment = {
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: image.title ? image.title.trim() : `Screenshot ${timeStr}`,
      dataUrl: image.dataUrl,
      addedAt: getTodayDateString(),
      fileSize: image.fileSize
    };
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const existing = t.images || [];
            return {
              ...t,
              images: [...existing, newImage]
            };
          })
        }))
      }))
    })));
    soundManager.playCompleteChime();
  };

  const deleteTopicImageAttachment = (topicId: string, imageId: string) => {
    setExams(prev => prev.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t => {
            if (t.id !== topicId) return t;
            const existing = t.images || [];
            return {
              ...t,
              images: existing.filter(img => img.id !== imageId)
            };
          })
        }))
      }))
    })));
    soundManager.playClick();
  };

  const logStudySession = (minutes: number, topicId?: string) => {
    const today = getTodayDateString();
    setActivityHistory(prev => {
      const existing = prev.find(a => a.date === today);
      if (existing) {
        return prev.map(a => (a.date === today ? { ...a, studyMinutes: a.studyMinutes + minutes } : a));
      }
      return [...prev, { date: today, studyMinutes: minutes, topicsCompleted: 0, revisionsCompleted: 0 }];
    });

    if (topicId) {
      setExams(prevExams => prevExams.map(exam => ({
        ...exam,
        subjects: exam.subjects.map(subj => ({
          ...subj,
          chapters: subj.chapters.map(chap => ({
            ...chap,
            topics: chap.topics.map(top => {
              if (top.id === topicId) {
                return {
                  ...top,
                  studyTimeMinutes: (top.studyTimeMinutes || 0) + minutes,
                  lastStudied: today
                };
              }
              return top;
            })
          }))
        }))
      })));
    }
  };

  const updateTopicMetrics = (topicId: string, updates: { accuracy?: number; studyTimeMinutes?: number; addMinutes?: number }) => {
    const today = getTodayDateString();
    setExams(prevExams => prevExams.map(exam => ({
      ...exam,
      subjects: exam.subjects.map(subj => ({
        ...subj,
        chapters: subj.chapters.map(chap => ({
          ...chap,
          topics: chap.topics.map(top => {
            if (top.id === topicId) {
              const newAcc = updates.accuracy !== undefined ? updates.accuracy : top.accuracy;
              let newTime = top.studyTimeMinutes || 0;
              if (updates.studyTimeMinutes !== undefined) newTime = updates.studyTimeMinutes;
              if (updates.addMinutes !== undefined) newTime += updates.addMinutes;
              return {
                ...top,
                accuracy: newAcc,
                studyTimeMinutes: newTime,
                lastStudied: today,
                isWeak: top.status === 'weak' || (newAcc > 0 && newAcc < 60)
              };
            }
            return top;
          })
        }))
      }))
    })));
    if (updates.addMinutes && updates.addMinutes > 0) {
      const existingToday = activityHistory.find(a => a.date === today);
      setActivityHistory(prev => {
        const ex = prev.find(a => a.date === today);
        if (ex) {
          return prev.map(a => (a.date === today ? { ...a, studyMinutes: a.studyMinutes + (updates.addMinutes || 0) } : a));
        }
        return [...prev, { date: today, studyMinutes: updates.addMinutes || 0, topicsCompleted: 0, revisionsCompleted: 0 }];
      });
    }
    soundManager.playClick();
  };

  const resetToDemo = () => {
    localStorage.removeItem('syllabus3d_exams');
    localStorage.removeItem('syllabus3d_profile');
    localStorage.removeItem('syllabus3d_achievements');
    localStorage.removeItem('syllabus3d_activity');
    localStorage.removeItem('syllabus3d_revisions');
    localStorage.removeItem('syllabus3d_planner');
    localStorage.removeItem('syllabus3d_platforms');
    setExams(INITIAL_EXAMS);
    setProfile(INITIAL_PROFILE);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setActivityHistory(INITIAL_ACTIVITY_HISTORY);
    setPlannerTasks(INITIAL_PLANNER_TASKS);
    setPlatforms(INITIAL_PLATFORMS);

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
    setRevisions(initRevs);
    soundManager.playCompleteChime();
  };

  const clearAllDemoData = () => {
    const blankExam: Exam = {
      id: 'custom_exam_blank',
      name: 'My Exam 2026',
      code: 'MY_EXAM',
      targetYear: 2026,
      examDate: '2026-10-15',
      subjects: []
    };

    setExams([blankExam]);
    setRevisions([]);
    setActivityHistory([]);
    setPlannerTasks([]);
    setPlatforms([]);
    setProfile({
      ...profile,
      selectedExamId: 'custom_exam_blank',
      targetExamDate: '2026-10-15',
      xp: 0,
      level: 1,
      levelTitle: 'Novice Scholar',
      currentStreak: 0,
      longestStreak: 0
    });

    try {
      localStorage.setItem('syllabus3d_exams', JSON.stringify([blankExam]));
      localStorage.setItem('syllabus3d_revisions', JSON.stringify([]));
      localStorage.setItem('syllabus3d_activity', JSON.stringify([]));
      localStorage.setItem('syllabus3d_planner', JSON.stringify([]));
      localStorage.setItem('syllabus3d_platforms', JSON.stringify([]));
      localStorage.setItem('syllabus3d_profile', JSON.stringify({
        ...profile,
        selectedExamId: 'custom_exam_blank',
        targetExamDate: '2026-10-15',
        xp: 0,
        level: 1,
        levelTitle: 'Novice Scholar',
        currentStreak: 0,
        longestStreak: 0
      }));
    } catch(e) {
      console.warn(e);
    }

    soundManager.playClick();
  };

  // ──── MULTI-PROFILE ENGINE ────
  const saveActiveProfileDataSynchronously = useCallback((profileId: string) => {
    const dataset = {
      exams,
      profile,
      achievements,
      activityHistory,
      revisions,
      plannerTasks,
      platforms,
      top3Targets,
      reflectionsHistory
    };

    if (profileId === 'profile_default') {
      try {
        localStorage.setItem('syllabus3d_exams', JSON.stringify(exams));
        localStorage.setItem('syllabus3d_profile', JSON.stringify(profile));
        localStorage.setItem('syllabus3d_achievements', JSON.stringify(achievements));
        localStorage.setItem('syllabus3d_activity', JSON.stringify(activityHistory));
        localStorage.setItem('syllabus3d_revisions', JSON.stringify(revisions));
        localStorage.setItem('syllabus3d_planner', JSON.stringify(plannerTasks));
        localStorage.setItem('syllabus3d_platforms', JSON.stringify(platforms));
        localStorage.setItem('syllabus3d_top3_targets', JSON.stringify(top3Targets));
        localStorage.setItem('syllabus3d_reflections', JSON.stringify(reflectionsHistory));
      } catch (e) {}
    } else {
      try {
        localStorage.setItem(`syllabus3d_profile_data_${profileId}`, JSON.stringify(dataset));
      } catch (e) {}
    }
  }, [exams, profile, achievements, activityHistory, revisions, plannerTasks, platforms, top3Targets, reflectionsHistory]);

  const loadProfileDataById = useCallback((profileId: string) => {
    if (profileId === 'profile_default') {
      try {
        const examsSaved = localStorage.getItem('syllabus3d_exams');
        const profileSaved = localStorage.getItem('syllabus3d_profile');
        const achSaved = localStorage.getItem('syllabus3d_achievements');
        const actSaved = localStorage.getItem('syllabus3d_activity');
        const revSaved = localStorage.getItem('syllabus3d_revisions');
        const planSaved = localStorage.getItem('syllabus3d_planner');
        const platSaved = localStorage.getItem('syllabus3d_platforms');
        const top3Saved = localStorage.getItem('syllabus3d_top3_targets');
        const refSaved = localStorage.getItem('syllabus3d_reflections');

        return {
          exams: examsSaved ? JSON.parse(examsSaved) : INITIAL_EXAMS,
          profile: profileSaved ? JSON.parse(profileSaved) : INITIAL_PROFILE,
          achievements: achSaved ? JSON.parse(achSaved) : INITIAL_ACHIEVEMENTS,
          activityHistory: actSaved ? JSON.parse(actSaved) : INITIAL_ACTIVITY_HISTORY,
          revisions: revSaved ? JSON.parse(revSaved) : [],
          plannerTasks: planSaved ? JSON.parse(planSaved) : INITIAL_PLANNER_TASKS,
          platforms: platSaved ? JSON.parse(platSaved) : INITIAL_PLATFORMS,
          top3Targets: top3Saved ? JSON.parse(top3Saved) : loadStoredTop3Targets(),
          reflectionsHistory: refSaved ? JSON.parse(refSaved) : loadStoredReflections()
        };
      } catch (e) {}
      return null;
    } else {
      try {
        const raw = localStorage.getItem(`syllabus3d_profile_data_${profileId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    }
  }, []);

  const switchProfile = useCallback((targetProfileId: string) => {
    if (targetProfileId === activeProfileId) return;

    // 1. Immediately save current active profile
    saveActiveProfileDataSynchronously(activeProfileId);

    // 2. Load target profile's data
    const targetDataset = loadProfileDataById(targetProfileId);
    if (!targetDataset) return;

    // 3. Update all React states
    setExams(targetDataset.exams);
    setProfile(targetDataset.profile);
    setAchievements(targetDataset.achievements);
    setActivityHistory(targetDataset.activityHistory);
    setRevisions(targetDataset.revisions);
    setPlannerTasks(targetDataset.plannerTasks);
    setPlatforms(targetDataset.platforms);
    setTop3Targets(targetDataset.top3Targets);
    setReflectionsHistory(targetDataset.reflectionsHistory);

    // 4. Update active ID
    setActiveProfileId(targetProfileId);
    try {
      localStorage.setItem('syllabus3d_active_profile_id', targetProfileId);
    } catch (e) {}

    setProfiles(prev => prev.map(p =>
      p.id === targetProfileId ? { ...p, lastActiveAt: new Date().toISOString() } : p
    ));

    soundManager.playCompleteChime();
    haptics.success();
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.6 }
    });
  }, [activeProfileId, saveActiveProfileDataSynchronously, loadProfileDataById]);

  const createProfile = useCallback((profileData: {
    name: string;
    avatarUrl?: string;
    avatarEmoji?: string;
    avatarColor?: string;
    targetExamId: string;
    targetExamDate?: string;
    cloneCurrentSyllabus?: boolean;
  }): string => {
    // 1. Save current profile first
    saveActiveProfileDataSynchronously(activeProfileId);

    const newId = 'profile_' + Date.now();
    const newProfileItem: UserProfileItem = {
      id: newId,
      name: profileData.name.trim() || 'New Aspirant',
      avatarUrl: profileData.avatarUrl,
      avatarEmoji: profileData.avatarEmoji || '🦁',
      avatarColor: profileData.avatarColor || 'from-blue-600 to-indigo-600',
      targetExamId: profileData.targetExamId || 'exam_ssc_cgl_2025',
      targetExamDate: profileData.targetExamDate || '2026-10-15',
      currentStreak: 0,
      longestStreak: 0,
      level: 1,
      levelTitle: 'Syllabus Recruit',
      xp: 0,
      soundEnabled: true,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    const newProgressProfile: UserProgressProfile = {
      id: newId,
      name: newProfileItem.name,
      avatarUrl: newProfileItem.avatarUrl,
      avatarEmoji: newProfileItem.avatarEmoji,
      avatarColor: newProfileItem.avatarColor,
      targetExamDate: newProfileItem.targetExamDate,
      currentStreak: 0,
      longestStreak: 0,
      level: 1,
      levelTitle: 'Syllabus Recruit',
      xp: 0,
      soundEnabled: true,
      selectedExamId: newProfileItem.targetExamId
    };

    let initialExamsForNewProfile: Exam[];
    if (profileData.cloneCurrentSyllabus) {
      initialExamsForNewProfile = JSON.parse(JSON.stringify(exams));
    } else {
      initialExamsForNewProfile = JSON.parse(JSON.stringify(INITIAL_EXAMS));
    }

    const initialDataset = {
      exams: initialExamsForNewProfile,
      profile: newProgressProfile,
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      activityHistory: [],
      revisions: [],
      plannerTasks: [],
      platforms: JSON.parse(JSON.stringify(INITIAL_PLATFORMS)),
      top3Targets: [
        { id: '1', text: '', completed: false },
        { id: '2', text: '', completed: false },
        { id: '3', text: '', completed: false }
      ],
      reflectionsHistory: []
    };

    try {
      localStorage.setItem(`syllabus3d_profile_data_${newId}`, JSON.stringify(initialDataset));
    } catch (e) {}

    // Update profiles list
    setProfiles(prev => {
      const updated = [...prev, newProfileItem];
      try { localStorage.setItem('syllabus3d_profiles', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // Set new profile data in state
    setExams(initialDataset.exams);
    setProfile(initialDataset.profile);
    setAchievements(initialDataset.achievements);
    setActivityHistory(initialDataset.activityHistory);
    setRevisions(initialDataset.revisions);
    setPlannerTasks(initialDataset.plannerTasks);
    setPlatforms(initialDataset.platforms);
    setTop3Targets(initialDataset.top3Targets);
    setReflectionsHistory(initialDataset.reflectionsHistory);

    setActiveProfileId(newId);
    try { localStorage.setItem('syllabus3d_active_profile_id', newId); } catch (e) {}

    soundManager.playCompleteChime();
    haptics.success();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    return newId;
  }, [activeProfileId, exams, saveActiveProfileDataSynchronously]);

  const updateProfileById = useCallback((profileId: string, updates: Partial<UserProfileItem>) => {
    setProfiles(prev => {
      const updated = prev.map(p => p.id === profileId ? { ...p, ...updates } : p);
      try { localStorage.setItem('syllabus3d_profiles', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    if (profileId === activeProfileId) {
      setProfile(prev => ({
        ...prev,
        name: updates.name ?? prev.name,
        avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : prev.avatarUrl,
        avatarEmoji: updates.avatarEmoji ?? prev.avatarEmoji,
        avatarColor: updates.avatarColor ?? prev.avatarColor,
        targetExamDate: updates.targetExamDate ?? prev.targetExamDate,
        selectedExamId: updates.targetExamId ?? prev.selectedExamId
      }));
    } else {
      const existing = loadProfileDataById(profileId);
      if (existing) {
        existing.profile = {
          ...existing.profile,
          name: updates.name ?? existing.profile.name,
          avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : existing.profile.avatarUrl,
          avatarEmoji: updates.avatarEmoji ?? existing.profile.avatarEmoji,
          avatarColor: updates.avatarColor ?? existing.profile.avatarColor,
          targetExamDate: updates.targetExamDate ?? existing.profile.targetExamDate,
          selectedExamId: updates.targetExamId ?? existing.profile.selectedExamId
        };
        try {
          localStorage.setItem(`syllabus3d_profile_data_${profileId}`, JSON.stringify(existing));
        } catch (e) {}
      }
    }
  }, [activeProfileId, loadProfileDataById]);

  const deleteProfile = useCallback((profileId: string): boolean => {
    if (profiles.length <= 1) return false;

    if (profileId === activeProfileId) {
      const nextProfile = profiles.find(p => p.id !== profileId);
      if (nextProfile) {
        switchProfile(nextProfile.id);
      }
    }

    if (profileId !== 'profile_default') {
      try { localStorage.removeItem(`syllabus3d_profile_data_${profileId}`); } catch (e) {}
    }

    setProfiles(prev => {
      const updated = prev.filter(p => p.id !== profileId);
      try { localStorage.setItem('syllabus3d_profiles', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    soundManager.playClick();
    return true;
  }, [profiles, activeProfileId, switchProfile]);

  const exportData = () => {
    // Gather all PDF highlights from localStorage
    const pdfHighlights: Record<string, any> = {};
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('syllabus3d_pdf_highlights_')) {
            const docId = key.replace('syllabus3d_pdf_highlights_', '');
            const raw = localStorage.getItem(key);
            if (raw) {
              pdfHighlights[docId] = JSON.parse(raw);
            }
          }
        }
      } catch {}
    }

    return JSON.stringify({
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      activeProfileId,
      profiles,
      exams,
      profile,
      achievements,
      activityHistory,
      revisions,
      plannerTasks,
      platforms,
      top3Targets,
      reflectionsHistory,
      pdfHighlights,
      audioSettings: soundManager.getSettings(),
      theme: (typeof window !== 'undefined' ? localStorage.getItem('syllabus3d_theme') : 'dark') || 'dark'
    }, null, 2);
  };

  const updateTop3Target = (targetId: string, text: string, meta?: { topicId?: string; subjectName?: string; subjectColor?: string }) => {
    setTop3Targets(prev => prev.map(t => (t.id === targetId ? { ...t, text, ...meta } : t)));
  };

  const toggleTop3Target = (targetId: string) => {
    setTop3Targets(prev => {
      const next = prev.map(t => {
        if (t.id === targetId) {
          const completed = !t.completed;
          if (completed) soundManager.playCompleteChime();
          else soundManager.playClick();
          return {
            ...t,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined
          };
        }
        return t;
      });

      const filled = next.filter(t => t.text.trim());
      const allDone = filled.length > 0 && filled.every(t => t.completed);
      if (allDone) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FACC15', '#2563EB', '#7AA2F7', '#EF4444']
        });
        setProfile(p => ({ ...p, xp: p.xp + 50 }));
      }
      return next;
    });
  };

  const clearTop3Target = (targetId: string) => {
    setTop3Targets(prev => prev.map(t => (t.id === targetId ? { id: t.id, text: '', completed: false } : t)));
    soundManager.playClick();
  };

  const saveDailyReflection = (payload: Omit<DailyReflection, 'id' | 'timestamp'>) => {
    const newReflection: DailyReflection = {
      ...payload,
      id: `refl_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    const updated = saveStoredReflection(newReflection);
    setReflectionsHistory(updated);
    setProfile(p => ({ ...p, xp: p.xp + 30 }));
    soundManager.playCompleteChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#7AA2F7', '#10B981', '#FACC15']
    });
  };

  const deleteDailyReflection = (id: string) => {
    const updated = deleteStoredReflection(id);
    setReflectionsHistory(updated);
  };

  const importData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.profiles && Array.isArray(parsed.profiles)) {
        setProfiles(parsed.profiles);
        try { localStorage.setItem('syllabus3d_profiles', JSON.stringify(parsed.profiles)); } catch(e) {}
      }
      if (parsed.activeProfileId && typeof parsed.activeProfileId === 'string') {
        setActiveProfileId(parsed.activeProfileId);
        try { localStorage.setItem('syllabus3d_active_profile_id', parsed.activeProfileId); } catch(e) {}
      }
      if (parsed.exams && Array.isArray(parsed.exams)) setExams(parsed.exams);
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.achievements && Array.isArray(parsed.achievements)) setAchievements(parsed.achievements);
      if (parsed.activityHistory && Array.isArray(parsed.activityHistory)) setActivityHistory(parsed.activityHistory);
      if (parsed.revisions && Array.isArray(parsed.revisions)) setRevisions(parsed.revisions);
      if (parsed.plannerTasks && Array.isArray(parsed.plannerTasks)) setPlannerTasks(parsed.plannerTasks);
      if (parsed.platforms && Array.isArray(parsed.platforms)) setPlatforms(parsed.platforms);
      if (parsed.top3Targets && Array.isArray(parsed.top3Targets)) {
        setTop3Targets(parsed.top3Targets);
        saveStoredTop3Targets(parsed.top3Targets);
      }
      if (parsed.reflectionsHistory && Array.isArray(parsed.reflectionsHistory)) {
        setReflectionsHistory(parsed.reflectionsHistory);
        try { localStorage.setItem('syllabus3d_daily_reflections', JSON.stringify(parsed.reflectionsHistory)); } catch(e) {}
      }
      if (parsed.pdfHighlights && typeof parsed.pdfHighlights === 'object') {
        Object.entries(parsed.pdfHighlights).forEach(([docId, highlights]) => {
          try { localStorage.setItem(`syllabus3d_pdf_highlights_${docId}`, JSON.stringify(highlights)); } catch(e) {}
        });
      }
      if (parsed.audioSettings) {
        soundManager.updateSettings(parsed.audioSettings);
      }
      if (parsed.theme) {
        try { localStorage.setItem('syllabus3d_theme', parsed.theme); } catch(e) {}
      }
      triggerAutoSave();
      return true;
    } catch (err) {
      return false;
    }
  };

  const restoreSafetySnapshot = async (): Promise<boolean> => {
    try {
      const snapshot = await storageManager.getLatestSafetySnapshot();
      if (!snapshot) return false;

      if (Array.isArray(snapshot.exams) && snapshot.exams.length > 0) {
        setExams(snapshot.exams);
        storageManager.safeSetItem('syllabus3d_exams', snapshot.exams);
      }
      if (snapshot.profile) {
        setProfile(snapshot.profile);
        storageManager.safeSetItem('syllabus3d_profile', snapshot.profile);
      }
      if (Array.isArray(snapshot.achievements)) {
        setAchievements(snapshot.achievements);
        storageManager.safeSetItem('syllabus3d_achievements', snapshot.achievements);
      }
      if (Array.isArray(snapshot.activityHistory)) {
        setActivityHistory(snapshot.activityHistory);
        storageManager.safeSetItem('syllabus3d_activity', snapshot.activityHistory);
      }
      if (Array.isArray(snapshot.revisions)) {
        setRevisions(snapshot.revisions);
        storageManager.safeSetItem('syllabus3d_revisions', snapshot.revisions);
      }
      if (Array.isArray(snapshot.plannerTasks)) {
        setPlannerTasks(snapshot.plannerTasks);
        storageManager.safeSetItem('syllabus3d_planner', snapshot.plannerTasks);
      }
      if (Array.isArray(snapshot.platforms)) {
        setPlatforms(snapshot.platforms);
        storageManager.safeSetItem('syllabus3d_platforms', snapshot.platforms);
      }
      if (Array.isArray(snapshot.top3Targets)) {
        setTop3Targets(snapshot.top3Targets);
        saveStoredTop3Targets(snapshot.top3Targets);
      }
      if (Array.isArray(snapshot.reflectionsHistory)) {
        setReflectionsHistory(snapshot.reflectionsHistory);
        try {
          localStorage.setItem('syllabus3d_daily_reflections', JSON.stringify(snapshot.reflectionsHistory));
        } catch {}
      }
      triggerAutoSave();
      return true;
    } catch (err) {
      console.error('Failed to restore safety snapshot', err);
      return false;
    }
  };

  const getStorageMetrics = (): StorageHealthMetrics => {
    return storageManager.getStorageHealthMetrics();
  };

  const resyncAllRevisions = useCallback(() => {
    setRevisions(prev => syncAllRevisionsWithSyllabus(exams, prev));
    soundManager.playCompleteChime();
    haptics.success();
  }, [exams]);

  const contextValue = useMemo(() => ({
    exams,
    currentExam,
    selectedExamId: profile.selectedExamId,
    setSelectedExamId,
    updateCurrentExamDetails,
    profile,
    updateProfile,
    profiles,
    activeProfileId,
    createProfile,
    switchProfile,
    updateProfileById,
    deleteProfile,
    achievements,
    activityHistory,
    overallStats,
    subjectStats,
    allTopics,
    weakTopics,
    revisions,
    dueRevisions,
    resyncAllRevisions,
    plannerTasks,
    addPlannerTask,
    togglePlannerTask,
    movePlannerTask,
    deletePlannerTask,
    clearCompletedPlannerTasks,
    platforms,
    addPlatform,
    editPlatform,
    deletePlatform,
    togglePinPlatform,
    recordPlatformAccess,
    top3Targets,
    updateTop3Target,
    toggleTop3Target,
    clearTop3Target,
    reflectionsHistory,
    saveDailyReflection,
    deleteDailyReflection,
    updateTopicStatus,
    updateTopicNotes,
    addTopicMistake,
    resolveTopicMistake,
    deleteTopicMistake,
    editTopicMistake,
    completeRevisionCard,
    addTopic,
    addCustomTopicWithHierarchy,
    addMultipleCustomTopicsWithHierarchy,
    addSubject,
    editSubject,
    deleteSubject,
    addChapter,
    editChapter,
    deleteChapter,
    editTopic,
    deleteTopic,
    addSubtopic,
    addMultipleSubtopics,
    deleteSubtopic,
    addTopicPdfAttachment,
    deleteTopicPdfAttachment,
    addTopicLecture,
    deleteTopicLecture,
    addLectureTimestamp,
    deleteLectureTimestamp,
    addTopicAudioMemo,
    deleteTopicAudioMemo,
    addTopicImageAttachment,
    deleteTopicImageAttachment,
    updateTopicMetrics,
    logStudySession,
    resetToDemo,
    clearAllDemoData,
    exportData,
    importData,
    restoreSafetySnapshot,
    getStorageMetrics,
    lastSavedAt,
    isAutoSaving
  }), [
    exams,
    currentExam,
    profile,
    profiles,
    activeProfileId,
    createProfile,
    switchProfile,
    updateProfileById,
    deleteProfile,
    achievements,
    activityHistory,
    overallStats,
    subjectStats,
    allTopics,
    weakTopics,
    revisions,
    dueRevisions,
    resyncAllRevisions,
    plannerTasks,
    platforms,
    top3Targets,
    reflectionsHistory,
    lastSavedAt,
    isAutoSaving
  ]);

  return (
    <SyllabusContext.Provider value={contextValue}>
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
