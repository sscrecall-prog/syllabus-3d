import React, { useState, useMemo } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Flame, Calendar, Clock, CheckCircle, RotateCw } from 'lucide-react';
import { formatMinutes } from '../../utils/dateUtils';
import { DailyActivity } from '../../types/syllabus';

type HeatmapMetric = 'studyTime' | 'topics' | 'revisions';

export const HeatmapView: React.FC = () => {
  const { activityHistory, profile } = useSyllabus();
  const [metric, setMetric] = useState<HeatmapMetric>('studyTime');
  const [hoveredDay, setHoveredDay] = useState<DailyActivity | null>(null);

  const gridDays = useMemo(() => {
    const days: DailyActivity[] = [];
    const today = new Date();

    for (let i = 119; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isoStr = d.toISOString().split('T')[0];

      const activity = activityHistory.find(a => a.date === isoStr) || {
        date: isoStr,
        studyMinutes: 0,
        topicsCompleted: 0,
        revisionsCompleted: 0
      };

      days.push(activity);
    }
    return days;
  }, [activityHistory]);

  const getIntensityClass = (day: DailyActivity) => {
    let val = 0;
    if (metric === 'studyTime') val = day.studyMinutes;
    else if (metric === 'topics') val = day.topicsCompleted * 30;
    else val = day.revisionsCompleted * 20;

    if (val === 0) return 'bg-slate-100 dark:bg-slate-800/80';
    if (val < 60) return 'bg-brand-500/30';
    if (val < 120) return 'bg-brand-500/60';
    if (val < 180) return 'bg-brand-500/85';
    return 'bg-brand-500';
  };

  const totalStudyMinutes = activityHistory.reduce((acc, day) => acc + day.studyMinutes, 0);
  const activeDaysCount = activityHistory.filter(day => day.studyMinutes > 0).length;

  return (
    <div className="space-y-4 sm:space-y-8 pb-8 sm:pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            120-Day Study Consistency Heatmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Granular visualization of your daily preparation, revisions, and time invested.
          </p>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 overflow-x-auto no-scrollbar">
          {[
            { id: 'studyTime', label: 'Study Time', icon: Clock },
            { id: 'topics', label: 'Topics', icon: CheckCircle },
            { id: 'revisions', label: 'Revisions', icon: RotateCw }
          ].map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMetric(m.id as HeatmapMetric)}
                className={`flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all tap-bounce active:scale-95 whitespace-nowrap ${
                  metric === m.id
                    ? 'bg-white dark:bg-slate-900 text-brand-500 shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2x2 Bento on Mobile, 4-Column on Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-xs sm:shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-orange-500 mb-0.5 sm:mb-1">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-orange-500" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider font-mono">Current Streak</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white leading-none">
            {profile.currentStreak} <span className="text-xs sm:text-sm font-normal text-slate-500">days</span>
          </h3>
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-xs sm:shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-brand-500 mb-0.5 sm:mb-1">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider font-mono">Longest Streak</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white leading-none">
            {profile.longestStreak} <span className="text-xs sm:text-sm font-normal text-slate-500">days</span>
          </h3>
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-xs sm:shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-500 mb-0.5 sm:mb-1">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider font-mono">Active Days</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white leading-none">
            {activeDaysCount} <span className="text-xs sm:text-sm font-normal text-slate-500">/ 120d</span>
          </h3>
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-xs sm:shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-purple-500 mb-0.5 sm:mb-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider font-mono">Total Time</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white leading-none">
            {Math.round(totalStudyMinutes / 60)}h
          </h3>
        </div>
      </div>

      <div className="p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-xs sm:shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1 sm:mb-6">
          <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
            Preparation Calendar (Last 120 Days)
          </h3>

          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-slate-500">
            <span>Less</span>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] sm:rounded-md bg-slate-100 dark:bg-slate-800" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] sm:rounded-md bg-brand-500/30" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] sm:rounded-md bg-brand-500/60" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] sm:rounded-md bg-brand-500/85" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] sm:rounded-md bg-brand-500" />
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar sm:custom-scrollbar pb-2 -mx-1 px-1 sm:mx-0 sm:px-0">
          <div className="grid grid-flow-col grid-rows-7 gap-1 sm:gap-1.5 w-fit">
            {gridDays.map((day, i) => (
              <div
                key={day.date || i}
                onClick={() => setHoveredDay(day)}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] sm:rounded-md ${getIntensityClass(day)} hover:ring-2 hover:ring-brand-500 active:scale-125 transition-all cursor-pointer`}
              />
            ))}
          </div>
        </div>

        <div className="min-h-[32px] mt-2 sm:mt-4 p-2 sm:p-0 rounded-xl sm:rounded-none bg-slate-50 sm:bg-transparent dark:bg-slate-800/40 sm:dark:bg-transparent flex items-center justify-between text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
          {hoveredDay ? (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
              <span className="font-bold text-slate-900 dark:text-white">
                {new Date(hoveredDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span>·</span>
              <span>{formatMinutes(hoveredDay.studyMinutes)} studied</span>
              <span>·</span>
              <span>{hoveredDay.topicsCompleted} topics</span>
              <span>·</span>
              <span>{hoveredDay.revisionsCompleted} revisions</span>
            </div>
          ) : (
            <span className="text-slate-400 text-[10px] sm:text-xs">Tap or hover over any day to view study details.</span>
          )}
        </div>
      </div>
    </div>
  );
};

