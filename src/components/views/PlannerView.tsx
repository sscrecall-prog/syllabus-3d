import React, { useState, useMemo } from 'react';
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
  BookOpen,
  Search,
  X,
  Tag,
  Filter,
  CheckSquare,
  Play,
  RotateCcw
} from 'lucide-react';
import { PlannerColumnStatus, PlannerTask, Topic, TaskPriority, TaskCategory } from '../../types/syllabus';
import { getTodayDateString } from '../../utils/dateUtils';
import { soundManager } from '../../utils/soundEffects';

interface PlannerViewProps {
  onOpenFocusChamber?: (topicId?: string) => void;
  onOpenTopicDrawer?: (topic: Topic, subName: string, chName: string) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  onOpenFocusChamber,
  onOpenTopicDrawer
}) => {
  const {
    plannerTasks,
    allTopics,
    currentExam,
    addPlannerTask,
    togglePlannerTask,
    movePlannerTask,
    deletePlannerTask,
    clearCompletedPlannerTasks
  } = useSyllabus();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSyllabusTopicId, setSelectedSyllabusTopicId] = useState('');
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [targetColumn, setTargetColumn] = useState<PlannerColumnStatus>('today');
  const [estimatedMins, setEstimatedMins] = useState(45);
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [category, setCategory] = useState<TaskCategory>('concept');

  // Subject Filter State for Board
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Filter tasks by selected subject
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

  // Total Planned Minutes vs Completed Minutes
  const totalPlannedMinutes = useMemo(() => {
    return plannerTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  }, [plannerTasks]);

  const completedMinutes = useMemo(() => {
    return plannerTasks
      .filter(t => t.status === 'completed')
      .reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  }, [plannerTasks]);

  // Real-time filtered topics for modal search
  const filteredTopicsForModal = useMemo(() => {
    if (!topicSearchQuery.trim()) return allTopics;
    const q = topicSearchQuery.toLowerCase();
    return allTopics.filter(t =>
      t.topic.name.toLowerCase().includes(q) ||
      t.subjectName.toLowerCase().includes(q) ||
      t.chapterName.toLowerCase().includes(q)
    );
  }, [allTopics, topicSearchQuery]);

  const selectedTopicObj = useMemo(() => {
    return allTopics.find(t => t.topic.id === selectedSyllabusTopicId);
  }, [allTopics, selectedSyllabusTopicId]);

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
          scheduledDate: getTodayDateString(),
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
        scheduledDate: getTodayDateString(),
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
  };

  const getPriorityBadge = (p?: TaskPriority) => {
    switch (p) {
      case 'high':
        return {
          label: '🔥 High Priority',
          classes: 'bg-[#D4AF37]/20 text-[#8C6D15] dark:text-[#D4AF37] border-[#D4AF37]/40'
        };
      case 'medium':
        return {
          label: '⚡ Medium',
          classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
        };
      case 'low':
        return {
          label: '☕ Low',
          classes: 'bg-slate-200 dark:bg-[#2A2A2A] text-[#6B7280] border-[#EBD3A0]/60 dark:border-[#383838]'
        };
      default:
        return {
          label: '⚡ Medium',
          classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
        };
    }
  };

  const getCategoryBadge = (c?: TaskCategory) => {
    switch (c) {
      case 'concept':
        return { label: '📖 Theory', color: 'text-indigo-500 bg-indigo-500/10' };
      case 'practice':
        return { label: '✍️ Practice', color: 'text-emerald-500 bg-emerald-500/10' };
      case 'mock':
        return { label: '📝 Mock Test', color: 'text-purple-500 bg-purple-500/10' };
      case 'revision':
        return { label: '🔄 Revision', color: 'text-amber-500 bg-amber-500/10' };
      default:
        return { label: '📖 Concept', color: 'text-indigo-500 bg-indigo-500/10' };
    }
  };

  const columns: Array<{
    id: PlannerColumnStatus;
    title: string;
    icon: React.ElementType;
    color: string;
    borderCol: string;
    tasks: PlannerTask[];
  }> = [
    {
      id: 'today',
      title: "Today's Targets",
      icon: Target,
      color: 'text-cyan-500 bg-cyan-500/10',
      borderCol: 'border-cyan-500/30',
      tasks: todayTasks
    },
    {
      id: 'in_progress',
      title: 'In Focus / Deep Work',
      icon: Zap,
      color: 'text-purple-500 bg-purple-500/10',
      borderCol: 'border-purple-500/30',
      tasks: inProgressTasks
    },
    {
      id: 'upcoming',
      title: 'Upcoming This Week',
      icon: Layers,
      color: 'text-amber-500 bg-amber-500/10',
      borderCol: 'border-amber-500/30',
      tasks: upcomingTasks
    },
    {
      id: 'completed',
      title: 'Conquered & Mastered',
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-500/10',
      borderCol: 'border-emerald-500/30',
      tasks: completedTasks
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* 1. Header & Title Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-[#171717] dark:text-[#F5E6C8] tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-[#D4AF37]" />
            <span>Daily Target & Weekly Study Planner</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            Prioritize high-yield goals, category badges, and track your focus study hours.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {completedTasks.length > 0 && (
            <button
              onClick={clearCompletedPlannerTasks}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#222222] border border-[#EBD3A0]/60 dark:border-[#333333] hover:border-rose-500 text-xs font-bold text-[#6B7280] hover:text-rose-500 transition-all cursor-pointer"
              title="Clear completed tasks from board"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Mastered ({completedTasks.length})</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] font-black text-xs shadow-md shadow-[#D4AF37]/25 hover:shadow-lg transition-all active:scale-98 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Study Target</span>
          </button>
        </div>
      </div>

      {/* 2. Study Velocity & Time Analytics Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Daily Velocity */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] space-y-1.5">
            <span className="text-[10px] font-bold text-[#6B7280] block">Today's Target Velocity</span>
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-black text-[#171717] dark:text-[#F5E6C8] font-mono">
                {completedTodayCount} / {totalTodayCount} <span className="text-xs text-[#6B7280]">Targets</span>
              </span>
              <span className="text-xs font-black text-[#D4AF37] font-mono">
                {todayProgressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#2A2A2A] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${todayProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Planned Study Hours */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] space-y-1">
            <span className="text-[10px] font-bold text-[#6B7280] block">Planned Study Time</span>
            <span className="text-base sm:text-lg font-black text-[#D4AF37] font-mono block">
              {(totalPlannedMinutes / 60).toFixed(1)} <span className="text-xs font-semibold text-[#6B7280]">Hours Total</span>
            </span>
            <span className="text-[11px] font-semibold text-[#6B7280]">
              {(completedMinutes / 60).toFixed(1)} hrs completed today
            </span>
          </div>

          {/* Focus Efficiency */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] space-y-1">
            <span className="text-[10px] font-bold text-[#6B7280] block">Deep Work Focus Queue</span>
            <span className="text-base sm:text-lg font-black text-purple-500 font-mono block">
              {inProgressTasks.length} <span className="text-xs font-semibold text-[#6B7280]">Tasks in Deep Work</span>
            </span>
            <span className="text-[11px] font-semibold text-[#6B7280]">
              {todayTasks.length} upcoming for today
            </span>
          </div>
        </div>

        {/* Real-time Subject Filter Bar */}
        {currentExam && currentExam.subjects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar border-t border-[#EBD3A0]/40 dark:border-[#282828]">
            <span className="text-xs font-bold text-[#6B7280] flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Subject:</span>
            </span>

            <button
              onClick={() => setSelectedSubjectFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                selectedSubjectFilter === 'all'
                  ? 'bg-[#D4AF37] text-[#171717] border-[#D4AF37] shadow-sm'
                  : 'bg-[#FAF8F5] dark:bg-[#171717] text-[#6B7280] border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37]'
              }`}
            >
              All Subjects ({plannerTasks.length})
            </button>

            {currentExam.subjects.map(s => {
              const count = plannerTasks.filter(t => t.subjectName === s.name).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubjectFilter(s.name)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                    selectedSubjectFilter === s.name
                      ? 'bg-[#D4AF37] text-[#171717] border-[#D4AF37] shadow-sm'
                      : 'bg-[#FAF8F5] dark:bg-[#171717] text-[#6B7280] border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ backgroundColor: s.color }} />
                  {s.name} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. 4-COLUMN KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {columns.map(col => {
          const ColIcon = col.icon;
          return (
            <div
              key={col.id}
              className="flex flex-col rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-md p-4 space-y-3.5 min-h-[480px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-xl ${col.color}`}>
                    <ColIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-extrabold text-[#171717] dark:text-[#F5E6C8]">
                    {col.title}
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#FAF8F5] dark:bg-[#171717] text-[#6B7280] border border-[#EBD3A0]/60 dark:border-[#333333] font-mono">
                  {col.tasks.length}
                </span>
              </div>

              {/* Task Cards Stack */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[520px]">
                {col.tasks.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#EBD3A0]/60 dark:border-[#333333] rounded-2xl">
                    <p className="text-[11px] text-[#6B7280] font-medium">No tasks in queue</p>
                  </div>
                ) : (
                  col.tasks.map(task => {
                    const pBadge = getPriorityBadge(task.priority);
                    const cBadge = getCategoryBadge(task.category);

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 group shadow-sm ${
                          task.status === 'completed'
                            ? 'bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/20 opacity-75'
                            : 'bg-[#FAF8F5] dark:bg-[#171717] border-[#EBD3A0]/70 dark:border-[#2E2E2E] hover:border-[#D4AF37] hover:shadow-md'
                        }`}
                      >
                        {/* Title & Complete Checkbox */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <button
                              onClick={() => togglePlannerTask(task.id)}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer mt-0.5 ${
                                task.status === 'completed'
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-[#EBD3A0] dark:border-slate-600 hover:border-[#D4AF37]'
                              }`}
                            >
                              {task.status === 'completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            <span className={`text-xs font-bold leading-snug ${
                              task.status === 'completed'
                                ? 'line-through text-[#6B7280]'
                                : 'text-[#171717] dark:text-[#F5E6C8]'
                            }`}>
                              {task.topicName}
                            </span>
                          </div>

                          <button
                            onClick={() => deletePlannerTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[#6B7280] hover:text-rose-500 transition-opacity cursor-pointer shrink-0"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Priority & Category Badges Row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Priority Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${pBadge.classes}`}>
                            {pBadge.label}
                          </span>

                          {/* Category Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${cBadge.color}`}>
                            {cBadge.label}
                          </span>

                          {/* Time Estimate */}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-[#6B7280] bg-white dark:bg-[#242424] border border-[#EBD3A0]/60 dark:border-[#333333] ml-auto flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#D4AF37]" />
                            <span>{task.estimatedMinutes}m</span>
                          </span>
                        </div>

                        {/* Subject Badge */}
                        <div className="text-[10px] text-[#6B7280]">
                          <span
                            className="px-2 py-0.5 rounded-md font-semibold truncate max-w-[140px] inline-block"
                            style={{
                              backgroundColor: `${task.subjectColor || '#D4AF37'}20`,
                              color: task.subjectColor || '#D4AF37'
                            }}
                          >
                            {task.subjectName}
                          </span>
                        </div>

                        {/* 1-Click Focus Launcher & Move Buttons */}
                        <div className="pt-2.5 border-t border-[#EBD3A0]/40 dark:border-[#262626] flex items-center justify-between gap-2">
                          {onOpenFocusChamber && task.status !== 'completed' ? (
                            <button
                              onClick={() => onOpenFocusChamber(task.topicId)}
                              className="px-2.5 py-1 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Start Focus</span>
                            </button>
                          ) : <div />}

                          {/* Move to Column Pill */}
                          <div className="flex items-center gap-1 ml-auto text-[10px] font-bold">
                            {col.id !== 'today' && (
                              <button
                                onClick={() => movePlannerTask(task.id, 'today')}
                                className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#2A2A2A] hover:bg-[#D4AF37] hover:text-[#171717] text-[#6B7280] transition-colors cursor-pointer"
                              >
                                Today
                              </button>
                            )}
                            {col.id !== 'in_progress' && (
                              <button
                                onClick={() => movePlannerTask(task.id, 'in_progress')}
                                className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#2A2A2A] hover:bg-[#D4AF37] hover:text-[#171717] text-[#6B7280] transition-colors cursor-pointer"
                              >
                                Focus
                              </button>
                            )}
                            {col.id !== 'upcoming' && (
                              <button
                                onClick={() => movePlannerTask(task.id, 'upcoming')}
                                className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#2A2A2A] hover:bg-[#D4AF37] hover:text-[#171717] text-[#6B7280] transition-colors cursor-pointer"
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

      {/* CREATE TARGET MODAL WITH PRIORITY & CATEGORY SELECTORS */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F5] dark:bg-[#1A1A1A] border border-[#EBD3A0] dark:border-[#333333] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#EBD3A0]/60 dark:border-[#2E2E2E] flex items-center justify-between bg-white/70 dark:bg-[#202020]/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#171717] dark:text-[#F5E6C8]">
                    Add Study Target to Planner
                  </h4>
                  <p className="text-[10px] text-[#6B7280]">
                    Link syllabus topics, set priorities & focus duration
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-[#6B7280] hover:text-rose-500 hover:bg-[#F5E6C8]/40 dark:hover:bg-[#282828] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* SELECT FROM SYLLABUS TOPICS WITH REAL-TIME SEARCH */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#333333] space-y-3">
                <label className="block text-xs font-black text-[#171717] dark:text-[#F5E6C8]">
                  Select from Syllabus Topics (Recommended)
                </label>

                {/* Search Bar Input */}
                <div className="relative flex items-center">
                  <Search className="absolute left-3 w-4 h-4 text-[#D4AF37] pointer-events-none" />
                  <input
                    type="text"
                    value={topicSearchQuery}
                    onChange={(e) => setTopicSearchQuery(e.target.value)}
                    placeholder="🔍 Search topic or subject..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0] dark:border-[#383838] text-xs font-semibold text-[#171717] dark:text-white placeholder-[#6B7280] focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  {topicSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTopicSearchQuery('')}
                      className="absolute right-2.5 text-[#6B7280] hover:text-[#171717] dark:hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Selected Topic Pill */}
                {selectedTopicObj && (
                  <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-between text-xs font-bold text-[#8C6D15] dark:text-[#D4AF37]">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">Selected: {selectedTopicObj.subjectName} • {selectedTopicObj.topic.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSyllabusTopicId('')}
                      className="text-[10px] text-rose-500 hover:underline shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Scrollable Filtered Topics */}
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
                  {filteredTopicsForModal.length === 0 ? (
                    <p className="text-center py-4 text-xs text-[#6B7280]">
                      No matching topics found
                    </p>
                  ) : (
                    filteredTopicsForModal.map((t) => {
                      const isSelected = selectedSyllabusTopicId === t.topic.id;
                      return (
                        <div
                          key={t.topic.id}
                          onClick={() => {
                            setSelectedSyllabusTopicId(t.topic.id);
                            setCustomTitle('');
                          }}
                          className={`p-2 rounded-lg flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#D4AF37] text-[#171717] font-bold shadow-sm'
                              : 'hover:bg-[#F5E6C8]/40 dark:hover:bg-[#252525] text-[#171717] dark:text-[#F5E6C8]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: t.subjectColor || '#D4AF37' }}
                            />
                            <span className="truncate">{t.topic.name}</span>
                          </div>
                          <span className={`text-[10px] shrink-0 font-mono ${
                            isSelected ? 'text-[#171717]' : 'text-[#6B7280]'
                          }`}>
                            {t.subjectName}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#EBD3A0]/60 dark:border-[#2E2E2E]" />
                <span className="flex-shrink mx-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                  OR Custom Goal
                </span>
                <div className="flex-grow border-t border-[#EBD3A0]/60 dark:border-[#2E2E2E]" />
              </div>

              {/* Custom Goal Title */}
              <div>
                <label className="block text-xs font-bold text-[#171717] dark:text-[#F5E6C8] mb-1.5">
                  Custom Task Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => {
                    setCustomTitle(e.target.value);
                    if (e.target.value) setSelectedSyllabusTopicId('');
                  }}
                  placeholder="e.g. Attempt Full Mock Test #12 & Review Mistake Log"
                  className="w-full p-3 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-xs font-semibold text-[#171717] dark:text-white focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* PRIORITY & GOAL CATEGORY SELECTORS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#171717] dark:text-[#F5E6C8] mb-1.5">
                    Task Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full p-2.5 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-xs font-bold text-[#171717] dark:text-white cursor-pointer"
                  >
                    <option value="high">🔥 High Priority</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="low">☕ Low / Recall</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] dark:text-[#F5E6C8] mb-1.5">
                    Goal Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as TaskCategory)}
                    className="w-full p-2.5 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-xs font-bold text-[#171717] dark:text-white cursor-pointer"
                  >
                    <option value="concept">📖 Concept & Theory</option>
                    <option value="practice">✍️ Question Practice</option>
                    <option value="mock">📝 Mock Test</option>
                    <option value="revision">🔄 Revision</option>
                  </select>
                </div>
              </div>

              {/* TARGET COLUMN & EST. TIME */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#171717] dark:text-[#F5E6C8] mb-1.5">
                    Target Column
                  </label>
                  <select
                    value={targetColumn}
                    onChange={e => setTargetColumn(e.target.value as PlannerColumnStatus)}
                    className="w-full p-2.5 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-xs font-bold text-[#171717] dark:text-white cursor-pointer"
                  >
                    <option value="today">Today's Target</option>
                    <option value="in_progress">In Focus (Deep Work)</option>
                    <option value="upcoming">Upcoming Week</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] dark:text-[#F5E6C8] mb-1.5">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    step={5}
                    value={estimatedMins}
                    onChange={e => setEstimatedMins(Number(e.target.value))}
                    className="w-full p-2.5 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-xs font-bold text-[#171717] dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-[#EBD3A0] dark:border-[#383838] text-[#6B7280] hover:text-[#171717] dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedSyllabusTopicId && !customTitle.trim()}
                  className="px-5 py-2.5 text-xs font-black bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] disabled:opacity-50 text-[#171717] rounded-xl shadow-md cursor-pointer"
                >
                  Add to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
