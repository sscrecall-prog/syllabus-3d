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
  BookOpen
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
        subjectColor: '#ec4899',
        status: targetColumn,
        scheduledDate: getTodayDateString(),
        estimatedMinutes: estimatedMins,
        isCustom: true
      });
    }

    setCustomTitle('');
    setSelectedSyllabusTopicId('');
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-brand-500" />
            <span>Daily Target & Weekly Study Planner</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize daily focus targets, schedule syllabus topics, and conquer preparation milestones.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-brand-500/25 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Study Target</span>
        </button>
      </div>

      {/* Today's Target Velocity Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-[#0e1630] border border-slate-800 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Flame className="w-5 h-5 fill-brand-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold">
                Daily Completion Velocity: {completedTodayCount} of {totalTodayCount} Targets Done
              </h4>
              <p className="text-[11px] text-slate-400">
                {todayProgressPercent === 100 && totalTodayCount > 0
                  ? '🎉 Outstanding! All targets conquered today! Streak protected.'
                  : 'Complete today targets to maintain your AIR-1 consistency streak.'}
              </p>
            </div>
          </div>

          <span className="text-lg sm:text-2xl font-black font-mono text-cyan-400">
            {todayProgressPercent}%
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${todayProgressPercent}%` }}
          />
        </div>
      </div>

      {/* 4 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 items-start">
        {columns.map(col => {
          const IconComp = col.icon;
          return (
            <div
              key={col.id}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col min-h-[420px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${col.color}`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {col.title}
                  </h4>
                </div>

                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {col.tasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {col.tasks.length > 0 ? (
                  col.tasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        task.status === 'completed'
                          ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: task.subjectColor || '#3b82f6' }}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                            {task.subjectName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => deletePlannerTask(task.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete Target"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h5
                        className={`text-xs sm:text-sm font-bold mb-2 leading-snug ${
                          task.status === 'completed'
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.topicName}
                      </h5>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/40 text-[11px]">
                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{task.estimatedMinutes}m est</span>
                        </span>

                        {/* Status Action Buttons */}
                        <div className="flex items-center gap-1">
                          {task.status !== 'completed' && onOpenFocusChamber && (
                            <button
                              onClick={() => onOpenFocusChamber(task.topicId)}
                              className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/20 transition-all flex items-center gap-1"
                              title="Start 3D Focus Timer"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Focus</span>
                            </button>
                          )}

                          {task.status === 'today' && (
                            <button
                              onClick={() => movePlannerTask(task.id, 'in_progress')}
                              className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold hover:bg-purple-500/20"
                            >
                              Start →
                            </button>
                          )}

                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => movePlannerTask(task.id, 'completed')}
                              className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 shadow-sm"
                            >
                              Done ✓
                            </button>
                          )}

                          {task.status === 'upcoming' && (
                            <button
                              onClick={() => movePlannerTask(task.id, 'today')}
                              className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/20"
                            >
                              Move to Today ↑
                            </button>
                          )}

                          {task.status === 'completed' && (
                            <button
                              onClick={() => movePlannerTask(task.id, 'today')}
                              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold"
                            >
                              Reopen ↺
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    No targets in this column
                  </div>
                )}
              </div>

              {/* Bottom Quick Add to column */}
              <button
                onClick={() => {
                  setTargetColumn(col.id);
                  setShowAddModal(true);
                }}
                className="mt-3 w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Card</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Target Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-500 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Add Study Target to Planner
                </h4>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 sm:p-6 space-y-4">
              {/* Select from Syllabus Topics */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select from Syllabus Topics (Recommended)
                </label>
                <select
                  value={selectedSyllabusTopicId}
                  onChange={e => {
                    setSelectedSyllabusTopicId(e.target.value);
                    if (e.target.value) setCustomTitle('');
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Choose Syllabus Topic --</option>
                  {allTopics.map(t => (
                    <option key={t.topic.id} value={t.topic.id}>
                      {t.subjectName} · {t.topic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase">OR Custom Goal</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
              </div>

              {/* Custom Goal Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Column
                  </label>
                  <select
                    value={targetColumn}
                    onChange={e => setTargetColumn(e.target.value as PlannerColumnStatus)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="today">Today Target</option>
                    <option value="in_progress">In Focus</option>
                    <option value="upcoming">Upcoming Week</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    step={5}
                    value={estimatedMins}
                    onChange={e => setEstimatedMins(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedSyllabusTopicId && !customTitle.trim()}
                  className="px-5 py-2.5 text-xs font-bold bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl shadow-md cursor-pointer"
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
