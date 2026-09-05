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
      case 'high': return { label: '🔥 High', classes: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' };
      case 'medium': return { label: '⚡ Med', classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
      case 'low': return { label: '☕ Low', classes: 'bg-slate-200 dark:bg-[#23232A] text-[#6B7280] border-slate-300 dark:border-[#272730]' };
      default: return { label: '⚡ Med', classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
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
    badgeCol: string; tasks: PlannerTask[];
  }> = [
    { id: 'today', title: "Today's Targets", icon: Target, badgeCol: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400', tasks: todayTasks },
    { id: 'in_progress', title: 'Deep Focus', icon: Zap, badgeCol: 'bg-purple-500/15 text-purple-600 dark:text-purple-400', tasks: inProgressTasks },
    { id: 'upcoming', title: 'This Week', icon: Layers, badgeCol: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', tasks: upcomingTasks },
    { id: 'completed', title: 'Conquered', icon: CheckCircle2, badgeCol: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', tasks: completedTasks }
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
    <div className="space-y-4 sm:space-y-6 pb-20 max-w-6xl mx-auto font-sans select-none animate-fade-in">
      
      {/* ═══════════════ 1. CONCISE & ATTRACTIVE HERO DASHBOARD WITH 3D GLASS CALENDAR BACKGROUND ═══════════════ */}
      <div className="p-5 sm:p-7 rounded-[32px] bg-[#0A0D14] border border-[#272738] shadow-2xl relative overflow-hidden text-white space-y-4">
        
        {/* Full Uncropped High-Fidelity 3D Planner & Stopwatch Artwork (Zero crop, fits card perfectly) */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-3/4 md:w-3/5 lg:w-1/2 pointer-events-none overflow-hidden flex items-center justify-end z-0">
          <img
            src="/planner_banner.png"
            alt="Daily Study Planner 3D"
            className="h-full w-auto max-w-none object-contain object-right opacity-80 sm:opacity-95 select-none"
            loading="eager"
            decoding="async"
            width={600}
            height={320}
          />
        </div>

        {/* Multi-layered Glass Gradients for 100% Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14] via-[#0A0D14]/80 md:via-[#0A0D14]/40 to-transparent pointer-events-none z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14]/70 via-transparent to-transparent pointer-events-none z-0" />
        
        {/* Subtle Ambient Glow Orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#2563EB]/10 dark:bg-[#7AA2F7]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FACC15] to-[#CA8A04] text-black flex items-center justify-center font-bold shadow-md shrink-0 border border-white/20">
              <CalendarCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white font-sans uppercase tracking-tight drop-shadow-sm">
                Daily Study Planner
              </h2>
              <p className="text-xs text-[#C5C8D8]">
                Target tracking, daily sprints, and study queue
              </p>
            </div>
          </div>

          {/* 1-Click Add Target Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              setTargetDate(getTodayDateString());
              setShowAddModal(true);
            }}
            className="group relative px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FACC15] to-[#EAB308] hover:from-[#fde047] hover:to-[#ca8a04] text-black font-extrabold text-xs shadow-[0_0_20px_rgba(250,204,21,0.35)] hover:shadow-[0_0_30px_rgba(250,204,21,0.55)] transition-all active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-2 overflow-hidden border border-white/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
            <span>Add Study Target</span>
          </button>
        </div>

        {/* Concise Metric Bento Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
          
          {/* Today's Velocity */}
          <div className="p-3.5 rounded-2xl bg-[#131520]/80 backdrop-blur-xl border border-white/10 hover:border-emerald-500/40 transition-all flex items-center justify-between shadow-lg group">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[#9A9CAE] uppercase font-mono tracking-wider">Velocity</span>
              <h4 className="text-xl font-black font-mono text-white leading-none tabular-nums">
                {todayProgressPercent}%
              </h4>
              <span className="text-[11px] text-[#A1A1B2] font-mono tabular-nums">
                {completedTodayCount}/{totalTodayCount} Done
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Daily Streak */}
          <div className="p-3.5 rounded-2xl bg-[#131520]/80 backdrop-blur-xl border border-white/10 hover:border-orange-500/40 transition-all flex items-center justify-between shadow-lg group">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[#9A9CAE] uppercase font-mono tracking-wider">Streak</span>
              <h4 className="text-xl font-black font-mono text-orange-400 leading-none tabular-nums">
                {profile.currentStreak} <span className="text-xs font-sans text-[#9A9CAE]">days</span>
              </h4>
              <span className="text-[11px] text-orange-400/80 font-medium font-mono tabular-nums">Best: {profile.longestStreak}d</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          {/* Study Time */}
          <div className="p-3.5 rounded-2xl bg-[#131520]/80 backdrop-blur-xl border border-white/10 hover:border-blue-500/40 transition-all flex items-center justify-between shadow-lg group">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[#9A9CAE] uppercase font-mono tracking-wider">Planned</span>
              <h4 className="text-xl font-black font-mono text-white leading-none tabular-nums">
                {(totalPlannedMinutes / 60).toFixed(1)} <span className="text-xs font-sans text-[#9A9CAE]">hrs</span>
              </h4>
              <span className="text-[11px] text-emerald-400 font-medium font-mono tabular-nums">{(completedMinutes / 60).toFixed(1)}h finished</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          {/* Focus XP */}
          <div className="p-3.5 rounded-2xl bg-[#131520]/80 backdrop-blur-xl border border-white/10 hover:border-purple-500/40 transition-all flex items-center justify-between shadow-lg group">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[#9A9CAE] uppercase font-mono tracking-wider">XP Level</span>
              <h4 className="text-xl font-black font-mono text-purple-400 leading-none tabular-nums">
                Lvl {profile.level}
              </h4>
              <span className="text-[11px] text-purple-400 font-medium font-mono tabular-nums">{profile.xp} XP</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

        </div>

        {/* Smart Suggestions Chips (if any) */}
        {smartSuggestions.length > 0 && (
          <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-white/10">
            <span className="text-[11px] tabular-nums font-bold text-[#C5C8D8] uppercase font-mono tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Suggested:</span>
            </span>
            {smartSuggestions.map((sug, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shrink-0"
              >
                <span className="text-xs font-bold text-white truncate max-w-[140px]">
                  {sug.topicName}
                </span>
                <button
                  onClick={() => handleAddSuggestion(sug.topicName, sug.subjectName, sug.subjectColor, sug.topicId)}
                  className="px-2 py-0.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-black text-[11px] font-extrabold cursor-pointer transition-all active:scale-95"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ═══════════════ TOP 3 NON-NEGOTIABLES & NIGHT STUDY REFLECTION ═══════════════ */}
      <Top3TargetsWidget />

      {/* ═══════════════ 2. VIEW CONTROLS & SUBJECT FILTER BAR ═══════════════ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        {/* Kanban vs Calendar Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-white dark:bg-[#151622] border border-[#E2E8F0] dark:border-[#262738] shadow-2xs shrink-0 self-start">
          <button
            onClick={() => {
              soundManager.playClick();
              setViewMode('kanban');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-[#11120F] dark:bg-white text-white dark:text-black shadow-xs font-black'
                : 'text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Target Board</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setViewMode('calendar');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-[#11120F] dark:bg-white text-white dark:text-black shadow-xs font-black'
                : 'text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Weekly Calendar</span>
          </button>
        </div>

        {/* Clear Conquered Button (if any) */}
        {completedTasks.length > 0 && (
          <button
            onClick={() => {
              soundManager.playClick();
              clearCompletedPlannerTasks();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#151622] border border-[#E2E8F0] dark:border-[#262738] text-xs font-bold text-[#65675F] hover:text-rose-500 dark:text-[#94A3B8] hover:border-rose-500/30 transition-all cursor-pointer self-end sm:self-auto active:scale-95 shadow-2xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Done ({completedTasks.length})</span>
          </button>
        )}
      </div>

      {/* ═══════════════ 3. SUBJECT FILTER PILLS ═══════════════ */}
      {currentExam && currentExam.subjects.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedSubjectFilter('all');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 active:scale-95 ${
              selectedSubjectFilter === 'all'
                ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs font-black'
                : 'bg-white dark:bg-[#151622] text-[#65675F] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#262738] hover:border-[#2563EB] dark:hover:border-[#7AA2F7]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
              selectedSubjectFilter === 'all' ? 'bg-white/20 dark:bg-black/20' : 'bg-[#F1F5F9] dark:bg-[#222332] text-[#64748B]'
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs font-black'
                    : 'bg-white dark:bg-[#151622] text-[#65675F] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#262738] hover:border-[#2563EB] dark:hover:border-[#7AA2F7]'
                }`}
              >
                <SubjIcon className="w-3.5 h-3.5" style={{ color: isSelected ? undefined : s.color }} />
                <span>{s.name}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                  isSelected ? 'bg-white/20 dark:bg-black/20' : 'bg-[#F1F5F9] dark:bg-[#222332] text-[#64748B]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ═══════════════ 4. MAIN WORKSPACE VIEW (KANBAN / CALENDAR) ═══════════════ */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {columns.map(col => {
            const ColIcon = col.icon;
            return (
              <div
                key={col.id}
                className="flex flex-col rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth p-3.5 space-y-3 min-h-[380px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#EEEEE8] dark:border-[#24283B]">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${col.badgeCol}`}>
                      <ColIcon className="w-4 h-4" />
                    </div>
                    <h3 className="text-[15px] sm:text-base font-black text-[#11120F] dark:text-[#C0CAF5] uppercase tracking-wide">
                      {col.title}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 text-[11px] font-black rounded-lg font-mono ${col.badgeCol}`}>
                    {col.tasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px] no-scrollbar">
                  {col.tasks.length === 0 ? (
                    <div className="py-7 px-3 flex flex-col items-center justify-center text-center border border-dashed border-[#E2E8F0] dark:border-[#24283B] rounded-2xl bg-[#F8FAFC]/60 dark:bg-[#141520]/50 space-y-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E2030] border border-[#E2E8F0] dark:border-[#2D3045] flex items-center justify-center text-[#85877E] dark:text-[#7AA2F7] shadow-2xs">
                        {col.id === 'upcoming' && <ListPlus className="w-5 h-5 text-indigo-500" />}
                        {col.id === 'today' && <Target className="w-5 h-5 text-amber-500" />}
                        {col.id === 'in_progress' && <Zap className="w-5 h-5 text-sky-500 fill-current" />}
                        {col.id === 'completed' && <Trophy className="w-5 h-5 text-emerald-500" />}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-[#11120F] dark:text-[#C0CAF5]">
                          {col.id === 'upcoming' && 'Queue Clear'}
                          {col.id === 'today' && 'Runway Open'}
                          {col.id === 'in_progress' && 'Ready For Sprint'}
                          {col.id === 'completed' && 'Awaiting Conquests'}
                        </p>
                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] max-w-[160px] leading-tight mx-auto">
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
                          className="mt-0.5 px-3 py-1 rounded-lg bg-white dark:bg-[#1E2030] hover:bg-[#2563EB] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-black text-[11px] font-bold text-[#2563EB] dark:text-[#7AA2F7] border border-[#DBEAFE] dark:border-[#7AA2F7]/30 transition-all cursor-pointer active:scale-95 shadow-2xs tap-bounce"
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
                          className={`p-3 rounded-2xl border transition-all space-y-2 group ${
                            isDone
                              ? 'bg-emerald-500/5 border-emerald-500/20 opacity-75'
                              : 'bg-[#F8FAFC] dark:bg-[#12141A] border-[#E2E8F0] dark:border-[#24283B] hover:border-[#2563EB] dark:hover:border-[#7AA2F7] shadow-xs'
                          }`}
                        >
                          {/* Title & Checkbox */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <button
                                onClick={() => handleToggleWithConfetti(task.id)}
                                className={`w-4.5 h-4.5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer mt-0.5 ${
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-[#85877E] hover:border-emerald-500 hover:bg-emerald-500/10'
                                }`}
                              >
                                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <span className={`text-[13px] font-bold leading-snug line-clamp-2 ${
                                isDone ? 'line-through text-[#85877E]' : 'text-[#11120F] dark:text-[#C0CAF5]'
                              }`}>
                                {task.topicName}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                soundManager.playClick();
                                deletePlannerTask(task.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#85877E] hover:text-rose-500 transition-all cursor-pointer shrink-0"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Subject & Priority Chips */}
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="px-2 py-0.5 rounded-md font-bold truncate max-w-[110px] bg-white dark:bg-[#18181D] text-[#65675F] dark:text-[#A9B1D6] border border-[#E2E8F0] dark:border-[#24283B]">
                              {task.subjectName}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-md font-mono font-bold border ${pBadge.classes}`}>
                              {pBadge.label}
                            </span>
                            <span className="font-mono text-[#85877E] ml-auto">
                              ⏱️ {task.estimatedMinutes}m
                            </span>
                          </div>

                          {/* Quick Focus Sprint & Move Dropdown */}
                          <div className="pt-1.5 border-t border-[#EEEEE8] dark:border-[#24283B] flex items-center justify-between gap-2">
                            {onOpenFocusChamber && !isDone ? (
                              <button
                                onClick={() => {
                                  soundManager.playClick();
                                  onOpenFocusChamber(task.topicId);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#0F172A] hover:bg-[#2563EB] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-[11px] tabular-nums font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 tap-bounce"
                              >
                                <Zap className="w-3 h-3 fill-current" />
                                <span>Focus</span>
                              </button>
                            ) : <div />}

                            <div className="flex items-center gap-1 ml-auto text-[11px] tabular-nums font-bold">
                              {col.id !== 'today' && (
                                <button
                                  onClick={() => { soundManager.playClick(); movePlannerTask(task.id, 'today'); }}
                                  className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#18181D] hover:bg-cyan-500 hover:text-white text-[#65675F] dark:text-[#A9B1D6] transition-all cursor-pointer"
                                >
                                  Today
                                </button>
                              )}
                              {col.id !== 'in_progress' && (
                                <button
                                  onClick={() => { soundManager.playClick(); movePlannerTask(task.id, 'in_progress'); }}
                                  className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#18181D] hover:bg-purple-500 hover:text-white text-[#65675F] dark:text-[#A9B1D6] transition-all cursor-pointer"
                                >
                                  Focus
                                </button>
                              )}
                              {col.id !== 'upcoming' && (
                                <button
                                  onClick={() => { soundManager.playClick(); movePlannerTask(task.id, 'upcoming'); }}
                                  className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#18181D] hover:bg-amber-500 hover:text-white text-[#65675F] dark:text-[#A9B1D6] transition-all cursor-pointer"
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
      ) : (
        /* ═══════════════ 5. WEEKLY CALENDAR VIEW ═══════════════ */
        <div className="space-y-3">
          {/* Week Navigation */}
          <div className="p-3.5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { soundManager.playClick(); setWeekOffset(w => w - 1); }}
                className="p-1.5 rounded-xl bg-[#F8FAFC] dark:bg-[#12141A] border border-[#E2E8F0] dark:border-[#24283B] text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => { soundManager.playClick(); setWeekOffset(0); }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  weekOffset === 0
                    ? 'bg-[#11120F] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D]'
                    : 'bg-[#F8FAFC] dark:bg-[#12141A] text-[#65675F] dark:text-[#A9B1D6]'
                }`}
              >
                Current Week
              </button>
              <button
                onClick={() => { soundManager.playClick(); setWeekOffset(w => w + 1); }}
                className="p-1.5 rounded-xl bg-[#F8FAFC] dark:bg-[#12141A] border border-[#E2E8F0] dark:border-[#24283B] text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[15px] sm:text-base font-black text-[#11120F] dark:text-[#C0CAF5] font-mono flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2563EB] dark:text-[#7AA2F7]" />
              <span>{weekDays[0]?.monthName} {weekDays[0]?.dayNum} – {weekDays[6]?.monthName} {weekDays[6]?.dayNum}</span>
            </div>
          </div>

          {/* 7-Day Columns */}
          <div
            ref={calendarScrollRef}
            className="grid grid-cols-1 sm:grid-cols-7 gap-2.5 overflow-x-auto pb-1 no-scrollbar"
          >
            {weekDays.map(day => {
              const dayTasks = filteredTasks.filter(t => t.scheduledDate === day.dateStr);
              const completedInDay = dayTasks.filter(t => t.status === 'completed').length;

              return (
                <div
                  key={day.dateStr}
                  data-today={day.isToday}
                  className={`p-3 rounded-2xl border transition-all space-y-2 ${
                    day.isToday
                      ? 'bg-white dark:bg-[#18181D] border-[#2563EB] dark:border-[#7AA2F7] shadow-sm'
                      : 'bg-[#F8FAFC] dark:bg-[#12141A] border-[#E2E8F0] dark:border-[#24283B]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-[11px] tabular-nums font-bold uppercase font-mono block ${
                        day.isToday ? 'text-[#2563EB] dark:text-[#7AA2F7]' : 'text-[#85877E]'
                      }`}>
                        {day.dayName}
                      </span>
                      <h4 className="text-base font-black font-mono text-[#11120F] dark:text-[#C0CAF5]">
                        {day.dayNum}
                      </h4>
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setTargetDate(day.dateStr);
                        setShowAddModal(true);
                      }}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#24283B] flex items-center justify-center text-[#85877E] hover:text-[#11120F] cursor-pointer"
                      title="Add task on this date"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto no-scrollbar">
                    {dayTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => handleToggleWithConfetti(t.id)}
                        className={`p-2 rounded-xl border text-[11px] tabular-nums font-bold cursor-pointer transition-all ${
                          t.status === 'completed'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 line-through'
                            : 'bg-white dark:bg-[#18181D] border-[#E2E8F0] dark:border-[#24283B] text-[#11120F] dark:text-[#C0CAF5]'
                        }`}
                      >
                        <p className="line-clamp-1">{t.topicName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ 6. STREAMLINED ADD TARGET MODAL ═══════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in font-sans">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-2xl p-5 space-y-4 animate-scale-in">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEEE8] dark:border-[#24283B]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#7AA2F7] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-sm font-black text-[#11120F] dark:text-[#C0CAF5] uppercase font-serif tracking-wide">
                  Schedule Study Target
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-[#F8FAFC] dark:bg-[#12141A] flex items-center justify-center text-[#85877E] hover:text-[#11120F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              
              {/* Option A: Search Syllabus Topics */}
              <div className="space-y-1.5">
                <label className="text-[11px] tabular-nums font-bold text-[#85877E] uppercase font-mono tracking-wider">
                  Pick from Syllabus (Recommended)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85877E]" />
                  <input
                    type="text"
                    placeholder="Search topics or chapters..."
                    value={topicSearchQuery}
                    onChange={e => setTopicSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#12141A] border border-[#E2E8F0] dark:border-[#24283B] text-xs font-bold text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {topicSearchQuery.trim() && (
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-[#E2E8F0] dark:border-[#24283B] bg-[#F8FAFC] dark:bg-[#12141A] divide-y divide-[#EEEEE8] dark:divide-[#24283B]">
                    {filteredTopicsForModal.slice(0, 6).map(t => (
                      <div
                        key={t.topic.id}
                        onClick={() => {
                          setSelectedSyllabusTopicId(t.topic.id);
                          setCustomTitle(t.topic.name);
                          setTopicSearchQuery('');
                        }}
                        className="p-2 text-xs font-bold text-[#11120F] dark:text-[#C0CAF5] hover:bg-[#EEEEE8] dark:hover:bg-[#1F2335] cursor-pointer flex items-center justify-between"
                      >
                        <span>{t.topic.name}</span>
                        <span className="text-[11px] text-[#85877E]">{t.subjectName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Option B: Custom Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] tabular-nums font-bold text-[#85877E] uppercase font-mono tracking-wider">
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
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#12141A] border border-[#E2E8F0] dark:border-[#24283B] text-xs font-bold text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Priority & Estimated Minutes */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] tabular-nums font-bold text-[#85877E] uppercase font-mono tracking-wider">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#12141A] border border-[#E2E8F0] dark:border-[#24283B] text-xs font-bold text-[#11120F] dark:text-white focus:outline-none"
                  >
                    <option value="high">🔥 High Priority</option>
                    <option value="medium">⚡ Medium Priority</option>
                    <option value="low">☕ Low Priority</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] tabular-nums font-bold text-[#85877E] uppercase font-mono tracking-wider">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    step={5}
                    value={estimatedMins}
                    onChange={e => setEstimatedMins(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#12141A] border border-[#E2E8F0] dark:border-[#24283B] text-xs font-bold text-[#11120F] dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!customTitle.trim() && !selectedSyllabusTopicId}
                className="w-full py-2.5 rounded-2xl bg-[#0F172A] hover:bg-[#2563EB] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 tap-bounce"
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

