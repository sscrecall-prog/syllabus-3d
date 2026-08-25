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
  X
} from 'lucide-react';
import { PlannerColumnStatus, PlannerTask, Topic } from '../../types/syllabus';
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
    addPlannerTask,
    togglePlannerTask,
    movePlannerTask,
    deletePlannerTask
  } = useSyllabus();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSyllabusTopicId, setSelectedSyllabusTopicId] = useState('');
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [targetColumn, setTargetColumn] = useState<PlannerColumnStatus>('today');
  const [estimatedMins, setEstimatedMins] = useState(45);

  const todayTasks = useMemo(() => plannerTasks.filter(t => t.status === 'today'), [plannerTasks]);
  const inProgressTasks = useMemo(() => plannerTasks.filter(t => t.status === 'in_progress'), [plannerTasks]);
  const upcomingTasks = useMemo(() => plannerTasks.filter(t => t.status === 'upcoming'), [plannerTasks]);
  const completedTasks = useMemo(() => plannerTasks.filter(t => t.status === 'completed'), [plannerTasks]);

  const totalTodayCount = todayTasks.length + inProgressTasks.length + completedTasks.length;
  const completedTodayCount = completedTasks.length;
  const todayProgressPercent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  // Real-time filtered topics for search
  const filteredTopics = useMemo(() => {
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
          isCustom: false
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
        isCustom: true
      });
    }

    setCustomTitle('');
    setSelectedSyllabusTopicId('');
    setTopicSearchQuery('');
    setShowAddModal(false);
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
      {/* Header & Goal Progress Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#171717] dark:text-[#F5E6C8] tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-[#D4AF37]" />
            <span>Daily Target & Weekly Study Planner</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Organize high-yield daily goals, focus queues, and protect your preparation velocity.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] font-black text-xs shadow-md shadow-[#D4AF37]/25 hover:shadow-lg transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Study Target</span>
        </button>
      </div>

      {/* Target Velocity Progress Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#171717] dark:text-[#F5E6C8]">
                Today's Daily Target Velocity
              </h4>
              <p className="text-[10px] text-[#6B7280]">
                {completedTodayCount} of {totalTodayCount} focus items completed
              </p>
            </div>
          </div>

          <span className="text-xs font-black text-[#D4AF37] font-mono">
            {todayProgressPercent}% Conquered
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${todayProgressPercent}%` }}
          />
        </div>
      </div>

      {/* 4-COLUMN KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {columns.map(col => {
          const ColIcon = col.icon;
          return (
            <div
              key={col.id}
              className="flex flex-col rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-md p-4 space-y-3.5 min-h-[460px]"
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
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#FAF8F5] dark:bg-[#171717] text-[#6B7280] border border-[#EBD3A0]/60 dark:border-[#333333]">
                  {col.tasks.length}
                </span>
              </div>

              {/* Task Cards Stack */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[500px]">
                {col.tasks.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#EBD3A0]/60 dark:border-[#333333] rounded-2xl">
                    <p className="text-[11px] text-[#6B7280] font-medium">No tasks in queue</p>
                  </div>
                ) : (
                  col.tasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2.5 group ${
                        task.status === 'completed'
                          ? 'bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/20 opacity-75'
                          : 'bg-[#FAF8F5] dark:bg-[#171717] border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => togglePlannerTask(task.id)}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
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

                      {/* Subject & Meta Row */}
                      <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
                        <span
                          className="px-2 py-0.5 rounded-md font-semibold truncate max-w-[120px]"
                          style={{
                            backgroundColor: `${task.subjectColor || '#D4AF37'}20`,
                            color: task.subjectColor || '#D4AF37'
                          }}
                        >
                          {task.subjectName}
                        </span>

                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#6B7280]" />
                          <span>{task.estimatedMinutes}m</span>
                        </div>
                      </div>

                      {/* Quick Move Buttons */}
                      <div className="pt-2 border-t border-[#EBD3A0]/40 dark:border-[#262626] flex items-center justify-between text-[10px] font-bold">
                        {onOpenFocusChamber && task.status !== 'completed' && (
                          <button
                            onClick={() => onOpenFocusChamber(task.topicId)}
                            className="text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Focus</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1 ml-auto">
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
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE TARGET MODAL WITH SEARCH FILTER */}
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
                    Link syllabus topics with instant search or add custom goals
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
                    placeholder="🔍 Search topic or subject (e.g. Percentage, History, Geometry)..."
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

                {/* Selected Topic Pill Indicator */}
                {selectedTopicObj && (
                  <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-between text-xs font-bold text-[#8C6D15] dark:text-[#D4AF37]">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">Selected: {selectedTopicObj.subjectName} • {selectedTopicObj.topic.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSyllabusTopicId('')}
                      className="text-[10px] text-rose-500 hover:underline shrink-0"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Scrollable Filtered Topic List */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
                  {filteredTopics.length === 0 ? (
                    <p className="text-center py-4 text-xs text-[#6B7280]">
                      No matching topics found for "{topicSearchQuery}"
                    </p>
                  ) : (
                    filteredTopics.map((t) => {
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#171717] dark:text-[#F5E6C8] mb-1.5">
                    Target Column
                  </label>
                  <select
                    value={targetColumn}
                    onChange={e => setTargetColumn(e.target.value as PlannerColumnStatus)}
                    className="w-full p-3 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-xs font-bold text-[#171717] dark:text-white cursor-pointer"
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
                    className="w-full p-3 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-xs font-bold text-[#171717] dark:text-white"
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
