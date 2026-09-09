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
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar' | 'routine'>('kanban');
  const [mobileActiveColumn, setMobileActiveColumn] = useState<PlannerColumnStatus | 'all'>('all');

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
      case 'low': return { label: '☕ Low', classes: 'bg-slate-200 dark:bg-[#23232A] text-[#6B7280] dark:text-slate-400 border-slate-300 dark:border-[#272730]' };
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

      {/* ═══════════════ 1. CONCISE & ATTRACTIVE HERO DASHBOARD WITH 3D GLASS CALENDAR BACKGROUND ═══════════════ */}
      <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B0F19] via-[#101424] to-[#0A0C14] border border-white/[0.12] ring-1 ring-white/[0.06] shadow-2xl relative overflow-hidden text-white space-y-3.5 sm:space-y-4">
        
        {/* Full High-Fidelity 3D Planner & Stopwatch Artwork */}
        <div 
          className="absolute inset-0 bg-cover bg-right pointer-events-none opacity-40 sm:opacity-85 mix-blend-screen scale-102 transition-transform duration-1000"
          style={{ backgroundImage: `url('/planner_banner.png')` }}
        />

        {/* Multi-layered Glass Gradients for 100% Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19] via-[#0B0F19]/90 sm:via-[#0B0F19]/80 md:via-[#0B0F19]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19]/90 via-transparent to-transparent pointer-events-none" />
        
        {/* Subtle Ambient Glow Orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 sm:w-11 h-9 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#FACC15] to-[#CA8A04] text-black flex items-center justify-center font-bold shadow-md shrink-0 border border-white/20">
              <CalendarCheck className="w-4.5 sm:w-5 h-4.5 sm:h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-xl font-black text-white font-sans uppercase tracking-tight drop-shadow-sm">
                Daily Study Planner
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-300">
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
            className="group relative w-full sm:w-auto justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#FACC15] via-[#EAB308] to-[#CA8A04] hover:from-[#fde047] hover:to-[#eab308] text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(250,204,21,0.35)] hover:shadow-[0_0_30px_rgba(250,204,21,0.55)] transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-2 overflow-hidden border border-white/25"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
            <span>Add Study Target</span>
          </button>
        </div>

        {/* Concise Metric Bento Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 relative z-10">
          
          {/* Today's Velocity */}
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-xl border border-white/[0.1] hover:border-emerald-500/40 transition-all flex items-center justify-between shadow-lg group">
            <div className="space-y-0.5">
              <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">Velocity</span>
              <h4 className="text-lg sm:text-xl font-black font-mono text-white leading-none tabular-nums">
                {todayProgressPercent}%
              </h4>
              <span className="text-[9.5px] sm:text-[11px] text-slate-400 font-mono tabular-nums">
                {completedTodayCount}/{totalTodayCount} Done
              </span>
            </div>
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Daily Streak */}
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-xl border border-white/[0.1] hover:border-orange-500/40 transition-all flex items-center justify-between shadow-lg group">
            <div className="space-y-0.5">
              <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">Streak</span>
              <h4 className="text-lg sm:text-xl font-black font-mono text-orange-400 leading-none tabular-nums">
                {profile.currentStreak} <span className="text-[10px] sm:text-xs font-sans text-slate-400">days</span>
              </h4>
              <span className="text-[9.5px] sm:text-[11px] text-orange-400/80 font-medium font-mono tabular-nums">Best: {profile.longestStreak}d</span>
            </div>
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 group-hover:scale-110 transition-transform">
              <Flame className="w-4 sm:w-5 h-4 sm:h-5 animate-pulse" />
            </div>
          </div>

          {/* Study Time */}
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-xl border border-white/[0.1] hover:border-blue-500/40 transition-all flex items-center justify-between shadow-lg group">
            <div className="space-y-0.5">
              <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">Planned</span>
              <h4 className="text-lg sm:text-xl font-black font-mono text-white leading-none tabular-nums">
                {(totalPlannedMinutes / 60).toFixed(1)} <span className="text-[10px] sm:text-xs font-sans text-slate-400">hrs</span>
              </h4>
              <span className="text-[9.5px] sm:text-[11px] text-emerald-400 font-medium font-mono tabular-nums">{(completedMinutes / 60).toFixed(1)}h finished</span>
            </div>
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
              <Clock className="w-4 sm:w-5 h-4 sm:h-5 stroke-[2.2]" />
            </div>
          </div>

          {/* Focus XP */}
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-xl border border-white/[0.1] hover:border-purple-500/40 transition-all flex items-center justify-between shadow-lg group">
            <div className="space-y-0.5">
              <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">XP Level</span>
              <h4 className="text-lg sm:text-xl font-black font-mono text-purple-400 leading-none tabular-nums">
                Lvl {profile.level}
              </h4>
              <span className="text-[9.5px] sm:text-[11px] text-purple-400 font-medium font-mono tabular-nums">{profile.xp} XP</span>
            </div>
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
              <Star className="w-4 sm:w-5 h-4 sm:h-5 stroke-[2.2]" />
            </div>
          </div>

        </div>

        {/* Smart Suggestions Chips (if any) */}
        {smartSuggestions.length > 0 && (
          <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar pt-2.5 border-t border-white/10">
            <span className="text-[10px] sm:text-[11px] tabular-nums font-bold text-slate-300 uppercase font-mono tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Suggested:</span>
            </span>
            {smartSuggestions.map((sug, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/15 text-xs text-white shrink-0 shadow-sm backdrop-blur-md transition-all group"
              >
                <span className="text-[11px] sm:text-xs font-bold text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
                  {sug.topicName}
                </span>
                <button
                  onClick={() => handleAddSuggestion(sug.topicName, sug.subjectName, sug.subjectColor, sug.topicId)}
                  className="px-2 py-0.5 rounded-md sm:rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] sm:text-[11px] font-black cursor-pointer transition-all active:scale-95 shadow-xs"
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
      <div className="flex flex-row items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        
        {/* Kanban vs Calendar vs Master Routine Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#151622] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              setViewMode('kanban');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-[#202234] text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-[#202234] text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Weekly Calendar</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setViewMode('routine');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'routine'
                ? 'bg-white dark:bg-[#202234] text-blue-600 dark:text-blue-400 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Master Routine & Timetable</span>
          </button>
        </div>

        {/* Clear Conquered Button (if any) */}
        {viewMode !== 'routine' && completedTasks.length > 0 && (
          <button
            onClick={() => {
              soundManager.playClick();
              clearCompletedPlannerTasks();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#151622] border border-slate-200/80 dark:border-white/[0.08] text-[11px] sm:text-xs font-bold text-slate-600 hover:text-rose-500 dark:text-slate-400 hover:border-rose-500/30 transition-all cursor-pointer active:scale-95 shadow-2xs"
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
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs font-black'
                : 'bg-white dark:bg-[#151622] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/[0.08] hover:border-[#2563EB] dark:hover:border-[#7AA2F7]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
              selectedSubjectFilter === 'all' ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
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
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs font-black'
                    : 'bg-white dark:bg-[#151622] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/[0.08] hover:border-[#2563EB] dark:hover:border-[#7AA2F7]'
                }`}
              >
                <SubjIcon className="w-3.5 h-3.5" style={{ color: isSelected ? undefined : s.color }} />
                <span>{s.name}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                  isSelected ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
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
        <div className="space-y-3">
          {/* Mobile Column Segmented Filter (Hidden on Desktop) */}
          <div className="sm:hidden flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#151622] border border-[#E2E8F0] dark:border-[#262738] overflow-x-auto no-scrollbar shadow-2xs">
            <button
              onClick={() => {
                soundManager.playClick();
                setMobileActiveColumn('all');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                mobileActiveColumn === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>All Columns</span>
              <span className={`px-1 rounded-md text-[9.5px] font-mono tabular-nums ${
                mobileActiveColumn === 'all' ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-100 dark:bg-[#222332]'
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
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ColIcon className="w-3 h-3" />
                  <span>{col.title.replace("'s Targets", '').replace(' Targets', '').replace('This ', '')}</span>
                  <span className={`px-1 rounded-md text-[9.5px] font-mono tabular-nums ${
                    isActive ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-100 dark:bg-[#222332]'
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
                  className={`${isHiddenOnMobile ? 'hidden sm:flex' : 'flex'} flex-col rounded-2xl sm:rounded-3xl bg-slate-50/70 dark:bg-[#151622] border border-slate-200/80 dark:border-white/[0.08] shadow-xs p-3 sm:p-3.5 space-y-2.5 sm:space-y-3 min-h-[160px] sm:min-h-[380px]`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-slate-200/70 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl ${col.badgeCol}`}>
                        <ColIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-[#C0CAF5] uppercase tracking-wide">
                        {col.title}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-black rounded-lg font-mono ${col.badgeCol}`}>
                      {col.tasks.length}
                    </span>
                  </div>

                  {/* Task Cards */}
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px] no-scrollbar">
                    {col.tasks.length === 0 ? (
                      <div className="py-4 sm:py-7 px-3 flex flex-col items-center justify-center text-center border border-dashed border-slate-200/90 dark:border-white/[0.08] rounded-xl sm:rounded-2xl bg-white/60 dark:bg-[#141520]/50 space-y-2 sm:space-y-2.5">
                        <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-[#1E2030] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-500 dark:text-[#7AA2F7] shadow-2xs">
                          {col.id === 'upcoming' && <ListPlus className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-500" />}
                          {col.id === 'today' && <Target className="w-4 sm:w-5 h-4 sm:h-5 text-amber-500" />}
                          {col.id === 'in_progress' && <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-sky-500 fill-current" />}
                          {col.id === 'completed' && <Trophy className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500" />}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-[#C0CAF5]">
                            {col.id === 'upcoming' && 'Queue Clear'}
                            {col.id === 'today' && 'Runway Open'}
                            {col.id === 'in_progress' && 'Ready For Sprint'}
                            {col.id === 'completed' && 'Awaiting Conquests'}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-[#94A3B8] max-w-[160px] leading-tight mx-auto">
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
                            className="mt-0.5 px-3 py-1 rounded-lg bg-white dark:bg-[#1E2030] hover:bg-[#2563EB] hover:text-white dark:hover:bg-[#7AA2F7] dark:hover:text-black text-[10px] sm:text-[11px] font-bold text-[#2563EB] dark:text-[#7AA2F7] border border-blue-200 dark:border-[#7AA2F7]/30 transition-all cursor-pointer active:scale-95 shadow-2xs tap-bounce"
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
                            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all space-y-1.5 sm:space-y-2 group ${
                              isDone
                                ? 'bg-emerald-500/5 border-emerald-500/20 opacity-75'
                                : 'bg-white dark:bg-[#1A1B29] border-slate-200/70 dark:border-white/[0.06] hover:border-[#2563EB]/40 dark:hover:border-[#7AA2F7]/40 shadow-2xs hover:shadow-xs'
                            }`}
                          >
                            {/* Title & Checkbox */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <button
                                  onClick={() => handleToggleWithConfetti(task.id)}
                                  className={`w-4 sm:w-4.5 h-4 sm:h-4.5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer mt-0.5 ${
                                    isDone
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-slate-300 dark:border-white/20 hover:border-emerald-500 hover:bg-emerald-500/10'
                                  }`}
                                >
                                  {isDone && <Check className="w-2.5 sm:w-3 h-2.5 sm:h-3 stroke-[3]" />}
                                </button>
                                <span className={`text-[12.5px] sm:text-[13px] font-bold leading-snug line-clamp-2 ${
                                  isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-[#C0CAF5]'
                                }`}>
                                  {task.topicName}
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  soundManager.playClick();
                                  deletePlannerTask(task.id);
                                }}
                                className="opacity-60 sm:opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all cursor-pointer shrink-0"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Subject & Priority Chips */}
                            <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px]">
                              <span className="px-1.5 sm:px-2 py-0.5 rounded-md font-bold truncate max-w-[100px] sm:max-w-[110px] bg-slate-50 dark:bg-[#202234] text-slate-600 dark:text-[#A9B1D6] border border-slate-200/70 dark:border-white/[0.06]">
                                {task.subjectName}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-md font-mono font-bold border ${pBadge.classes}`}>
                                {pBadge.label}
                              </span>
                              <span className="font-mono text-slate-400 ml-auto">
                                ⏱️ {task.estimatedMinutes}m
                              </span>
                            </div>

                            {/* Quick Focus Sprint & Move Dropdown */}
                            <div className="pt-1.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                              {onOpenFocusChamber && !isDone ? (
                                <button
                                  onClick={() => {
                                    soundManager.playClick();
                                    onOpenFocusChamber(task.topicId);
                                  }}
                                  className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-900 hover:bg-[#2563EB] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-[10px] sm:text-[11px] tabular-nums font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 tap-bounce"
                                >
                                  <Zap className="w-3 h-3 fill-current" />
                                  <span>Focus</span>
                                </button>
                              ) : <div />}

                              <div className="flex items-center gap-1 ml-auto text-[10px] sm:text-[11px] tabular-nums font-bold">
                                {col.id !== 'today' && (
                                  <button
                                    onClick={() => { soundManager.playClick(); movePlannerTask(task.id, 'today'); }}
                                    className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#202234] hover:bg-cyan-500 hover:text-white text-slate-600 dark:text-[#A9B1D6] transition-all cursor-pointer"
                                  >
                                    Today
                                  </button>
                                )}
                                {col.id !== 'in_progress' && (
                                  <button
                                    onClick={() => { soundManager.playClick(); movePlannerTask(task.id, 'in_progress'); }}
                                    className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#202234] hover:bg-purple-500 hover:text-white text-slate-600 dark:text-[#A9B1D6] transition-all cursor-pointer"
                                  >
                                    Focus
                                  </button>
                                )}
                                {col.id !== 'upcoming' && (
                                  <button
                                    onClick={() => { soundManager.playClick(); movePlannerTask(task.id, 'upcoming'); }}
                                    className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#202234] hover:bg-amber-500 hover:text-white text-slate-600 dark:text-[#A9B1D6] transition-all cursor-pointer"
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
          <div className="p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#151622] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-1.5">
              <button
                onClick={() => { soundManager.playClick(); setWeekOffset(w => w - 1); }}
                className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#1A1B29] border border-slate-200/70 dark:border-white/[0.06] text-slate-600 dark:text-[#A9B1D6] hover:text-slate-900 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => { soundManager.playClick(); setWeekOffset(0); }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  weekOffset === 0
                    ? 'bg-slate-900 dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D]'
                    : 'bg-slate-50 dark:bg-[#1A1B29] text-slate-600 dark:text-[#A9B1D6]'
                }`}
              >
                Current Week
              </button>
              <button
                onClick={() => { soundManager.playClick(); setWeekOffset(w => w + 1); }}
                className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#1A1B29] border border-slate-200/70 dark:border-white/[0.06] text-slate-600 dark:text-[#A9B1D6] hover:text-slate-900 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs sm:text-base font-black text-slate-900 dark:text-[#C0CAF5] font-mono flex items-center justify-center sm:justify-start gap-2">
              <Calendar className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#2563EB] dark:text-[#7AA2F7]" />
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
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all space-y-2 ${
                    day.isToday
                      ? 'bg-white dark:bg-[#1A1B29] border-[#2563EB] dark:border-[#7AA2F7] shadow-sm ring-1 ring-[#2563EB]/20 dark:ring-[#7AA2F7]/20'
                      : 'bg-slate-50/70 dark:bg-[#151622] border-slate-200/70 dark:border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-[10px] sm:text-[11px] tabular-nums font-bold uppercase font-mono block ${
                        day.isToday ? 'text-[#2563EB] dark:text-[#7AA2F7]' : 'text-slate-400'
                      }`}>
                        {day.dayName}
                      </span>
                      <h4 className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-[#C0CAF5]">
                        {day.dayNum}
                      </h4>
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setTargetDate(day.dateStr);
                        setShowAddModal(true);
                      }}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-[#1A1B29] border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-slate-900 cursor-pointer"
                      title="Add task on this date"
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
                          className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border text-[10px] sm:text-[11px] tabular-nums font-bold cursor-pointer transition-all ${
                            t.status === 'completed'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 line-through'
                              : 'bg-white dark:bg-[#1A1B29] border-slate-200/70 dark:border-white/[0.06] text-slate-900 dark:text-[#C0CAF5]'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in font-sans">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-[#151622] border border-slate-200/80 dark:border-white/[0.08] shadow-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4 animate-scale-in max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#7AA2F7] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-[#C0CAF5] uppercase tracking-wide">
                  Schedule Study Target
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#1A1B29] flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              
              {/* Option A: Search Syllabus Topics */}
              <div className="space-y-1.5">
                <label className="text-[11px] tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">
                  Pick from Syllabus (Recommended)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search topics or chapters..."
                    value={topicSearchQuery}
                    onChange={e => setTopicSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12131D] border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
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
                        className="p-2 text-xs font-bold text-slate-900 dark:text-[#C0CAF5] hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between"
                      >
                        <span>{t.topic.name}</span>
                        <span className="text-[11px] text-slate-400">{t.subjectName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Option B: Custom Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12131D] border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Priority & Estimated Minutes */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12131D] border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="high">🔥 High Priority</option>
                    <option value="medium">⚡ Medium Priority</option>
                    <option value="low">☕ Low Priority</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    step={5}
                    value={estimatedMins}
                    onChange={e => setEstimatedMins(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12131D] border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!customTitle.trim() && !selectedSyllabusTopicId}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 tap-bounce"
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

