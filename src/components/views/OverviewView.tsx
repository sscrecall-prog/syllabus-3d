import React from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { ExamCountdown3D } from '../3d/ExamCountdown3D';
import {
  RotateCw,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Plus,
  Sparkles,
  Flame,
  Zap,
  TrendingUp,
  Target,
  BookOpen,
  CalendarCheck,
  Award
} from 'lucide-react';
import { AppView } from '../layout/Sidebar';
import { Topic } from '../../types/syllabus';

interface OverviewViewProps {
  onNavigate: (view: AppView) => void;
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
  onOpenRevisionSession: () => void;
  onOpenAddTopic: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onOpenTopicDrawer,
  onOpenRevisionSession,
  onOpenAddTopic,
}) => {
  const {
    profile,
    currentExam,
    overallStats,
    subjectStats,
    dueRevisions,
    weakTopics,
    plannerTasks,
    allTopics
  } = useSyllabus();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (!currentExam) return null;

  const todayTasks = plannerTasks.filter(t => t.status === 'today' || t.status === 'in_progress');
  const completedTodayTasks = plannerTasks.filter(t => t.status === 'completed');
  const plannerVelocity = plannerTasks.length > 0
    ? Math.round((completedTodayTasks.length / plannerTasks.length) * 100)
    : 0;

  // SVG Radial Circle calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallStats.completionPercentage / 100) * circumference;

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* 1. Header Greeting & Quick CTAs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-[#171717] dark:text-[#F5E6C8] tracking-tight flex items-center gap-2">
            <span>{getGreeting()},</span>
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F5E6C8] to-[#B89327] bg-clip-text text-transparent">
              {profile.name}
            </span>
            <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#8C6D15] dark:text-[#D4AF37] text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <RotateCw className="w-4 h-4 animate-spin-slow" />
              <span>Revise Queue ({dueRevisions.length})</span>
            </button>
          )}

          <button
            onClick={onOpenAddTopic}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] text-xs font-black shadow-md shadow-[#D4AF37]/25 hover:shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Custom Topic</span>
          </button>
        </div>
      </div>

      {/* 2. 3D Countdown Flip Clock */}
      <ExamCountdown3D />

      {/* 3. BENTO GRID ARCHITECTURE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
        
        {/* BENTO CARD 1: 3D Radial Mastery Engine (Col 12 on mobile, Col 7 on desktop) */}
        <div className="md:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-xl hover:border-[#D4AF37]/60 transition-all relative overflow-hidden flex flex-col justify-between group">
          {/* Subtle Ambient Radial Backlight */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#D4AF37]/15 transition-all" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#171717] dark:text-[#F5E6C8]">
                  Syllabus Mastery Engine
                </h3>
                <span className="text-[11px] font-semibold text-[#6B7280]">
                  Target Exam: {currentExam.name}
                </span>
              </div>
            </div>

            <span className="px-3 py-1 text-xs font-black rounded-full bg-[#D4AF37]/20 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/40">
              Lvl {profile.level} {profile.levelTitle}
            </span>
          </div>

          {/* Radial Ring + Progress Stats */}
          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            {/* SVG Circular Radial Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="14"
                  className="text-[#FAF8F5] dark:text-[#171717]"
                  fill="transparent"
                />
                {/* Gold Gradient Animated Value Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="url(#goldGradient)"
                  strokeWidth="14"
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

              {/* Inside Gauge Value */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-black text-[#171717] dark:text-white font-mono">
                  {overallStats.completionPercentage}%
                </span>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Mastered
                </span>
              </div>
            </div>

            {/* Quick KPI Pills */}
            <div className="w-full space-y-3">
              <div className="grid grid-cols-2 gap-2.5 text-left">
                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1A1A1A] border border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
                  <span className="text-[10px] font-bold text-[#6B7280] block">Completed Topics</span>
                  <span className="text-base sm:text-lg font-black text-[#171717] dark:text-[#F5E6C8] font-mono">
                    {overallStats.completedCount} <span className="text-xs font-semibold text-[#6B7280]">/ {overallStats.totalTopics}</span>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1A1A1A] border border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
                  <span className="text-[10px] font-bold text-[#6B7280] block">Study Hours Logged</span>
                  <span className="text-base sm:text-lg font-black text-[#D4AF37] font-mono">
                    {overallStats.totalStudyHours} <span className="text-xs font-semibold text-[#6B7280]">hrs</span>
                  </span>
                </div>
              </div>

              {/* Linear mini bar for in-progress vs weak */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-[#6B7280]">
                  <span>In Progress ({overallStats.inProgressCount})</span>
                  <span>Weak / Mistakes ({overallStats.weakCount})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] overflow-hidden flex">
                  <div
                    className="h-full bg-[#3b82f6]"
                    style={{ width: `${(overallStats.inProgressCount / (overallStats.totalTopics || 1)) * 100}%` }}
                  />
                  <div
                    className="h-full bg-rose-500"
                    style={{ width: `${(overallStats.weakCount / (overallStats.totalTopics || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO CARD 2: Daily Study Velocity & Streak Shield (Col 12 on mobile, Col 5 on desktop) */}
        <div className="md:col-span-5 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-xl hover:border-[#D4AF37]/60 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500">
                  <Flame className="w-4 h-4 fill-orange-500" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#171717] dark:text-[#F5E6C8]">
                  Daily Velocity & Streak
                </h3>
              </div>
              <span className="text-xs font-black text-orange-500 font-mono">
                {profile.currentStreak} Days Streak 🔥
              </span>
            </div>

            {/* Daily Planner Targets Progress */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#6B7280]">Today's Target Velocity</span>
                <span className="text-[#D4AF37] font-mono">{completedTodayTasks.length}/{plannerTasks.length} Completed</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#2A2A2A] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${plannerVelocity}%` }}
                />
              </div>
              <p className="text-[11px] text-[#6B7280]">
                {plannerVelocity >= 100 ? '🎉 Amazing! All today targets completed.' : `${todayTasks.length} high-priority tasks in focus queue.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('planner')}
            className="w-full mt-4 py-2.5 px-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2A2A] hover:bg-[#F5E6C8]/40 dark:hover:bg-[#333333] border border-[#EBD3A0] dark:border-[#383838] text-[#171717] dark:text-[#F5E6C8] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
          >
            <span>Open Study Planner Kanban</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#D4AF37]" />
          </button>
        </div>

        {/* BENTO CARD 3: Subject Mastery Grid (Col 12) */}
        <div className="md:col-span-12 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#171717] dark:text-[#F5E6C8]">
                  Subject Mastery Breakdown
                </h3>
                <span className="text-[11px] font-semibold text-[#6B7280]">
                  Real-time syllabus completion across all exam subjects
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('subjects')}
              className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Subjects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4-Column Subject Bento Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectStats.map((sub) => (
              <div
                key={sub.subjectId}
                onClick={() => onNavigate('subjects')}
                className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#1A1A1A] border border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                  <span className="text-xs font-black text-[#D4AF37] font-mono">
                    {sub.percentage}%
                  </span>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#171717] dark:text-[#F5E6C8] truncate group-hover:text-[#D4AF37] transition-colors">
                    {sub.subjectName}
                  </h4>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    {sub.completedTopics} / {sub.totalTopics} Topics Mastered
                  </p>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#2A2A2A] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${sub.percentage}%`, backgroundColor: sub.color || '#D4AF37' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
