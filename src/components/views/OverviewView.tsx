import React, { useState } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  Sparkles,
  Zap,
  Target,
  Flame,
  Award,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Plus,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BrainCircuit,
  Compass,
  ArrowUpRight,
  Layers
} from 'lucide-react';
import { AppView } from '../layout/Sidebar';
import { Topic } from '../../types/syllabus';
import { ExamCountdown3D } from '../3d/ExamCountdown3D';
import { soundManager } from '../../utils/soundEffects';

interface OverviewViewProps {
  onNavigate: (view: AppView) => void;
  onNavigateToSubject?: (subjectId: string) => void;
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
  onOpenRevisionSession: () => void;
  onOpenAddTopic?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onNavigateToSubject,
  onOpenTopicDrawer,
  onOpenRevisionSession,
  onOpenAddTopic
}) => {
  const {
    overallStats,
    subjectStats,
    profile,
    currentExam,
    dueRevisions,
    weakTopics,
    allTopics,
    plannerTasks
  } = useSyllabus();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Quick Daily Target Progress Calculation
  const todayPlannerTasks = plannerTasks.filter(t => t.status === 'today' || t.status === 'in_progress');
  const completedTodayTasks = plannerTasks.filter(t => t.status === 'completed');
  const totalTasksToday = todayPlannerTasks.length + completedTodayTasks.length;
  const todayProgressPercent = totalTasksToday > 0
    ? Math.round((completedTodayTasks.length / totalTasksToday) * 100)
    : 0;

  // SVG Radial Circle calculations
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallStats.completionPercentage / 100) * circumference;

  return (
    <div className="space-y-5 sm:space-y-8 pb-16">
      {/* 1. Header Greeting & Quick CTAs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-[#171717] dark:text-[#F5E6C8] tracking-tight flex items-center gap-2">
            <span>{getGreeting()},</span>
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F5E6C8] to-[#B89327] bg-clip-text text-transparent">
              {profile.name}
            </span>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] animate-pulse shrink-0" />
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A3A3A3] mt-1 font-medium">
            {currentExam.subjects.length > 0 ? (
              <>
                Targeting <span className="font-bold text-[#171717] dark:text-[#F5E6C8]">{currentExam.name}</span> • Level {profile.level} Scholar ({profile.xp} XP)
              </>
            ) : (
              'Welcome! Your syllabus workspace is ready for your custom subjects.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {dueRevisions.length > 0 && (
            <button
              onClick={onOpenRevisionSession}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#8C6D15] dark:text-[#D4AF37] text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-98"
            >
              <RotateCw className="w-4 h-4 animate-spin-slow" />
              <span>Revise Queue ({dueRevisions.length})</span>
            </button>
          )}

          <button
            onClick={onOpenAddTopic}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] text-xs font-black shadow-md shadow-[#D4AF37]/25 hover:shadow-lg transition-all active:scale-98 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Custom Topic</span>
          </button>
        </div>
      </div>

      {/* 2. 3D Countdown Flip Clock */}
      <ExamCountdown3D />

      {/* 3. BENTO GRID ARCHITECTURE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        
        {/* BENTO CARD 1: 3D Radial Mastery Engine */}
        <div className="md:col-span-7 p-4 sm:p-7 rounded-[28px] sm:rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-lg hover:border-[#D4AF37]/70 transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#D4AF37]/15 transition-all" />

          {/* Top Header Row */}
          <div className="flex items-center justify-between gap-2 mb-3.5 pb-3 border-b border-[#EBD3A0]/50 dark:border-[#2C2C2C]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#B89327]/30 border border-[#D4AF37]/50 text-[#8C6D15] dark:text-[#D4AF37] flex items-center justify-center shrink-0 shadow-sm">
                <Target className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-base font-black text-[#171717] dark:text-[#F5E6C8] tracking-tight truncate">
                  Syllabus Mastery Engine
                </h3>
                <span className="text-[10px] sm:text-xs font-semibold text-[#6B7280] dark:text-[#A3A3A3] truncate block">
                  Target Exam: <span className="font-bold text-[#171717] dark:text-[#F5E6C8]">{currentExam.name}</span>
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 text-[10px] sm:text-xs font-black rounded-xl bg-[#D4AF37]/15 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/40 shrink-0 font-mono shadow-sm">
              Lvl {profile.level} • {profile.levelTitle}
            </span>
          </div>

          {/* Radial Ring + Progress Stats */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 py-1">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 150 150">
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-slate-100 dark:text-[#171717]"
                  fill="transparent"
                />
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  stroke="url(#goldGradient)"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="50%" stopColor="#F5E6C8" />
                    <stop offset="100%" stopColor="#B89327" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-black text-[#171717] dark:text-white font-mono tracking-tight">
                  {overallStats.completionPercentage}%
                </span>
                <span className="text-[9px] font-black text-[#8C6D15] dark:text-[#D4AF37] uppercase tracking-widest mt-0.5">
                  Mastered
                </span>
              </div>
            </div>

            <div className="w-full space-y-2.5 flex-1">
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B7280] dark:text-[#A3A3A3]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Completed Topics</span>
                  </div>
                  <span className="text-sm sm:text-base font-black text-[#171717] dark:text-[#F5E6C8] font-mono block">
                    {overallStats.completedCount} <span className="text-xs font-semibold text-[#6B7280]">/ {overallStats.totalTopics}</span>
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B7280] dark:text-[#A3A3A3]">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    <span className="truncate">Study Time</span>
                  </div>
                  <span className="text-sm sm:text-base font-black text-[#D4AF37] font-mono block">
                    {overallStats.totalStudyHours} <span className="text-xs font-semibold text-[#6B7280]">hrs</span>
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    In Progress ({overallStats.inProgressCount})
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Weak / Traps ({overallStats.weakCount})
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#2A2A2A] overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(overallStats.completedCount / (overallStats.totalTopics || 1)) * 100}%` }}
                    title="Mastered"
                  />
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${(overallStats.inProgressCount / (overallStats.totalTopics || 1)) * 100}%` }}
                    title="In Progress"
                  />
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${(overallStats.weakCount / (overallStats.totalTopics || 1)) * 100}%` }}
                    title="Weak"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO CARD 2: Daily Target Velocity */}
        <div className="md:col-span-5 p-5 sm:p-7 rounded-[28px] sm:rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-lg hover:border-[#D4AF37]/70 transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#D4AF37]/15 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/35 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#171717] dark:text-[#F5E6C8]">
                  Daily Study Planner
                </h4>
                <p className="text-[10px] text-[#6B7280] dark:text-[#A3A3A3]">
                  {completedTodayTasks.length} of {totalTasksToday} targets finished
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('planner')}
              className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37] text-[#6B7280] hover:text-[#D4AF37] transition-all cursor-pointer"
              title="Open Planner"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
            <div className="flex justify-between text-xs font-black">
              <span className="text-[#171717] dark:text-[#F5E6C8]">Today's Target Velocity</span>
              <span className="text-[#D4AF37] font-mono">{todayProgressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#2A2A2A] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${todayProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black text-[#6B7280] dark:text-[#A3A3A3] uppercase tracking-wider block">
              Active Focus Queue
            </span>
            {todayPlannerTasks.length > 0 ? (
              todayPlannerTasks.slice(0, 2).map(task => (
                <div
                  key={task.id}
                  onClick={() => onNavigate('planner')}
                  className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37] flex items-center justify-between text-xs cursor-pointer transition-all"
                >
                  <span className="font-bold text-[#171717] dark:text-[#F5E6C8] truncate pr-2">
                    {task.topicName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 shrink-0">
                    {task.estimatedMinutes}m
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#6B7280] py-1 text-center">
                ✨ All targets completed for today!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. SUBJECT MASTERY BREAKDOWN (Direct 1-Click Navigation to Exact Subject) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35 flex items-center justify-center">
              <Layers className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-base font-black text-[#171717] dark:text-[#F5E6C8]">
                Subject Mastery Breakdown
              </h3>
              <p className="text-[10px] text-[#6B7280] dark:text-[#A3A3A3] hidden sm:block">
                Click any subject card to open and explore its chapters directly
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('subjects')}
            className="text-xs font-bold text-[#8C6D15] dark:text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive Grid of Subject Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {subjectStats.map(subj => (
            <div
              key={subj.subjectId}
              onClick={() => {
                soundManager.playClick();
                if (onNavigateToSubject) {
                  onNavigateToSubject(subj.subjectId);
                } else {
                  onNavigate('syllabus');
                }
              }}
              className="p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] hover:border-[#D4AF37] hover:shadow-lg transition-all shadow-md cursor-pointer space-y-2.5 group active:scale-98"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subj.color }} />
                  <h4 className="text-xs sm:text-sm font-black text-[#171717] dark:text-[#F5E6C8] group-hover:text-[#D4AF37] transition-colors truncate">
                    {subj.subjectName}
                  </h4>
                </div>
                <span className="text-xs font-black font-mono text-[#D4AF37] shrink-0">
                  {subj.percentage}%
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#2A2A2A] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${subj.percentage}%`, backgroundColor: subj.color }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#6B7280] font-semibold pt-0.5">
                <span>{subj.completedTopics} / {subj.totalTopics} Topics Mastered</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
