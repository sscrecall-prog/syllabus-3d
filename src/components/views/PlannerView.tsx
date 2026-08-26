import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Zap,
  Target,
  Sparkles,
  ArrowRight,
  Check,
  Flame,
  Layers,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Search,
  X,
  Tag,
  Filter,
  CheckSquare,
  Play,
  RotateCcw,
  Calendar,
  LayoutGrid,
  CalendarDays,
  ArrowUpRight,
  MoveRight,
  Trophy,
  Star,
  TrendingUp,
  AlertTriangle,
  GripVertical,
  Sun,
  Moon,
  Sunrise,
  Coffee
} from 'lucide-react';
import { PlannerColumnStatus, PlannerTask, Topic, TaskPriority, TaskCategory } from '../../types/syllabus';
import { getTodayDateString } from '../../utils/dateUtils';
import { soundManager } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';

interface PlannerViewProps {
  onOpenFocusChamber?: (topicId?: string) => void;
  onOpenTopicDrawer?: (topic: Topic, subName: string, chName: string) => void;
}

/* ─────────────────── HELPER FUNCTIONS ─────────────────── */

const getGreeting = (): { text: string; icon: React.ReactNode; emoji: string } => {
  const hour = new Date().getHours();
  if (hour < 5) return { text: 'Burning the Midnight Oil', icon: <Moon className="w-5 h-5" />, emoji: '🌙' };
  if (hour < 12) return { text: 'Good Morning, Champion', icon: <Sunrise className="w-5 h-5" />, emoji: '🌅' };
  if (hour < 17) return { text: 'Afternoon Grind Mode', icon: <Sun className="w-5 h-5" />, emoji: '☀️' };
  if (hour < 21) return { text: 'Evening Study Session', icon: <Coffee className="w-5 h-5" />, emoji: '🌆' };
  return { text: 'Night Owl Mode', icon: <Moon className="w-5 h-5" />, emoji: '🦉' };
};

const formatYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getExamCountdown = (examDate?: string): { days: number; urgency: string; color: string } => {
  if (!examDate) return { days: 0, urgency: 'No date set', color: 'text-slate-400' };
  const diff = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return { days: 0, urgency: 'Exam Day!', color: 'text-rose-500' };
  if (diff <= 30) return { days: diff, urgency: 'Final Sprint', color: 'text-rose-500' };
  if (diff <= 90) return { days: diff, urgency: 'Crunch Time', color: 'text-amber-500' };
  return { days: diff, urgency: 'Steady Pace', color: 'text-emerald-500' };
};

const DAILY_CHALLENGES = [
  { text: 'Complete 3 High Priority tasks today', xp: 50, icon: '🏆' },
  { text: 'Finish all Today\'s Targets before 6 PM', xp: 75, icon: '⏰' },
  { text: 'Start a 45-min Deep Focus session', xp: 40, icon: '🧠' },
  { text: 'Clear 2 Revision Due topics', xp: 60, icon: '🔄' },
  { text: 'Study 3 different subjects today', xp: 55, icon: '📚' },
  { text: 'Complete a Mock Test analysis', xp: 80, icon: '📝' },
  { text: 'Tackle your weakest topic first', xp: 65, icon: '💪' },
];

const getDailyChallenge = () => {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return DAILY_CHALLENGES[seed % DAILY_CHALLENGES.length];
};

/* ─────────────── CIRCULAR PROGRESS RING ─────────────── */

const CircularProgressRing: React.FC<{ percent: number; size?: number; stroke?: number }> = ({
  percent,
  size = 120,
  stroke = 8
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-[#2A2A2A]"
          strokeWidth={stroke}
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-[#171717] dark:text-[#F5E6C8] font-mono leading-none">
          {percent}%
        </span>
        <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider mt-0.5">Complete</span>
      </div>
    </div>
  );
};

/* ─────────────── MINI DONUT CHART ─────────────── */

const MiniDonut: React.FC<{ completed: number; total: number; size?: number }> = ({ completed, total, size = 28 }) => {
  const percent = total > 0 ? (completed / total) * 100 : 0;
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-slate-200 dark:text-[#2A2A2A]" strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={percent >= 100 ? '#10B981' : percent > 0 ? '#D4AF37' : '#94a3b8'}
        strokeWidth={3} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
};

/* ─────────────── HEATMAP CELL ─────────────── */

const getHeatmapColor = (minutes: number): string => {
  if (minutes === 0) return 'bg-slate-100 dark:bg-[#1E1E1E]';
  if (minutes < 30) return 'bg-teal-100 dark:bg-teal-900/30';
  if (minutes < 60) return 'bg-teal-300 dark:bg-teal-700/50';
  if (minutes < 120) return 'bg-teal-500 dark:bg-teal-600/60';
  return 'bg-[#D4AF37] dark:bg-[#D4AF37]/70';
};

/* ─────────────────── MAIN COMPONENT ─────────────────── */

export const PlannerView: React.FC<PlannerViewProps> = ({
  onOpenFocusChamber,
  onOpenTopicDrawer
}) => {
  const {
    plannerTasks,
    allTopics,
    currentExam,
    profile,
    activityHistory,
    dueRevisions,
    weakTopics,
    addPlannerTask,
    togglePlannerTask,
    movePlannerTask,
    deletePlannerTask,
    clearCompletedPlannerTasks
  } = useSyllabus();

  // View Mode
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSyllabusTopicId, setSelectedSyllabusTopicId] = useState('');
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [targetColumn, setTargetColumn] = useState<PlannerColumnStatus>('today');
  const [targetDate, setTargetDate] = useState<string>(getTodayDateString());
  const [estimatedMins, setEstimatedMins] = useState(45);
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [category, setCategory] = useState<TaskCategory>('concept');

  // Filters & Calendar
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [dismissedChallenge, setDismissedChallenge] = useState(false);

  // Refs
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to today on calendar mount
  useEffect(() => {
    if (viewMode === 'calendar' && calendarScrollRef.current) {
      const todayEl = calendarScrollRef.current.querySelector('[data-today="true"]');
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [viewMode]);

  /* ──── COMPUTED DATA ──── */

  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday + (weekOffset * 7));

    const days: Array<{
      dateStr: string; dayName: string; dayNum: number; monthName: string;
      isToday: boolean; dateObj: Date;
    }> = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const todayStr = getTodayDateString();

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatYMD(d);
      days.push({
        dateStr, dayName: dayNames[i], dayNum: d.getDate(),
        monthName: monthNames[d.getMonth()], isToday: dateStr === todayStr, dateObj: d
      });
    }
    return days;
  }, [weekOffset]);

  const filteredTasks = useMemo(() => {
    if (selectedSubjectFilter === 'all') return plannerTasks;
    return plannerTasks.filter(t => t.subjectName === selectedSubjectFilter);
  }, [plannerTasks, selectedSubjectFilter]);

  const todayStr = getTodayDateString();
  const todayTasks = useMemo(() => filteredTasks.filter(t => t.status === 'today'), [filteredTasks]);
  const inProgressTasks = useMemo(() => filteredTasks.filter(t => t.status === 'in_progress'), [filteredTasks]);
  const upcomingTasks = useMemo(() => filteredTasks.filter(t => t.status === 'upcoming'), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter(t => t.status === 'completed'), [filteredTasks]);

  const totalTodayCount = todayTasks.length + inProgressTasks.length + completedTasks.length;
  const completedTodayCount = completedTasks.length;
  const todayProgressPercent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  const totalPlannedMinutes = useMemo(() => plannerTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0), [plannerTasks]);
  const completedMinutes = useMemo(() => plannerTasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0), [plannerTasks]);

  // Heatmap data for current week
  const weekHeatmapData = useMemo(() => {
    return weekDays.map(day => {
      const activity = activityHistory.find(a => a.date === day.dateStr);
      return { ...day, studyMinutes: activity?.studyMinutes || 0 };
    });
  }, [weekDays, activityHistory]);

  // Smart suggestions
  const smartSuggestions = useMemo(() => {
    const suggestions: Array<{ type: 'revision' | 'weak' | 'overdue'; label: string; topicName: string; subjectName: string; subjectColor: string; topicId?: string }> = [];

    // Due revisions not in planner
    const plannerTopicNames = new Set(plannerTasks.map(t => t.topicName));
    dueRevisions.slice(0, 3).forEach(rev => {
      if (!plannerTopicNames.has(rev.topicName)) {
        suggestions.push({
          type: 'revision',
          label: '🔄 Revision Due',
          topicName: rev.topicName,
          subjectName: rev.subjectName,
          subjectColor: '#f59e0b',
          topicId: rev.topicId
        });
      }
    });

    // Weak topics not planned
    weakTopics.slice(0, 3).forEach(wt => {
      if (!plannerTopicNames.has(wt.topic.name)) {
        suggestions.push({
          type: 'weak',
          label: '⚠️ Weak Topic',
          topicName: wt.topic.name,
          subjectName: wt.subjectName,
          subjectColor: wt.subjectColor,
          topicId: wt.topic.id
        });
      }
    });

    return suggestions.slice(0, 5);
  }, [dueRevisions, weakTopics, plannerTasks]);

  // Filtered topics for modal
  const filteredTopicsForModal = useMemo(() => {
    if (!topicSearchQuery.trim()) return allTopics;
    const q = topicSearchQuery.toLowerCase();
    return allTopics.filter(t =>
      t.topic.name.toLowerCase().includes(q) ||
      t.subjectName.toLowerCase().includes(q) ||
      t.chapterName.toLowerCase().includes(q)
    );
  }, [allTopics, topicSearchQuery]);

  const selectedTopicObj = useMemo(() => allTopics.find(t => t.topic.id === selectedSyllabusTopicId), [allTopics, selectedSyllabusTopicId]);

  /* ──── HANDLERS ──── */

  const handleToggleWithConfetti = useCallback((taskId: string) => {
    const task = plannerTasks.find(t => t.id === taskId);
    togglePlannerTask(taskId);

    if (task && task.status !== 'completed') {
      // Task is being completed → confetti!
      soundManager.playClick();
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#2DD4BF', '#10B981', '#8b5cf6'],
        scalar: 0.8,
        gravity: 1.2,
        ticks: 120
      });
    }
  }, [plannerTasks, togglePlannerTask]);

  const handleOpenAddForDate = (dateStr: string) => {
    setTargetDate(dateStr);
    setShowAddModal(true);
  };

  const handleAddSuggestion = (topicName: string, subjectName: string, subjectColor: string, topicId?: string) => {
    addPlannerTask({
      topicId,
      topicName,
      subjectName,
      subjectColor,
      status: 'today',
      scheduledDate: getTodayDateString(),
      estimatedMinutes: 45,
      isCustom: false,
      priority: 'high',
      category: 'revision'
    });
    soundManager.playClick();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() && !selectedSyllabusTopicId) return;

    if (selectedSyllabusTopicId) {
      const topicObj = allTopics.find(t => t.topic.id === selectedSyllabusTopicId);
      if (topicObj) {
        addPlannerTask({
          topicId: topicObj.topic.id,
          topicName: topicObj.topic.name,
          subjectName: topicObj.subjectName,
          subjectColor: topicObj.subjectColor,
          status: targetColumn,
          scheduledDate: targetDate || getTodayDateString(),
          estimatedMinutes: estimatedMins,
          isCustom: false,
          priority,
          category
        });
      }
    } else {
      addPlannerTask({
        topicName: customTitle.trim(),
        subjectName: 'Daily Goal',
        subjectColor: '#D4AF37',
        status: targetColumn,
        scheduledDate: targetDate || getTodayDateString(),
        estimatedMinutes: estimatedMins,
        isCustom: true,
        priority,
        category
      });
    }

    setCustomTitle('');
    setSelectedSyllabusTopicId('');
    setTopicSearchQuery('');
    setShowAddModal(false);
    soundManager.playClick();
  };

  /* ──── BADGE HELPERS ──── */

  const getPriorityBadge = (p?: TaskPriority) => {
    switch (p) {
      case 'high': return { label: '🔥 High', classes: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' };
      case 'medium': return { label: '⚡ Medium', classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' };
      case 'low': return { label: '☕ Low', classes: 'bg-slate-200 dark:bg-[#2A2A2A] text-[#6B7280] border-slate-300 dark:border-[#383838]' };
      default: return { label: '⚡ Medium', classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' };
    }
  };

  const getCategoryBadge = (c?: TaskCategory) => {
    switch (c) {
      case 'concept': return { label: '📖 Theory', color: 'text-indigo-500 bg-indigo-500/10' };
      case 'practice': return { label: '✍️ Practice', color: 'text-emerald-500 bg-emerald-500/10' };
      case 'mock': return { label: '📝 Mock', color: 'text-purple-500 bg-purple-500/10' };
      case 'revision': return { label: '🔄 Revision', color: 'text-amber-500 bg-amber-500/10' };
      default: return { label: '📖 Theory', color: 'text-indigo-500 bg-indigo-500/10' };
    }
  };

  const columns: Array<{
    id: PlannerColumnStatus; title: string; icon: React.ElementType;
    gradient: string; bgLight: string; borderCol: string; tasks: PlannerTask[];
  }> = [
    { id: 'today', title: "Today's Targets", icon: Target, gradient: 'from-cyan-500 to-blue-500', bgLight: 'bg-cyan-500/8', borderCol: 'border-cyan-500/25', tasks: todayTasks },
    { id: 'in_progress', title: 'Deep Focus', icon: Zap, gradient: 'from-purple-500 to-pink-500', bgLight: 'bg-purple-500/8', borderCol: 'border-purple-500/25', tasks: inProgressTasks },
    { id: 'upcoming', title: 'This Week', icon: Layers, gradient: 'from-amber-500 to-orange-500', bgLight: 'bg-amber-500/8', borderCol: 'border-amber-500/25', tasks: upcomingTasks },
    { id: 'completed', title: 'Conquered', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500', bgLight: 'bg-emerald-500/8', borderCol: 'border-emerald-500/25', tasks: completedTasks }
  ];

  const greeting = getGreeting();
  const examCountdown = getExamCountdown(currentExam?.examDate);
  const dailyChallenge = getDailyChallenge();

  /* ────────────────── RENDER ────────────────── */

  return (
    <div className="space-y-5 sm:space-y-6 pb-20">

      {/* ═══════════════ 1. MOTIVATIONAL HERO DASHBOARD ═══════════════ */}
      <div className="relative overflow-hidden rounded-[28px] bg-white/60 dark:bg-[#161616]/80 backdrop-blur-2xl border border-white/30 dark:border-[#2A2A2A] shadow-2xl shadow-[#D4AF37]/5">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-[#D4AF37]/15 to-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative p-5 sm:p-7">
          {/* Greeting Row */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{greeting.emoji}</span>
            <h2 className="text-lg sm:text-2xl font-black text-[#171717] dark:text-[#F5E6C8] tracking-tight">
              {greeting.text}!
            </h2>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 items-center">

            {/* Progress Ring */}
            <div className="flex flex-col items-center gap-2 col-span-2 sm:col-span-1 order-first">
              <CircularProgressRing percent={todayProgressPercent} size={110} stroke={7} />
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                {completedTodayCount}/{totalTodayCount} Targets Done
              </span>
            </div>

            {/* Study Streak */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-rose-500/5 dark:from-orange-500/15 dark:to-rose-500/5 border border-orange-500/15 dark:border-orange-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Streak</span>
              </div>
              <div className="text-2xl font-black text-[#171717] dark:text-[#F5E6C8] font-mono leading-none">
                {profile.currentStreak}<span className="text-xs font-bold text-[#6B7280] ml-1">days</span>
              </div>
              <span className="text-[10px] font-semibold text-orange-500/80">
                Best: {profile.longestStreak}d 🏅
              </span>
            </div>

            {/* XP & Level */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/5 dark:from-purple-500/15 dark:to-indigo-500/5 border border-purple-500/15 dark:border-purple-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-purple-500" />
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Level {profile.level}</span>
              </div>
              <div className="text-sm font-black text-[#171717] dark:text-[#F5E6C8] leading-snug">
                {profile.levelTitle}
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#2A2A2A] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((profile.xp % 1000) / 10, 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-purple-500">{profile.xp} XP</span>
            </div>

            {/* Exam Countdown */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/5 dark:from-teal-500/15 dark:to-emerald-500/5 border border-teal-500/15 dark:border-teal-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-teal-500" />
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Exam In</span>
              </div>
              <div className={`text-2xl font-black font-mono leading-none ${examCountdown.color}`}>
                {examCountdown.days}<span className="text-xs font-bold text-[#6B7280] ml-1">days</span>
              </div>
              <span className={`text-[10px] font-semibold ${examCountdown.color}`}>
                {examCountdown.urgency}
              </span>
            </div>
          </div>

          {/* Study Time Summary */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              {(totalPlannedMinutes / 60).toFixed(1)}h planned
            </span>
            <span className="w-1 h-1 rounded-full bg-[#6B7280]/40" />
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {(completedMinutes / 60).toFixed(1)}h completed
            </span>
            <span className="w-1 h-1 rounded-full bg-[#6B7280]/40" />
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              {inProgressTasks.length} in focus
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════ 2. WEEKLY HEATMAP STRIP ═══════════════ */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-white/60 dark:bg-[#161616]/80 backdrop-blur-2xl border border-white/30 dark:border-[#2A2A2A] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-black text-[#171717] dark:text-[#F5E6C8] uppercase tracking-wider">Weekly Study Heatmap</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-semibold text-[#6B7280]">
            <span className="w-3 h-3 rounded bg-slate-100 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#333]" />
            <span>0h</span>
            <span className="w-3 h-3 rounded bg-teal-300 dark:bg-teal-700/50" />
            <span>1h</span>
            <span className="w-3 h-3 rounded bg-[#D4AF37] dark:bg-[#D4AF37]/70" />
            <span>2h+</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekHeatmapData.map(day => (
            <div key={day.dateStr} className="flex flex-col items-center gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                day.isToday ? 'text-[#D4AF37]' : 'text-[#6B7280]'
              }`}>
                {day.dayName}
              </span>
              <div
                className={`w-full aspect-square rounded-xl ${getHeatmapColor(day.studyMinutes)} border transition-all ${
                  day.isToday
                    ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-md shadow-[#D4AF37]/15'
                    : 'border-transparent hover:border-[#D4AF37]/30'
                } flex items-center justify-center`}
                title={`${day.dayName} ${day.dayNum} ${day.monthName}: ${day.studyMinutes}m study`}
              >
                <span className="text-[11px] font-black text-[#171717] dark:text-[#F5E6C8] font-mono">
                  {day.dayNum}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-[#6B7280]">
                {day.studyMinutes > 0 ? `${(day.studyMinutes / 60).toFixed(1)}h` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════ 3. DAILY CHALLENGE BANNER ═══════════════ */}
      {!dismissedChallenge && (
        <div className="relative overflow-hidden p-4 rounded-[20px] bg-gradient-to-r from-[#D4AF37]/10 via-purple-500/5 to-teal-500/10 dark:from-[#D4AF37]/15 dark:via-purple-500/8 dark:to-teal-500/10 border border-[#D4AF37]/20 dark:border-[#D4AF37]/30 shadow-md">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#D4AF37]/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl shrink-0">{dailyChallenge.icon}</span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">Daily Challenge</span>
                <span className="text-xs sm:text-sm font-bold text-[#171717] dark:text-[#F5E6C8] line-clamp-1">
                  {dailyChallenge.text}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-xl bg-[#D4AF37]/15 text-[10px] font-black text-[#D4AF37] border border-[#D4AF37]/30">
                +{dailyChallenge.xp} XP
              </span>
              <button
                onClick={() => setDismissedChallenge(true)}
                className="p-1 text-[#6B7280] hover:text-[#171717] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ 4. SMART SUGGESTIONS ═══════════════ */}
      {smartSuggestions.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-black text-[#171717] dark:text-[#F5E6C8] uppercase tracking-wider">Smart Suggestions</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {smartSuggestions.map((sug, idx) => (
              <div
                key={idx}
                className="shrink-0 p-3 rounded-2xl bg-white/70 dark:bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/40 dark:border-[#2A2A2A] shadow-sm hover:shadow-md hover:border-[#D4AF37]/40 transition-all group min-w-[220px] max-w-[260px] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    sug.type === 'revision'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}>
                    {sug.label}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sug.subjectColor }}
                  />
                </div>
                <p className="text-[11px] font-bold text-[#171717] dark:text-[#F5E6C8] line-clamp-2 leading-snug">
                  {sug.topicName}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-[#6B7280] truncate max-w-[120px]">{sug.subjectName}</span>
                  <button
                    onClick={() => handleAddSuggestion(sug.topicName, sug.subjectName, sug.subjectColor, sug.topicId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/30 text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ 5. VIEW CONTROLS BAR ═══════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex rounded-2xl bg-white/70 dark:bg-[#1A1A1A]/80 backdrop-blur-xl p-1 border border-white/40 dark:border-[#2A2A2A] shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#C9A22E] text-[#171717] shadow-md shadow-[#D4AF37]/25'
                  : 'text-[#6B7280] hover:text-[#171717] dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#C9A22E] text-[#171717] shadow-md shadow-[#D4AF37]/25'
                  : 'text-[#6B7280] hover:text-[#171717] dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          {completedTasks.length > 0 && (
            <button
              onClick={clearCompletedPlannerTasks}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/70 dark:bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/40 dark:border-[#2A2A2A] hover:border-rose-500/50 text-xs font-bold text-[#6B7280] hover:text-rose-500 transition-all cursor-pointer shadow-sm"
              title="Clear completed tasks from board"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Done ({completedTasks.length})</span>
            </button>
          )}
        </div>

        <button
          onClick={() => { setTargetDate(getTodayDateString()); setShowAddModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] font-black text-xs shadow-lg shadow-[#D4AF37]/25 hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all active:scale-[0.97] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Study Target</span>
        </button>
      </div>

      {/* ═══════════════ 6. SUBJECT FILTER BAR ═══════════════ */}
      {currentExam && currentExam.subjects.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[10px] font-bold text-[#6B7280] flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3" />
          </span>
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer border ${
              selectedSubjectFilter === 'all'
                ? 'bg-[#D4AF37] text-[#171717] border-[#D4AF37] shadow-sm'
                : 'bg-white/60 dark:bg-[#1A1A1A]/60 text-[#6B7280] border-white/40 dark:border-[#2A2A2A] hover:border-[#D4AF37]/50'
            }`}
          >
            All ({plannerTasks.length})
          </button>
          {currentExam.subjects.map(s => {
            const count = plannerTasks.filter(t => t.subjectName === s.name).length;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectFilter(s.name)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  selectedSubjectFilter === s.name
                    ? 'bg-[#D4AF37] text-[#171717] border-[#D4AF37] shadow-sm'
                    : 'bg-white/60 dark:bg-[#1A1A1A]/60 text-[#6B7280] border-white/40 dark:border-[#2A2A2A] hover:border-[#D4AF37]/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: s.color }} />
                {s.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ═══════════════ 7. KANBAN BOARD ═══════════════ */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(col => {
            const ColIcon = col.icon;
            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-[24px] bg-white/50 dark:bg-[#141414]/70 backdrop-blur-2xl border border-white/30 dark:border-[#2A2A2A] shadow-lg p-4 space-y-3 min-h-[420px] transition-all hover:shadow-xl`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#252525]">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl bg-gradient-to-br ${col.gradient} text-white shadow-sm`}>
                      <ColIcon className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-extrabold text-[#171717] dark:text-[#F5E6C8]">{col.title}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full ${col.bgLight} font-mono ${
                    col.tasks.length > 0 ? 'text-[#171717] dark:text-[#F5E6C8]' : 'text-[#6B7280]'
                  }`}>
                    {col.tasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[520px]">
                  {col.tasks.length === 0 ? (
                    <div className="h-36 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200/60 dark:border-[#252525] rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1E1E1E] flex items-center justify-center mb-2">
                        <ColIcon className="w-5 h-5 text-[#6B7280]/50" />
                      </div>
                      <p className="text-[11px] text-[#6B7280] font-medium">
                        {col.id === 'completed' ? 'Conquer tasks to fill this!' : 'Drop targets here to start'}
                      </p>
                    </div>
                  ) : (
                    col.tasks.map(task => {
                      const pBadge = getPriorityBadge(task.priority);
                      const cBadge = getCategoryBadge(task.category);
                      const isDone = task.status === 'completed';

                      return (
                        <div
                          key={task.id}
                          className={`relative overflow-hidden rounded-2xl border transition-all group ${
                            isDone
                              ? 'bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/20 opacity-80'
                              : 'bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-xl border-white/40 dark:border-[#2A2A2A] hover:border-[#D4AF37]/50 hover:shadow-md hover:-translate-y-0.5'
                          }`}
                          style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        >
                          {/* Subject color accent bar */}
                          <div
                            className="h-[3px] w-full"
                            style={{ background: `linear-gradient(90deg, ${task.subjectColor || '#D4AF37'}, ${task.subjectColor || '#D4AF37'}80)` }}
                          />

                          <div className="p-3.5 space-y-2.5">
                            {/* Title & Checkbox */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <button
                                  onClick={() => handleToggleWithConfetti(task.id)}
                                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer mt-0.5 ${
                                    isDone
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                                      : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/10'
                                  }`}
                                >
                                  {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>
                                <span className={`text-xs font-bold leading-snug ${
                                  isDone ? 'line-through text-[#6B7280]' : 'text-[#171717] dark:text-[#F5E6C8]'
                                }`}>
                                  {task.topicName}
                                </span>
                              </div>
                              <button
                                onClick={() => deletePlannerTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#6B7280] hover:text-rose-500 transition-all cursor-pointer shrink-0"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${pBadge.classes}`}>
                                {pBadge.label}
                              </span>
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${cBadge.color}`}>
                                {cBadge.label}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono text-[#6B7280] bg-slate-50 dark:bg-[#1E1E1E] ml-auto flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-[#D4AF37]" />
                                {task.estimatedMinutes}m
                              </span>
                            </div>

                            {/* Subject & Date */}
                            <div className="flex items-center justify-between text-[9px] text-[#6B7280]">
                              <span
                                className="px-2 py-0.5 rounded-lg font-semibold truncate max-w-[120px]"
                                style={{ backgroundColor: `${task.subjectColor || '#D4AF37'}15`, color: task.subjectColor || '#D4AF37' }}
                              >
                                {task.subjectName}
                              </span>
                              {task.scheduledDate && (
                                <span className="font-mono">📅 {task.scheduledDate}</span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="pt-2 border-t border-slate-100 dark:border-[#222] flex items-center justify-between gap-2">
                              {onOpenFocusChamber && !isDone ? (
                                <button
                                  onClick={() => onOpenFocusChamber(task.topicId)}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 hover:from-[#D4AF37]/25 hover:to-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Focus</span>
                                </button>
                              ) : <div />}
                              <div className="flex items-center gap-1 ml-auto text-[9px] font-bold">
                                {col.id !== 'today' && (
                                  <button onClick={() => movePlannerTask(task.id, 'today')} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#1E1E1E] hover:bg-cyan-500 hover:text-white text-[#6B7280] transition-all cursor-pointer">Today</button>
                                )}
                                {col.id !== 'in_progress' && (
                                  <button onClick={() => movePlannerTask(task.id, 'in_progress')} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#1E1E1E] hover:bg-purple-500 hover:text-white text-[#6B7280] transition-all cursor-pointer">Focus</button>
                                )}
                                {col.id !== 'upcoming' && (
                                  <button onClick={() => movePlannerTask(task.id, 'upcoming')} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#1E1E1E] hover:bg-amber-500 hover:text-white text-[#6B7280] transition-all cursor-pointer">Week</button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ═══════════════ 8. WEEKLY CALENDAR VIEW ═══════════════ */
        <div className="space-y-4">
          {/* Week Navigation */}
          <div className="p-4 rounded-[24px] bg-white/60 dark:bg-[#161616]/80 backdrop-blur-2xl border border-white/30 dark:border-[#2A2A2A] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                className="p-2 rounded-xl bg-white/70 dark:bg-[#1A1A1A]/80 border border-white/40 dark:border-[#2A2A2A] hover:border-[#D4AF37]/50 text-[#6B7280] hover:text-[#171717] dark:hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  weekOffset === 0
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#C9A22E] text-[#171717] shadow-md shadow-[#D4AF37]/25'
                    : 'bg-white/70 dark:bg-[#1A1A1A]/80 text-[#6B7280] border border-white/40 dark:border-[#2A2A2A]'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                className="p-2 rounded-xl bg-white/70 dark:bg-[#1A1A1A]/80 border border-white/40 dark:border-[#2A2A2A] hover:border-[#D4AF37]/50 text-[#6B7280] hover:text-[#171717] dark:hover:text-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-black text-[#171717] dark:text-[#F5E6C8] font-mono flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span>{weekDays[0]?.monthName} {weekDays[0]?.dayNum} – {weekDays[6]?.monthName} {weekDays[6]?.dayNum}, {weekDays[0]?.dateObj.getFullYear()}</span>
            </div>
          </div>

          {/* 7-Day Columns - Horizontal scrollable on mobile */}
          <div
            ref={calendarScrollRef}
            className="flex lg:grid lg:grid-cols-7 gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory"
          >
            {weekDays.map(day => {
              const dayTasks = filteredTasks.filter(t => t.scheduledDate === day.dateStr);
              const completedInDay = dayTasks.filter(t => t.status === 'completed').length;
              const dayTotalMinutes = dayTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);

              // Workload indicator
              const workloadColor = dayTotalMinutes === 0 ? 'bg-slate-300 dark:bg-[#333]'
                : dayTotalMinutes < 60 ? 'bg-emerald-500'
                : dayTotalMinutes < 150 ? 'bg-amber-500'
                : 'bg-rose-500';

              return (
                <div
                  key={day.dateStr}
                  data-today={day.isToday ? 'true' : 'false'}
                  className={`snap-center shrink-0 w-[260px] sm:w-[280px] lg:w-auto rounded-[24px] p-3.5 flex flex-col justify-between space-y-3 min-h-[400px] lg:min-h-[420px] border backdrop-blur-2xl transition-all ${
                    day.isToday
                      ? 'bg-white/70 dark:bg-[#1A1A1A]/90 border-[#D4AF37]/60 shadow-xl ring-1 ring-[#D4AF37]/20'
                      : 'bg-white/40 dark:bg-[#141414]/60 border-white/30 dark:border-[#2A2A2A] hover:border-[#D4AF37]/30'
                  }`}
                >
                  {/* Day Header */}
                  <div className="pb-2.5 border-b border-slate-100 dark:border-[#252525] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                          day.isToday ? 'text-[#D4AF37]' : 'text-[#6B7280]'
                        }`}>
                          {day.dayName}
                        </span>
                        {day.isToday && (
                          <span className="px-1.5 py-0.5 text-[8px] font-black rounded-md bg-gradient-to-r from-[#D4AF37] to-[#C9A22E] text-[#171717] shadow-sm">
                            TODAY
                          </span>
                        )}
                      </div>
                      <span className={`w-2 h-2 rounded-full ${workloadColor}`} title={`${dayTotalMinutes}m planned`} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#171717] dark:text-[#F5E6C8] font-mono leading-none">
                          {day.dayNum}
                        </span>
                        <span className="text-[10px] font-normal text-[#6B7280]">{day.monthName}</span>
                      </div>
                      <MiniDonut completed={completedInDay} total={dayTasks.length} />
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-semibold text-[#6B7280]">
                      <span>{completedInDay}/{dayTasks.length} Done</span>
                      <span className="font-mono text-[#D4AF37]">{(dayTotalMinutes / 60).toFixed(1)}h</span>
                    </div>
                  </div>

                  {/* Day Task List */}
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[260px]">
                    {dayTasks.length === 0 ? (
                      <div className="h-24 flex flex-col items-center justify-center text-center p-2 border-2 border-dashed border-slate-200/50 dark:border-[#252525] rounded-2xl">
                        <Calendar className="w-5 h-5 text-[#6B7280]/30 mb-1" />
                        <span className="text-[10px] text-[#6B7280]">No targets scheduled</span>
                      </div>
                    ) : (
                      dayTasks.map(task => {
                        const isDone = task.status === 'completed';
                        return (
                          <div
                            key={task.id}
                            className={`relative overflow-hidden rounded-xl border space-y-1 transition-all text-left group ${
                              isDone
                                ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70'
                                : 'bg-white/70 dark:bg-[#1A1A1A]/70 border-white/40 dark:border-[#2A2A2A] hover:border-[#D4AF37]/40'
                            }`}
                          >
                            <div className="h-[2px] w-full" style={{ background: task.subjectColor || '#D4AF37' }} />
                            <div className="p-2.5 space-y-1">
                              <div className="flex items-start justify-between gap-1.5">
                                <button
                                  onClick={() => handleToggleWithConfetti(task.id)}
                                  className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 cursor-pointer mt-0.5 transition-all ${
                                    isDone
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                                  }`}
                                >
                                  {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </button>
                                <span className={`text-[11px] font-bold line-clamp-2 leading-tight flex-1 ${
                                  isDone ? 'line-through text-[#6B7280]' : 'text-[#171717] dark:text-[#F5E6C8]'
                                }`}>
                                  {task.topicName}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[9px] text-[#6B7280]">
                                <span
                                  className="px-1.5 py-0.5 rounded-md font-semibold truncate max-w-[90px]"
                                  style={{ backgroundColor: `${task.subjectColor || '#D4AF37'}15`, color: task.subjectColor || '#D4AF37' }}
                                >
                                  {task.subjectName}
                                </span>
                                <span className="font-mono text-[#D4AF37]">{task.estimatedMinutes}m</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Schedule Button */}
                  <button
                    onClick={() => handleOpenAddForDate(day.dateStr)}
                    className="w-full py-2 rounded-xl bg-white/60 dark:bg-[#1A1A1A]/60 hover:bg-gradient-to-r hover:from-[#D4AF37] hover:to-[#C9A22E] hover:text-[#171717] border border-slate-200/60 dark:border-[#252525] text-[11px] font-bold text-[#6B7280] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ 9. CREATE TARGET MODAL ═══════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-lg overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg rounded-[28px] bg-white/95 dark:bg-[#161616]/95 backdrop-blur-2xl border border-white/30 dark:border-[#2A2A2A] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#252525] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#C9A22E] flex items-center justify-center text-[#171717] shadow-md shadow-[#D4AF37]/25">
                  <Target className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#171717] dark:text-[#F5E6C8]">
                    Schedule Study Target
                  </h4>
                  <p className="text-[10px] text-[#6B7280]">
                    Plan specific topics for your calendar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-[#6B7280] hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">

              {/* Date Picker */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#1A1A1A]/80 border border-slate-200/60 dark:border-[#2A2A2A] space-y-2.5">
                <label className="text-xs font-black text-[#171717] dark:text-[#F5E6C8] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Target Date</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetDate(getTodayDateString())}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      targetDate === getTodayDateString()
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#C9A22E] text-[#171717] border-[#D4AF37] shadow-sm'
                        : 'bg-white dark:bg-[#1E1E1E] text-[#6B7280] border-slate-200 dark:border-[#2A2A2A]'
                    }`}
                  >
                    📍 Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(); d.setDate(d.getDate() + 1); setTargetDate(formatYMD(d));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      targetDate === (() => { const d = new Date(); d.setDate(d.getDate() + 1); return formatYMD(d); })()
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#C9A22E] text-[#171717] border-[#D4AF37] shadow-sm'
                        : 'bg-white dark:bg-[#1E1E1E] text-[#6B7280] border-slate-200 dark:border-[#2A2A2A]'
                    }`}
                  >
                    ➡️ Tomorrow
                  </button>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="p-2 rounded-xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#2A2A2A] text-xs font-bold text-[#171717] dark:text-white"
                  />
                </div>
              </div>

              {/* Topic Picker */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#1A1A1A]/80 border border-slate-200/60 dark:border-[#2A2A2A] space-y-3">
                <label className="text-xs font-black text-[#171717] dark:text-[#F5E6C8]">
                  Select from Syllabus Topics
                </label>
                <div className="relative flex items-center">
                  <Search className="absolute left-3 w-4 h-4 text-[#D4AF37] pointer-events-none" />
                  <input
                    type="text"
                    value={topicSearchQuery}
                    onChange={(e) => setTopicSearchQuery(e.target.value)}
                    placeholder="Search topic or subject..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#2A2A2A] text-xs font-semibold text-[#171717] dark:text-white placeholder-[#6B7280] focus:ring-2 focus:ring-[#D4AF37]/50"
                  />
                  {topicSearchQuery && (
                    <button type="button" onClick={() => setTopicSearchQuery('')} className="absolute right-2.5 text-[#6B7280] hover:text-[#171717] dark:hover:text-white p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {selectedTopicObj && (
                  <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-between text-xs font-bold text-[#D4AF37]">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">Selected: {selectedTopicObj.subjectName} • {selectedTopicObj.topic.name}</span>
                    </div>
                    <button type="button" onClick={() => setSelectedSyllabusTopicId('')} className="text-[10px] text-rose-500 hover:underline shrink-0 cursor-pointer">Clear</button>
                  </div>
                )}

                <div className="max-h-36 overflow-y-auto space-y-1 p-1.5 rounded-xl bg-white/80 dark:bg-[#1E1E1E] border border-slate-200/60 dark:border-[#2A2A2A]">
                  {filteredTopicsForModal.length === 0 ? (
                    <p className="text-center py-4 text-xs text-[#6B7280]">No matching topics found</p>
                  ) : (
                    filteredTopicsForModal.map((t) => {
                      const isSelected = selectedSyllabusTopicId === t.topic.id;
                      return (
                        <div
                          key={t.topic.id}
                          onClick={() => { setSelectedSyllabusTopicId(t.topic.id); setCustomTitle(''); }}
                          className={`p-2 rounded-lg flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#D4AF37] text-[#171717] font-bold shadow-sm'
                              : 'hover:bg-slate-100 dark:hover:bg-[#252525] text-[#171717] dark:text-[#F5E6C8]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.subjectColor || '#D4AF37' }} />
                            <span className="truncate">{t.topic.name}</span>
                          </div>
                          <span className={`text-[10px] shrink-0 font-mono ${isSelected ? 'text-[#171717]' : 'text-[#6B7280]'}`}>
                            {t.subjectName}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-[#2A2A2A]" />
                <span className="flex-shrink mx-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">OR Custom Goal</span>
                <div className="flex-grow border-t border-slate-200 dark:border-[#2A2A2A]" />
              </div>

              {/* Custom Title */}
              <input
                type="text"
                value={customTitle}
                onChange={e => { setCustomTitle(e.target.value); if (e.target.value) setSelectedSyllabusTopicId(''); }}
                placeholder="e.g. Solve 50 Mensuration PYQs & Notes"
                className="w-full p-3 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#2A2A2A] text-xs font-semibold text-[#171717] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/50"
              />

              {/* Priority & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1.5 uppercase">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full p-2.5 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#2A2A2A] text-xs font-bold text-[#171717] dark:text-white cursor-pointer"
                  >
                    <option value="high">🔥 High</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="low">☕ Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1.5 uppercase">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as TaskCategory)}
                    className="w-full p-2.5 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#2A2A2A] text-xs font-bold text-[#171717] dark:text-white cursor-pointer"
                  >
                    <option value="concept">📖 Theory</option>
                    <option value="practice">✍️ Practice</option>
                    <option value="mock">📝 Mock Test</option>
                    <option value="revision">🔄 Revision</option>
                  </select>
                </div>
              </div>

              {/* Column & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1.5 uppercase">Board Column</label>
                  <select
                    value={targetColumn}
                    onChange={e => setTargetColumn(e.target.value as PlannerColumnStatus)}
                    className="w-full p-2.5 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#2A2A2A] text-xs font-bold text-[#171717] dark:text-white cursor-pointer"
                  >
                    <option value="today">Today's Target</option>
                    <option value="in_progress">Deep Focus</option>
                    <option value="upcoming">This Week</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1.5 uppercase">Est. Minutes</label>
                  <input
                    type="number"
                    min={10} max={300} step={5}
                    value={estimatedMins}
                    onChange={e => setEstimatedMins(Number(e.target.value))}
                    className="w-full p-2.5 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#2A2A2A] text-xs font-bold text-[#171717] dark:text-white"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#252525]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#2A2A2A] text-[#6B7280] hover:text-[#171717] dark:hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedSyllabusTopicId && !customTitle.trim()}
                  className="px-5 py-2.5 text-xs font-black bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] disabled:opacity-40 text-[#171717] rounded-xl shadow-lg shadow-[#D4AF37]/25 cursor-pointer transition-all"
                >
                  Schedule Target 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
