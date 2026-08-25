export type TopicStatus = 'completed' | 'in_progress' | 'not_started' | 'revision_due' | 'weak';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type MistakeType = 'conceptual' | 'calculation' | 'formula' | 'silly' | 'time_pressure';

export interface MistakeRecord {
  id: string;
  topicId: string;
  questionDescription: string;
  mistakeType: MistakeType;
  correctApproach: string;
  dateLogged: string;
  resolved: boolean;
  wrongLogic?: string;
  examinerTrap?: string;
  goldenRule?: string;
  severity?: 'high' | 'medium' | 'low';
  mockSource?: string;
}

export interface Topic {
  id: string;
  name: string;
  subtopics: string[];
  status: TopicStatus;
  completionPercentage: number;
  studyTimeMinutes: number;
  lastStudied: string | null;
  nextRevision: string | null;
  accuracy: number;
  mockAttempts: number;
  difficulty: DifficultyLevel;
  isWeak: boolean;
  weightage: number;
  notes: string;
  mistakes: MistakeRecord[];
}

export interface Chapter {
  id: string;
  name: string;
  description: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalChapters: number;
  chapters: Chapter[];
}

export interface Exam {
  id: string;
  name: string;
  code: string;
  targetYear: number;
  examDate: string;
  subjects: Subject[];
}

export interface RevisionRecord {
  id: string;
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  completedDate: string | null;
  scheduledDate: string;
  stage: number;
  intervalDays: number;
  history: Array<{
    date: string;
    grade: 'again' | 'hard' | 'good' | 'easy';
    nextIntervalDays: number;
  }>;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  maxProgress: number;
}

export interface DailyActivity {
  date: string;
  studyMinutes: number;
  topicsCompleted: number;
  revisionsCompleted: number;
}

export interface UserProgressProfile {
  name: string;
  targetExamDate: string;
  currentStreak: number;
  longestStreak: number;
  level: number;
  levelTitle: string;
  xp: number;
  soundEnabled: boolean;
  selectedExamId: string;
}

export interface OverallStats {
  totalTopics: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  revisionDueCount: number;
  weakCount: number;
  completionPercentage: number;
  weeklyCompletedCount: number;
  weeklyTargetPercentage: number;
  totalStudyHours: number;
  averageAccuracy: number;
}

export interface SubjectStats {
  subjectId: string;
  subjectName: string;
  color: string;
  icon: string;
  completedTopics: number;
  totalTopics: number;
  percentage: number;
  avgAccuracy: number;
  totalStudyHours: number;
  weakCount: number;
  lastStudied: string | null;
}

export type PlannerColumnStatus = 'today' | 'in_progress' | 'upcoming' | 'completed';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'concept' | 'practice' | 'mock' | 'revision';

export interface PlannerTask {
  id: string;
  topicId?: string;
  topicName: string;
  subjectName?: string;
  subjectColor?: string;
  status: PlannerColumnStatus;
  scheduledDate: string;
  estimatedMinutes: number;
  completedAt?: string;
  isCustom: boolean;
  priority?: TaskPriority;
  category?: TaskCategory;
}
