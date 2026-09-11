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
  ChevronDown,
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
  Star,
  TrendingUp,
  Sunrise,
  Sun,
  Coffee,
  Moon,
  ShieldCheck,
  Award,
  ListPlus,
  Trophy,
  Calculator,
  BrainCircuit,
  Globe
} from 'lucide-react';
import { PlannerColumnStatus, PlannerTask, Topic, TaskPriority, TaskCategory } from '../../types/syllabus';
import { getTodayDateString } from '../../utils/dateUtils';
import { soundManager } from '../../utils/soundEffects';
import { Top3TargetsWidget } from '../dashboard/Top3TargetsWidget';
import { RoutineMakerView } from '../routine/RoutineMakerView';
import confetti from 'canvas-confetti';

interface PlannerViewProps {
  onOpenFocusChamber?: (topicId?: string) => void;
  onOpenTopicDrawer?: (topic: Topic, subName: string, chName: string) => void;
}

const formatYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (['and', '&', 'of', 'in', 'the', 'for', 'to', 'a', 'an'].includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

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
    top3Targets,
    addPlannerTask,
    togglePlannerTask,
    movePlannerTask,
    deletePlannerTask,
    clearCompletedPlannerTasks
  } = useSyllabus();

  // View Mode
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar' | 'routine'>('kanban');
  const [mobileActiveColumn, setMobileActiveColumn] = useState<PlannerColumnStatus | 'all'>('all');
  const [showTop3Section, setShowTop3Section] = useState(false);
  const top3CompletedCount = useMemo(() => top3Targets ? top3Targets.filter(t => t.text && t.text.trim() && t.completed).length : 0, [top3Targets]);

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

  const calendarScrollRef = useRef<HTMLDivElement>(null);

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

  const todayTasks = useMemo(() => filteredTasks.filter(t => t.status === 'today'), [filteredTasks]);
  const inProgressTasks = useMemo(() => filteredTasks.filter(t => t.status === 'in_progress'), [filteredTasks]);
  const upcomingTasks = useMemo(() => filteredTasks.filter(t => t.status === 'upcoming'), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter(t => t.status === 'completed'), [filteredTasks]);

  const totalTodayCount = todayTasks.length + inProgressTasks.length + completedTasks.length;
  const completedTodayCount = completedTasks.length;
  const todayProgressPercent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  const totalPlannedMinutes = useMemo(() => plannerTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0), [plannerTasks]);
  const completedMinutes = useMemo(() => plannerTasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0), [plannerTasks]);

  // Smart suggestions
  const smartSuggestions = useMemo(() => {
    const suggestions: Array<{ type: 'revision' | 'weak'; label: string; topicName: string; subjectName: string; subjectColor: string; topicId?: string }> = [];
    const plannerTopicNames = new Set(plannerTasks.map(t => t.topicName));

    dueRevisions.slice(0, 2).forEach(rev => {
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

    weakTopics.slice(0, 2).forEach(wt => {
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

    return suggestions;
  }, [dueRevisions, weakTopics, plannerTasks]);

  const filteredTopicsForModal = useMemo(() => {
    if (!topicSearchQuery.trim()) return allTopics;
    const q = topicSearchQuery.toLowerCase();
    return allTopics.filter(t =>
      t.topic.name.toLowerCase().includes(q) ||
      t.subjectName.toLowerCase().includes(q) ||
      t.chapterName.toLowerCase().includes(q)
    );
  }, [allTopics, topicSearchQuery]);

  /* ──── HANDLERS ──── */

  const handleToggleWithConfetti = useCallback((taskId: string) => {
    const task = plannerTasks.find(t => t.id === taskId);
    togglePlannerTask(taskId);

    if (task && task.status !== 'completed') {
      soundManager.playCompleteChime();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2563EB', '#7AA2F7', '#10B981', '#FACC15'],
        scalar: 0.8,
        gravity: 1.2,
        ticks: 120
      });
    }
  }, [plannerTasks, togglePlannerTask]);

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
        subjectColor: '#2563EB',
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

  const getPriorityBadge = (p?: TaskPriority) => {
    switch (p) {
      case 'high': return { label: 'High', classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20' };
      case 'medium': return { label: 'Medium', classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20' };
      case 'low': return { label: 'Low', classes: 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border-slate-200/70 dark:border-white/[0.06]' };
      default: return { label: 'Medium', classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20' };
    }
  };

  const getCategoryBadge = (c?: TaskCategory) => {
    switch (c) {
      case 'concept': return { label: 'Theory', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-200/60 dark:border-indigo-500/20' };
      case 'practice': return { label: 'Practice', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20' };
      case 'mock': return { label: 'Mock', color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-200/60 dark:border-purple-500/20' };
      case 'revision': return { label: 'Revision', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20' };
      default: return { label: 'Theory', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-200/60 dark:border-indigo-500/20' };
    }
  };

  const columns: Array<{
    id: PlannerColumnStatus; title: string; icon: React.ElementType;
    badgeCol: string; tasks: PlannerTask[];
  }> = [
    { id: 'today', title: "Today's Targets", icon: Target, badgeCol: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20', tasks: todayTasks },
    { id: 'in_progress', title: 'Deep Focus', icon: Zap, badgeCol: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20', tasks: inProgressTasks },
    { id: 'upcoming', title: 'This Week', icon: Layers, badgeCol: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20', tasks: upcomingTasks },
    { id: 'completed', title: 'Conquered', icon: CheckCircle2, badgeCol: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', tasks: completedTasks }
  ];

  const getSubjectIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('quant') || lower.includes('math')) return Calculator;
    if (lower.includes('gk') || lower.includes('general awareness') || lower.includes('knowledge') || lower.includes('gs') || lower.includes('pyq')) return Globe;
    if (lower.includes('reasoning') || lower.includes('intelligence')) return BrainCircuit;
    if (lower.includes('english') || lower.includes('editorial') || lower.includes('comprehension')) return BookOpen;
    return Layers;
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-12 max-w-6xl mx-auto font-sans animate-fade-in">
      
      {/* 🖨️ PRINT-ONLY DAILY STUDY TARGETS CHECKLIST */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-black">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-700 block">
              DAILY STUDY PLANNER • PHYSICAL DESK CHECKLIST
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-black mt-1">
              📅 DAILY TARGET SPRINT &amp; STUDY QUEUE
            </h1>
          </div>
          <div className="text-right text-xs font-mono text-gray-600">
            <div>DATE: {getTodayDateString()}</div>
            <div>COMPLETED: {completedTasks.length}/{plannerTasks.length} TARGETS</div>
          </div>
        </div>
      </div>

      {/* ═══════════════ 1. EXECUTIVE STUDY PLANNER COMMAND BAR ═══════════════ */}
      <div className="relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#11131F]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4 overflow-hidden">
        {/* Top Subtle Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-90" />

        {/* Command Bar Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="space-y-1.5 min-w-0">
            {/* Meta Tags Pill Row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Daily Study Sprint</span>
                <span className="text-amber-400 dark:text-amber-500">•</span>
                <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 text-[11px] font-mono font-bold">
                <Target className="w-3 h-3 text-blue-500" />
                <span>{plannerTasks.length} {plannerTasks.length === 1 ? 'Target' : 'Targets'}</span>
              </span>

              {currentExam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] font-mono font-bold">
                  <span>{currentExam.name}</span>
                </span>
              )}
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F5F5F7] tracking-tight">
                Study Planner &amp; Daily Sprints
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                Target tracking, daily sprints, time blocking, and queue management.
              </p>
            </div>
          </div>

          {/* Right Action: Add Target Button + Mini Velocity Gauge */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Circular Progress Miniature */}
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06]">
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-700/60"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-700 ease-out"
                    strokeDasharray={`${todayProgressPercent}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[11px] font-mono font-black text-slate-900 dark:text-white tabular-nums">
                  {todayProgressPercent}%
                </span>
              </div>
              <div className="text-left font-mono">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                  {completedTodayCount} of {totalTodayCount} Done
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Today's Velocity
                </p>
              </div>
            </div>

            {/* + Add Study Target Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setTargetDate(getTodayDateString());
                setShowAddModal(true);
              }}
              className="w-full sm:w-auto px-4 sm:px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs sm:text-[13px] shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 tap-bounce shrink-0"
              title="Add Study Target"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Study Target</span>
            </button>
          </div>
        </div>

        {/* 4-KPI Executive Bento Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
          {/* Velocity */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Velocity
              </p>
              <p className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white tabular-nums">
                {todayProgressPercent}%
              </p>
              <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                {completedTodayCount}/{totalTodayCount} Done
              </p>
            </div>
          </div>

          {/* Streak */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Flame className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Consistency
              </p>
              <p className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white tabular-nums">
                {profile.currentStreak} <span className="text-[11px] font-normal text-slate-500">Days</span>
              </p>
              <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold truncate">
                Best: {profile.longestStreak}d
              </p>
            </div>
          </div>

          {/* Planned Hours */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Clock className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Planned
              </p>
              <p className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white tabular-nums">
                {(totalPlannedMinutes / 60).toFixed(1)} <span className="text-[11px] font-normal text-slate-500">hrs</span>
              </p>
              <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold truncate">
                {(completedMinutes / 60).toFixed(1)}h finished
              </p>
            </div>
          </div>

          {/* XP Level */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Award className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                XP Level
              </p>
              <p className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white tabular-nums">
                Lvl {profile.level}
              </p>
              <p className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold truncate">
                {profile.xp} XP Earned
              </p>
            </div>
          </div>
        </div>

        {/* Smart Suggestions Strip */}
        {smartSuggestions.length > 0 && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Suggested:</span>
            </span>
            {smartSuggestions.map((sug, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] text-xs shrink-0"
              >
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px] sm:max-w-[200px]">
                  {sug.topicName}
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  {sug.subjectName}
                </span>
                <button
                  type="button"
                  onClick={() => handleAddSuggestion(sug.topicName, sug.subjectName, sug.subjectColor, sug.topicId)}
                  className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer transition-all active:scale-95"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* ═══════════════ 2. VIEW CONTROLS & SUBJECT FILTER BAR ═══════════════ */}
      <div className="flex flex-row items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        
        {/* Kanban vs Calendar vs Master Routine Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/[0.06] shadow-2xs shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              setViewMode('kanban');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-[#1E202E] text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
            <span>Target Board</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setViewMode('calendar');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-[#1E202E] text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
            <span>Weekly Calendar</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setViewMode('routine');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewMode === 'routine'
                ? 'bg-white dark:bg-[#1E202E] text-blue-600 dark:text-blue-400 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Master Routine &amp; Timetable</span>
          </button>
        </div>

        {/* Clear Conquered Button (if any) */}
        {viewMode !== 'routine' && completedTasks.length > 0 && (
          <button
            onClick={() => {
              soundManager.playClick();
              clearCompletedPlannerTasks();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] text-[11px] sm:text-xs font-bold text-slate-600 hover:text-rose-500 dark:text-slate-400 hover:border-rose-500/30 transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Done ({completedTasks.length})</span>
          </button>
        )}
      </div>

      {/* ═══════════════ 3. SUBJECT FILTER PILLS ═══════════════ */}
      {viewMode !== 'routine' && currentExam && currentExam.subjects.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedSubjectFilter('all');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 active:scale-95 ${
              selectedSubjectFilter === 'all'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-blue-200/60 dark:border-blue-500/30 shadow-xs font-black'
                : 'bg-white dark:bg-[#151622] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/[0.08] hover:border-blue-400/50 dark:hover:border-blue-500/30'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>All Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
              selectedSubjectFilter === 'all' ? 'bg-blue-600/15 text-blue-700 dark:text-blue-300 font-bold' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
            }`}>
              {plannerTasks.length}
            </span>
          </button>
          {currentExam.subjects.map(s => {
            const count = plannerTasks.filter(t => t.subjectName === s.name).length;
            const isSelected = selectedSubjectFilter === s.name;
            const SubjIcon = getSubjectIcon(s.name);
            return (
              <button
                key={s.id}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedSubjectFilter(s.name);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-blue-200/60 dark:border-blue-500/30 shadow-xs font-black'
                    : 'bg-white dark:bg-[#151622] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/[0.08] hover:border-blue-400/50 dark:hover:border-blue-500/30'
                }`}
              >
                <SubjIcon className="w-3.5 h-3.5" style={{ color: isSelected ? undefined : s.color }} />
                <span>{formatTitleCase(s.name)}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                  isSelected ? 'bg-blue-600/15 text-blue-700 dark:text-blue-300 font-bold' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ═══════════════ 4. MAIN WORKSPACE VIEW (KANBAN / CALENDAR / ROUTINE) ═══════════════ */}
      {viewMode === 'routine' ? (
        <RoutineMakerView onOpenFocusChamber={onOpenFocusChamber} />
      ) : viewMode === 'kanban' ? (
        <div className="space-y-3.5">
          {/* Collapsible Top 3 Non-Negotiables Core Strip */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#11131F]/90 shadow-xs overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setShowTop3Section(prev => !prev);
              }}
              className="w-full flex items-center justify-between px-3.5 sm:px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                  <Target className="w-3.5 h-3.5 stroke-[2.4]" />
                </div>
                <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white truncate">
                  Today's 3 Non-Negotiable Core Targets
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
                  {top3CompletedCount}/3 Done
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold shrink-0">
                <span className="hidden sm:inline">{showTop3Section ? 'Hide' : 'Show'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showTop3Section ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {showTop3Section && (
              <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/40 dark:bg-black/20">
                <Top3TargetsWidget />
              </div>
            )}
          </div>
          {/* Mobile Column Segmented Filter (Hidden on Desktop) */}
          <div className="sm:hidden flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-[#151622] border border-slate-200/80 dark:border-white/[0.08] overflow-x-auto no-scrollbar shadow-2xs">
            <button
              onClick={() => {
                soundManager.playClick();
                setMobileActiveColumn('all');
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                mobileActiveColumn === 'all'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/30 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>All Columns</span>
              <span className={`px-1.5 rounded-md text-[9.5px] font-mono tabular-nums ${
                mobileActiveColumn === 'all' ? 'bg-blue-600/15 text-blue-700 dark:text-blue-300 font-bold' : 'bg-slate-100 dark:bg-white/[0.06]'
              }`}>
                {filteredTasks.length}
              </span>
            </button>

            {columns.map(col => {
              const isActive = mobileActiveColumn === col.id;
              const ColIcon = col.icon;
              return (
                <button
                  key={col.id}
                  onClick={() => {
                    soundManager.playClick();
                    setMobileActiveColumn(col.id);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/30 font-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ColIcon className="w-3 h-3" />
                  <span>{col.title.replace("'s Targets", '').replace(' Targets', '').replace('This ', '')}</span>
                  <span className={`px-1.5 rounded-md text-[9.5px] font-mono tabular-nums ${
                    isActive ? 'bg-blue-600/15 text-blue-700 dark:text-blue-300 font-bold' : 'bg-slate-100 dark:bg-white/[0.06]'
                  }`}>
                    {col.tasks.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {columns.map(col => {
              const ColIcon = col.icon;
              const isHiddenOnMobile = mobileActiveColumn !== 'all' && mobileActiveColumn !== col.id;
              return (
                <div
                  key={col.id}
                  className={`${isHiddenOnMobile ? 'hidden sm:flex' : 'flex'} flex-col rounded-2xl bg-slate-50/60 dark:bg-[#11131F]/90 border border-slate-200/80 dark:border-white/[0.08] shadow-xs p-3 sm:p-3.5 space-y-3 min-h-[160px] sm:min-h-[380px]`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl ${col.badgeCol}`}>
                        <ColIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        {col.title}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 text-[10.5px] font-bold rounded-full font-mono tabular-nums ${col.badgeCol}`}>
                      {col.tasks.length}
                    </span>
                  </div>

                  {/* Task Cards */}
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[520px] no-scrollbar">
                    {col.tasks.length === 0 ? (
                      <div className="py-6 px-3 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl bg-white/50 dark:bg-white/[0.02] space-y-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1A1B29] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-center text-slate-500 dark:text-slate-400">
                          {col.id === 'upcoming' && <ListPlus className="w-4 h-4 text-indigo-500" />}
                          {col.id === 'today' && <Target className="w-4 h-4 text-blue-500" />}
                          {col.id === 'in_progress' && <Zap className="w-4 h-4 text-purple-500 fill-current" />}
                          {col.id === 'completed' && <Trophy className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {col.id === 'upcoming' && 'Queue Clear'}
                            {col.id === 'today' && 'Runway Open'}
                            {col.id === 'in_progress' && 'Ready For Sprint'}
                            {col.id === 'completed' && 'Awaiting Conquests'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[160px] leading-tight mx-auto">
                            {col.id === 'upcoming' && 'Schedule targets for upcoming days.'}
                            {col.id === 'today' && "Ready for today's high-yield targets."}
                            {col.id === 'in_progress' && 'Start a focus sprint on any target.'}
                            {col.id === 'completed' && 'Finished tasks will celebrate here.'}
                          </p>
                        </div>
                        {(col.id === 'upcoming' || col.id === 'today') && (
                          <button
                            onClick={() => {
                              soundManager.playClick();
                              setTargetColumn(col.id as any);
                              setTargetDate(getTodayDateString());
                              setShowAddModal(true);
                            }}
                            className="mt-0.5 px-3 py-1 rounded-lg bg-white dark:bg-[#1E2030] hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-[11px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 transition-all cursor-pointer active:scale-95 shadow-2xs"
                          >
                            + Add Target
                          </button>
                        )}
                      </div>
                    ) : (
                      col.tasks.map(task => {
                        const pBadge = getPriorityBadge(task.priority);
                        const isDone = task.status === 'completed';

                        return (
                          <div
                            key={task.id}
                            className={`relative p-3 rounded-xl border transition-all space-y-2 group ${
                              isDone
                                ? 'bg-emerald-500/5 dark:bg-emerald-500/[0.03] border-emerald-500/20 opacity-80'
                                : 'bg-white dark:bg-[#161826] border-slate-200/80 dark:border-white/[0.08] hover:border-blue-500/40 dark:hover:border-blue-400/30 shadow-2xs hover:shadow-xs'
                            }`}
                          >
                            {/* Subtle Left Accent Indicator Bar */}
                            {!isDone && (
                              <div
                                className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                                style={{ backgroundColor: task.subjectColor || '#3B82F6' }}
                              />
                            )}

                            {/* Title & Checkbox */}
                            <div className="flex items-start justify-between gap-2 pl-1">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <button
                                  onClick={() => handleToggleWithConfetti(task.id)}
                                  className={`w-4 sm:w-4.5 h-4 sm:h-4.5 rounded-[5px] border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer mt-0.5 ${
                                    isDone
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-slate-300 dark:border-white/20 hover:border-emerald-500 hover:bg-emerald-500/10'
                                  }`}
                                  aria-label={isDone ? 'Mark target as incomplete' : 'Mark target as completed'}
                                >
                                  {isDone && <Check className="w-2.5 sm:w-3 h-2.5 sm:h-3 stroke-[3]" />}
                                </button>
                                <span className={`text-[12.5px] sm:text-[13px] font-semibold leading-snug line-clamp-2 ${
                                  isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                                }`}>
                                  {task.topicName}
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  soundManager.playClick();
                                  deletePlannerTask(task.id);
                                }}
                                className="opacity-60 sm:opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all cursor-pointer shrink-0 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                title="Delete Target"
                                aria-label="Delete Target"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Subject & Priority Chips */}
                            <div className="flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] pl-1">
                              <span className="px-1.5 py-0.5 rounded-md font-bold truncate max-w-[100px] sm:max-w-[110px] bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.06]">
                                {formatTitleCase(task.subjectName)}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-md font-mono font-bold border ${pBadge.classes}`}>
                                {pBadge.label}
                              </span>
                              <span className="font-mono text-slate-400 ml-auto flex items-center gap-1 tabular-nums">
                                <span>⏱️</span>
                                <span>{task.estimatedMinutes}m</span>
                              </span>
                            </div>

                            {/* Quick Focus Sprint & Move Dropdown */}
                            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 pl-1">
                              {onOpenFocusChamber && !isDone ? (
                                <button
                                  onClick={() => {
                                    soundManager.playClick();
                                    onOpenFocusChamber(task.topicId);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-[10.5px] sm:text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs tap-bounce"
                                >
                                  <Zap className="w-3 h-3 fill-current" />
                                  <span>Focus</span>
                                </button>
                              ) : <div />}

                              <div className="flex items-center gap-1 ml-auto text-[10.5px] sm:text-[11px] font-bold">
                                {col.id !== 'today' && (
                                  <button
                                    onClick={() => { soundManager.playClick(); movePlannerTask(task.id, 'today'); }}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 text-slate-600 dark:text-slate-400 transition-all cursor-pointer font-semibold"
                                  >
                                    Today
                                  </button>
                                )}
                                {col.id !== 'in_progress' && (
                                  <button
                                    onClick={() => { soundManager.playClick(); movePlannerTask(task.id, 'in_progress'); }}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-500/20 dark:hover:text-purple-400 text-slate-600 dark:text-slate-400 transition-all cursor-pointer font-semibold"
                                  >
                                    Focus
                                  </button>
                                )}
                                {col.id !== 'upcoming' && (
                                  <button
                                    onClick={() => { soundManager.playClick(); movePlannerTask(task.id, 'upcoming'); }}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/20 dark:hover:text-amber-400 text-slate-600 dark:text-slate-400 transition-all cursor-pointer font-semibold"
                                  >
                                    Week
                                  </button>
                                )}
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
        </div>
      ) : (
        /* ═══════════════ 5. WEEKLY CALENDAR VIEW ═══════════════ */
        <div className="space-y-3">
          {/* Week Navigation */}
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-[#11131F]/90 border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-1.5">
              <button
                onClick={() => { soundManager.playClick(); setWeekOffset(w => w - 1); }}
                className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#1A1B29] border border-slate-200/70 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => { soundManager.playClick(); setWeekOffset(0); }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  weekOffset === 0
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-[#1A1B29] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Current Week
              </button>
              <button
                onClick={() => { soundManager.playClick(); setWeekOffset(w => w + 1); }}
                className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#1A1B29] border border-slate-200/70 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-mono flex items-center justify-center sm:justify-start gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{weekDays[0]?.monthName} {weekDays[0]?.dayNum} – {weekDays[6]?.monthName} {weekDays[6]?.dayNum}</span>
            </div>
          </div>

          {/* 7-Day Columns */}
          <div
            ref={calendarScrollRef}
            className="grid grid-cols-1 sm:grid-cols-7 gap-2 sm:gap-2.5 overflow-x-auto pb-1 no-scrollbar"
          >
            {weekDays.map(day => {
              const dayTasks = filteredTasks.filter(t => t.scheduledDate === day.dateStr);

              return (
                <div
                  key={day.dateStr}
                  data-today={day.isToday}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all space-y-2 ${
                    day.isToday
                      ? 'bg-blue-50/30 dark:bg-[#1A1B29] border-blue-500/70 dark:border-blue-400 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-slate-50/60 dark:bg-[#11131F]/90 border-slate-200/70 dark:border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-[10px] sm:text-[11px] tabular-nums font-bold uppercase font-mono block ${
                        day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                      }`}>
                        {day.dayName}
                      </span>
                      <h4 className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                        {day.dayNum}
                      </h4>
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setTargetDate(day.dateStr);
                        setShowAddModal(true);
                      }}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-[#1A1B29] border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-white cursor-pointer transition-colors"
                      title="Add target on this date"
                      aria-label="Add target on this date"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[180px] sm:max-h-[220px] overflow-y-auto no-scrollbar">
                    {dayTasks.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic py-1 text-center">No targets</p>
                    ) : (
                      dayTasks.map(t => (
                        <div
                          key={t.id}
                          onClick={() => handleToggleWithConfetti(t.id)}
                          className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-[11px] tabular-nums font-semibold cursor-pointer transition-all ${
                            t.status === 'completed'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 line-through'
                              : 'bg-white dark:bg-[#161826] border-slate-200/70 dark:border-white/[0.06] text-slate-900 dark:text-slate-100 hover:border-blue-500/40'
                          }`}
                        >
                          <p className="line-clamp-1">{t.topicName}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ 6. STREAMLINED ADD TARGET MODAL ═══════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#151622] border border-slate-200/80 dark:border-white/[0.08] shadow-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4 animate-scale-in max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Schedule Study Target
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#1A1B29] flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              
              {/* Option A: Search Syllabus Topics */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pick from Syllabus (Recommended)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search topics or chapters..."
                    value={topicSearchQuery}
                    onChange={e => setTopicSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12131D] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                {topicSearchQuery.trim() && (
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#12131D] divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {filteredTopicsForModal.slice(0, 6).map(t => (
                      <div
                        key={t.topic.id}
                        onClick={() => {
                          setSelectedSyllabusTopicId(t.topic.id);
                          setCustomTitle(t.topic.name);
                          setTopicSearchQuery('');
                        }}
                        className="p-2 text-xs font-semibold text-slate-900 dark:text-[#C0CAF5] hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between"
                      >
                        <span>{t.topic.name}</span>
                        <span className="text-[11px] text-slate-400">{formatTitleCase(t.subjectName)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Option B: Custom Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Or Custom Target Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50 Quantitative Mock Questions..."
                  value={customTitle}
                  onChange={e => {
                    setCustomTitle(e.target.value);
                    if (selectedSyllabusTopicId) setSelectedSyllabusTopicId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12131D] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              {/* Priority & Estimated Minutes */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12131D] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    step={5}
                    value={estimatedMins}
                    onChange={e => setEstimatedMins(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12131D] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!customTitle.trim() && !selectedSyllabusTopicId}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Schedule Target
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

