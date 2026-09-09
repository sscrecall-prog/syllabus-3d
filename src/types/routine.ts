export type RoutineSlotCategory =
  | 'concept'     // 📚 Deep Study / Core Theory
  | 'practice'    // ⚡ Problem Practice / Speed Drills
  | 'revision'    // 🔄 Spaced Revision / Formula Recall
  | 'mock'        // 📝 Full Mock Test / Sectional Test
  | 'reading'     // 📰 Editorial / Current Affairs / Vocab
  | 'break'       // ☕ Meal / Light Walk / Power Nap
  | 'sleep'       // 😴 Rest & Recovery
  | 'custom';     // 🎯 Custom Activity

export type RoutineDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const ALL_ROUTINE_DAYS: RoutineDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAYS: RoutineDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
export const WEEKENDS: RoutineDay[] = ['Sat', 'Sun'];

export interface RoutineSlot {
  id: string;
  title: string;
  startTime: string; // "06:00" (24h format HH:MM)
  endTime: string;   // "07:30" (24h format HH:MM)
  category: RoutineSlotCategory;
  subjectId?: string;
  subjectName?: string;
  subjectColor?: string;
  topicName?: string;
  days: RoutineDay[];
  notes?: string;
  checklists?: string[]; // Sub-goals for this slot (e.g., ["50 algebra MCQs", "2 editorials"])
  completedDates?: string[]; // Dates (YYYY-MM-DD) when checked off
  priority?: 'high' | 'medium' | 'low';
  customColor?: string;
}

export interface RoutineTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  icon: string;
  targetAspirant: string;
  totalStudyHours: number;
  totalSleepHours: number;
  slots: Omit<RoutineSlot, 'id' | 'completedDates'>[];
}

export interface CategoryVisualConfig {
  label: string;
  icon: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotColor: string;
  badgeBg: string;
}

export const CATEGORY_CONFIG: Record<RoutineSlotCategory, CategoryVisualConfig> = {
  concept: {
    label: 'Deep Concept Study',
    icon: '📚',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/15',
    borderClass: 'border-blue-500/30 dark:border-blue-500/40',
    textClass: 'text-blue-600 dark:text-blue-400',
    dotColor: '#3B82F6',
    badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  practice: {
    label: 'Practice & Problem Sprint',
    icon: '⚡',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    borderClass: 'border-emerald-500/30 dark:border-emerald-500/40',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    dotColor: '#10B981',
    badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  },
  revision: {
    label: 'Spaced Revision & Recall',
    icon: '🔄',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
    borderClass: 'border-amber-500/30 dark:border-amber-500/40',
    textClass: 'text-amber-600 dark:text-amber-400',
    dotColor: '#F59E0B',
    badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  mock: {
    label: 'Mock Test & Analysis',
    icon: '📝',
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
    borderClass: 'border-rose-500/30 dark:border-rose-500/40',
    textClass: 'text-rose-600 dark:text-rose-400',
    dotColor: '#F43F5E',
    badgeBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
  },
  reading: {
    label: 'Editorial & Current Affairs',
    icon: '📰',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/15',
    borderClass: 'border-purple-500/30 dark:border-purple-500/40',
    textClass: 'text-purple-600 dark:text-purple-400',
    dotColor: '#8B5CF6',
    badgeBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
  },
  break: {
    label: 'Meal / Walk / Break',
    icon: '☕',
    bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    borderClass: 'border-cyan-500/30 dark:border-cyan-500/40',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    dotColor: '#06B6D4',
    badgeBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
  },
  sleep: {
    label: 'Rest & Deep Sleep',
    icon: '😴',
    bgClass: 'bg-indigo-950/20 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-500/20 dark:border-indigo-500/30',
    textClass: 'text-indigo-400 dark:text-indigo-300',
    dotColor: '#6366F1',
    badgeBg: 'bg-indigo-500/15 text-indigo-400 dark:text-indigo-300 border-indigo-500/20'
  },
  custom: {
    label: 'Custom Activity',
    icon: '🎯',
    bgClass: 'bg-slate-500/10 dark:bg-slate-500/15',
    borderClass: 'border-slate-500/30 dark:border-slate-500/40',
    textClass: 'text-slate-700 dark:text-slate-300',
    dotColor: '#64748B',
    badgeBg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'
  }
};
