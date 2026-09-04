import React from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import {
  Target,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  ArrowUpRight,
  Globe,
  Sparkles,
  ExternalLink,
  Flame,
  TrendingUp
} from 'lucide-react';
import { AppView } from '../layout/Sidebar';
import { Topic } from '../../types/syllabus';
import { ExamCountdown3D } from '../3d/ExamCountdown3D';
import { Top3TargetsWidget } from '../dashboard/Top3TargetsWidget';
import { AppFooter } from '../common/AppFooter';
import { soundManager } from '../../utils/soundEffects';

interface OverviewViewProps {
  onNavigate: (view: AppView) => void;
  onNavigateToSubject?: (subjectId: string) => void;
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
  onOpenRevisionSession: () => void;
  onOpenAddTopic?: () => void;
  onOpenFocus?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onNavigateToSubject,
  onOpenFocus,
}) => {
  const {
    overallStats,
    subjectStats,
    profile,
    currentExam,
    plannerTasks,
    platforms
  } = useSyllabus();
  const { user } = useAuth();

  const todayPlannerTasks = plannerTasks.filter(t => t.status === 'today' || t.status === 'in_progress');
  const completedTodayTasks = plannerTasks.filter(t => t.status === 'completed');
  const totalTasksToday = todayPlannerTasks.length + completedTodayTasks.length;
  const todayProgressPercent = totalTasksToday > 0
    ? Math.round((completedTodayTasks.length / totalTasksToday) * 100)
    : 0;

  // Circular Progress calculations
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallStats.completionPercentage / 100) * circumference;

  const examName = currentExam?.name || 'Target Exam';
  const examYear = currentExam?.targetYear || 2026;

  // Executive Greeting & Time Status
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetingPhase = hour < 12 ? 'Morning Focus' : hour < 17 ? 'Afternoon Momentum' : 'Evening Mastery';
  const greetingIcon = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';
  const formattedDate = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const userName = user?.name || user?.email?.split('@')[0] || profile.name || 'Scholar';

  return (
    <div className="space-y-4 sm:space-y-5 pb-20">
      
      {/* 1. EXECUTIVE VIP GREETING & COMMAND HERO CARD */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-white via-slate-50/90 to-white dark:from-[#181926]/90 dark:via-[#141522]/85 dark:to-[#0F1019]/95 backdrop-blur-xl border border-slate-200/90 dark:border-[#272738]/80 shadow-elevated-card">
        
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-12 -right-12 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-gradient-to-br from-[#2563EB]/10 to-[#3B82F6]/10 dark:from-[#7AA2F7]/20 dark:to-[#8B5CF6]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 sm:w-44 h-36 sm:h-44 rounded-full bg-amber-500/10 dark:bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3.5 sm:space-y-4">
          {/* Top Row: Phase Pill + Live Date + Quick Metrics */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-[#7AA2F7]/15 border border-blue-500/20 dark:border-[#7AA2F7]/30 text-[#2563EB] dark:text-[#7AA2F7] text-[11px] font-black tracking-wide uppercase">
                <span>{greetingIcon}</span>
                <span>{greetingPhase}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#71717A] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {formattedDate}
              </span>
            </div>

            {/* Elite Stats Badges */}
            <div className="flex items-center gap-1.5">
              {profile.currentStreak > 0 && (
                <div 
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-mono font-black tabular-nums shadow-xs"
                  title={`${profile.currentStreak} Day Consistency Streak`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span>{profile.currentStreak}d Streak</span>
                </div>
              )}
              <div 
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 dark:bg-[#7AA2F7]/15 border border-blue-500/20 dark:border-[#7AA2F7]/30 text-[#2563EB] dark:text-[#7AA2F7] text-[11px] font-mono font-black tabular-nums shadow-xs"
                title={`Level ${profile.level} - ${profile.xp} Total XP`}
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>Lvl {profile.level}</span>
              </div>
              <div 
                className="hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/25 text-purple-700 dark:text-purple-300 text-[11px] font-bold shadow-xs"
                title={`${overallStats.completionPercentage}% Syllabus Mastered`}
              >
                <span>🏆 {overallStats.completionPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Middle Row: Personalized Aspirant Name & Executive Mission Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F5F5F7] tracking-tight leading-tight flex items-center gap-2 flex-wrap">
                <span>{greeting},</span>
                <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-[#2563EB] dark:from-white dark:via-[#93C5FD] dark:to-[#818CF8] bg-clip-text text-transparent">
                  {userName}
                </span>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/30 text-xs shadow-xs" title="Verified Aspirant">
                  ✨
                </span>
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-[#9496A1] mt-1 font-medium leading-relaxed">
                {overallStats.completionPercentage > 0
                  ? `You have conquered ${overallStats.completionPercentage}% of ${examName}. Keep your streak alive and push for top ranks!`
                  : `Your mission control for ${examName} is active. Master concepts, track revisions, and win your dream post!`}
              </p>
            </div>

            {/* Quick Action Trigger Buttons */}
            <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
              {onOpenFocus && (
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onOpenFocus();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] dark:from-[#7AA2F7] dark:to-[#5B8BF5] text-white dark:text-[#0A0B10] text-xs sm:text-[13px] font-extrabold shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Launch Focus Chamber"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Focus Mode</span>
                </button>
              )}
              <button
                onClick={() => {
                  soundManager.playClick();
                  onNavigate('planner');
                }}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#20212F] border border-slate-200 dark:border-[#2E2F40] text-slate-800 dark:text-[#E2E8F0] text-xs sm:text-[13px] font-bold shadow-xs hover:border-[#2563EB] dark:hover:border-[#7AA2F7] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                title="View Today's Daily Planner"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7] shrink-0" />
                <span>Today ({completedTodayTasks.length}/{totalTasksToday})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 3D VISUAL HERO ARTWORK BANNER (New Ultra-Sleek Artwork, No Black Bars) */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#D8D8CF] dark:border-[#272730] shadow-sm bg-[#0B0F19] group">
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[340px] overflow-hidden">
          <img
            src="/dashboard-hero.jpg"
            alt="Focus Plan Achieve - Syllabus 3D Mastery"
            className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-[1.01]"
            loading="eager"
          />
          {/* Subtle gradient vignette to blend seamlessly */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          {/* Bottom Overlay Info Pills */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3.5 sm:left-4 sm:right-4 flex items-center justify-between gap-2 pointer-events-none">
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-white shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] sm:text-[13px] font-mono font-bold tracking-wide">
                Target: {examName} ({examYear})
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#FACC15]/20 backdrop-blur-md border border-[#FACC15]/30 text-[#FACC15] text-[11px] sm:text-[13px] font-bold shadow-lg">
              <span>🏆 {overallStats.completionPercentage}% Mastered</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Clean Target Countdown Flip Clock */}
      <ExamCountdown3D />

      {/* 4. TOP 3 NON-NEGOTIABLES & NIGHT REFLECTION WIDGET */}
      <Top3TargetsWidget />

      {/* 5. MASTERY ENGINE + DAILY PLANNER — Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        
        {/* CARD 1: Syllabus Mastery Engine */}
        <div className="md:col-span-7 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#151620] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth flex flex-col justify-between relative overflow-hidden space-y-4 select-none">
          
          {/* Subtle Ambient Accent */}
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-[#596B35]/[0.04] dark:bg-[#7AA2F7]/[0.05] rounded-full blur-2xl pointer-events-none" />

          {/* Header Row */}
          <div className="relative z-10 flex items-center justify-between gap-3 pb-3 border-b border-[#EEEEE8] dark:border-[#242533]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#596B35] to-[#7FA04B] dark:from-[#7AA2F7] dark:to-[#4D76D6] text-white flex items-center justify-center font-bold shadow-md shadow-[#596B35]/20 dark:shadow-[#7AA2F7]/25 shrink-0">
                <Target className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <h3 className="text-[15px] sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight">
                  Syllabus Mastery
                </h3>
                <span className="text-xs text-[#65675F] dark:text-[#A1A1AA] font-medium">
                  {examName} {examYear}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F7F6F0] dark:bg-[#1E1F2A] border border-[#D8D8CF] dark:border-[#2E3044] shadow-2xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] animate-pulse" />
              <span className="text-xs font-black text-[#11120F] dark:text-white font-mono">
                {profile.levelTitle || `Level ${profile.level}`}
              </span>
            </div>
          </div>

          {/* Radial Progress + Bento Metrics Grid */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
            {/* Circular Progress Gauge */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70" cy="70" r={radius}
                  stroke="currentColor" strokeWidth="11"
                  className="text-[#EFEFEA] dark:text-[#222332]"
                  fill="transparent"
                />
                <circle
                  cx="70" cy="70" r={radius}
                  stroke="currentColor" strokeWidth="11"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-[#596B35] dark:text-[#7AA2F7] transition-all duration-1000 ease-out"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-[#11120F] dark:text-[#F5F5F7] font-mono">
                  {overallStats.completionPercentage}%
                </span>
                <span className="text-[10px] font-bold text-[#596B35] dark:text-[#7AA2F7] uppercase tracking-widest font-mono mt-0.5">
                  Mastered
                </span>
              </div>
            </div>

            {/* KPI Cards & Multi-Status Distribution */}
            <div className="w-full space-y-2.5 flex-1">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Completed Topics */}
                <div className="p-3 rounded-2xl bg-[#FAF9F5]/80 dark:bg-[#1B1C28] border border-[#D8D8CF] dark:border-[#2A2C3E] shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#65675F] dark:text-[#A1A1B2]">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Completed
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-black tabular-nums text-[#11120F] dark:text-white font-mono">
                      {overallStats.completedCount}
                    </span>
                    <span className="text-xs text-[#85877E] dark:text-[#787C99] font-medium font-mono">
                      / {overallStats.totalTopics} Topics
                    </span>
                  </div>
                </div>

                {/* Study Time */}
                <div className="p-3 rounded-2xl bg-[#FAF9F5]/80 dark:bg-[#1B1C28] border border-[#D8D8CF] dark:border-[#2A2C3E] shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#65675F] dark:text-[#A1A1B2]">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <Clock className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7] shrink-0" />
                      Study Time
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-black tabular-nums text-[#596B35] dark:text-[#7AA2F7] font-mono">
                      {overallStats.totalStudyHours}
                    </span>
                    <span className="text-xs text-[#85877E] dark:text-[#787C99] font-medium font-mono">
                      Hours
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Segment Meter */}
              <div className="p-3 rounded-2xl bg-[#FAF9F5]/80 dark:bg-[#1B1C28] border border-[#D8D8CF] dark:border-[#2A2C3E] space-y-2">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span className="text-[#596B35] dark:text-[#7AA2F7] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#596B35] dark:bg-[#7AA2F7]" />
                    In Progress ({overallStats.inProgressCount})
                  </span>
                  <span className="text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Weak ({overallStats.weakCount})
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-[#E8E8DF] dark:bg-[#14151E] overflow-hidden flex p-0.5">
                  <div
                    className="h-full bg-emerald-500 rounded-l-full transition-all duration-500 shadow-2xs"
                    style={{ width: `${(overallStats.completedCount / (overallStats.totalTopics || 1)) * 100}%` }}
                    title="Completed"
                  />
                  <div
                    className="h-full bg-[#596B35] dark:bg-[#7AA2F7] transition-all duration-500"
                    style={{ width: `${(overallStats.inProgressCount / (overallStats.totalTopics || 1)) * 100}%` }}
                    title="In Progress"
                  />
                  <div
                    className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
                    style={{ width: `${(overallStats.weakCount / (overallStats.totalTopics || 1)) * 100}%` }}
                    title="Needs Revision"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Daily Study Planner */}
        <div className="md:col-span-5 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#151620] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth flex flex-col justify-between space-y-3 relative overflow-hidden select-none">
          
          {/* Subtle Ambient Accent */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/[0.04] rounded-full blur-2xl pointer-events-none" />

          {/* Header Row */}
          <div className="relative z-10 flex items-center justify-between gap-2 pb-3 border-b border-[#EEEEE8] dark:border-[#242533]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                <CalendarCheck className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <h4 className="text-[15px] sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight">
                  Daily Planner
                </h4>
                <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] font-medium">
                  {completedTodayTasks.length}/{totalTasksToday} targets completed
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                onNavigate('planner');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1E1F2A] border border-[#D8D8CF] dark:border-[#2E3044] text-[#65675F] dark:text-[#CBD5E1] hover:text-[#596B35] dark:hover:text-[#7AA2F7] hover:border-[#596B35] dark:hover:border-[#7AA2F7] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Open Full Study Planner"
            >
              <span>Planner</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Velocity Progress Bar */}
          <div className="relative z-10 p-3 rounded-2xl bg-[#FAF9F5]/80 dark:bg-[#1B1C28] border border-[#D8D8CF] dark:border-[#2A2C3E] space-y-1.5 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#11120F] dark:text-[#F5F5F7] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Today's Velocity</span>
              </span>
              <span className="text-[#596B35] dark:text-[#7AA2F7] font-mono font-black tabular-nums">
                {todayProgressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E8E8DF] dark:bg-[#14151E] overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-[#596B35] dark:to-[#7AA2F7] rounded-full transition-all duration-500"
                style={{ width: `${todayProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Focus Queue List */}
          <div className="relative z-10 space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#85877E] uppercase tracking-widest block font-mono">
                Active Focus Queue
              </span>
              {todayPlannerTasks.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-[#85877E]">
                  {todayPlannerTasks.length} queued
                </span>
              )}
            </div>

            {todayPlannerTasks.length > 0 ? (
              <div className="space-y-1.5">
                {todayPlannerTasks.slice(0, 3).map((task, idx) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      soundManager.playClick();
                      onNavigate('planner');
                    }}
                    className="p-2.5 px-3 rounded-xl bg-[#FAF9F5]/90 dark:bg-[#1B1C28] border border-[#D8D8CF] dark:border-[#2A2C3E] hover:border-[#596B35] dark:hover:border-[#7AA2F7] flex items-center justify-between text-xs cursor-pointer transition-all duration-150 group shadow-2xs hover:shadow-xs active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-lg bg-[#EFEFEA] dark:bg-[#252738] text-[10px] font-mono font-black text-[#65675F] dark:text-[#CBD5E1] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#11120F] dark:text-[#F5F5F7] truncate group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors">
                        {task.topicName}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono tabular-nums text-[#596B35] dark:text-[#7AA2F7] bg-[#596B35]/10 dark:bg-[#7AA2F7]/15 border border-[#596B35]/20 dark:border-[#7AA2F7]/25 shrink-0 font-bold ml-2">
                      ⏱️ {task.estimatedMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center rounded-2xl bg-[#FAF9F5]/60 dark:bg-[#1B1C28]/60 border border-dashed border-[#D8D8CF] dark:border-[#2A2C3E]">
                <p className="text-xs font-bold text-[#596B35] dark:text-[#7AA2F7]">✨ All targets done!</p>
                <p className="text-[11px] text-[#85877E] mt-0.5">Take a break or plan tomorrow's tasks.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. STUDY STATION & PLATFORMS */}
      {platforms.length > 0 && (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#151620] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-4 relative overflow-hidden select-none">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06] rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between gap-3 pb-3 border-b border-[#EEEEE8] dark:border-[#242533]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
                <Globe className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <h3 className="text-[15px] sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight">
                  Study Station & Portals
                </h3>
                <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] font-medium">
                  1-Click launch into your study resources, test portals & notes
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                onNavigate('platforms');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1E1F2A] border border-[#D8D8CF] dark:border-[#2E3044] text-[#65675F] dark:text-[#CBD5E1] hover:text-[#596B35] dark:hover:text-[#7AA2F7] hover:border-[#596B35] dark:hover:border-[#7AA2F7] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Platform Launcher Grid */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {platforms.slice(0, 4).map(plat => (
              <div
                key={plat.id}
                onClick={() => {
                  soundManager.playClick();
                  window.open(plat.url, '_blank', 'noopener,noreferrer');
                }}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF9F5]/90 dark:bg-[#1B1C28] border border-[#D8D8CF] dark:border-[#2A2C3E] hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all duration-200 cursor-pointer flex items-center gap-3 group shadow-2xs hover:shadow-md active:scale-[0.97]"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base shadow-sm border border-white/20 shrink-0 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: plat.color || '#5A4FCF' }}
                >
                  {plat.icon || '⚡'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-[13px] font-black text-[#11120F] dark:text-[#F5F5F7] truncate block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {plat.name}
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#85877E] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase tracking-wider text-[#65675F] dark:text-[#94A3B8] bg-black/5 dark:bg-white/5">
                    {plat.category === 'course' ? 'Course' : 'Mock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SUBJECT MASTERY BREAKDOWN */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#151620] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-4 select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EEEEE8] dark:border-[#242533]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#596B35] to-[#7FA04B] dark:from-[#7AA2F7] dark:to-[#4D76D6] text-white flex items-center justify-center font-bold shadow-md shadow-[#596B35]/20 dark:shadow-[#7AA2F7]/25 shrink-0">
              <Layers className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight">
                  Subject Mastery Curriculum
                </h3>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#596B35]/15 dark:bg-[#7AA2F7]/15 text-[#596B35] dark:text-[#7AA2F7] border border-[#596B35]/20 dark:border-[#7AA2F7]/25">
                  {subjectStats.length} Subjects
                </span>
              </div>
              <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] font-medium mt-0.5">
                Target coverage, topic counts & diagnostic weak spots by subject
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onNavigate('subjects');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1E1F2A] border border-[#D8D8CF] dark:border-[#2E3044] text-[#65675F] dark:text-[#CBD5E1] hover:text-[#596B35] dark:hover:text-[#7AA2F7] hover:border-[#596B35] dark:hover:border-[#7AA2F7] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subject Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          {subjectStats.map(subj => {
            const isMastered = subj.percentage === 100;
            return (
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
                className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF9F5]/90 dark:bg-[#1B1C28] border border-[#D8D8CF] dark:border-[#2A2C3E] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer space-y-3 group active:scale-[0.98] relative overflow-hidden"
              >
                {/* Subject Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-2 ring-white/50 dark:ring-black/50"
                      style={{ backgroundColor: subj.color || '#596B35' }}
                    />
                    <h4 className="text-[13px] sm:text-sm font-black text-[#11120F] dark:text-[#F5F5F7] group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors truncate">
                      {subj.subjectName}
                    </h4>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono tabular-nums shrink-0 ${
                      isMastered
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                        : subj.percentage > 0
                        ? 'bg-[#596B35]/15 dark:bg-[#7AA2F7]/15 text-[#596B35] dark:text-[#7AA2F7] border border-[#596B35]/20 dark:border-[#7AA2F7]/25'
                        : 'bg-black/5 dark:bg-white/5 text-[#85877E]'
                    }`}
                  >
                    {subj.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-[#E8E8DF] dark:bg-[#14151E] overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-2xs"
                    style={{
                      width: `${subj.percentage}%`,
                      backgroundColor: subj.color || '#596B35',
                    }}
                  />
                </div>

                {/* Topics & Weak Status Row */}
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="font-mono text-[#65675F] dark:text-[#A1A1B2]">
                    <strong className="text-[#11120F] dark:text-white font-black">{subj.completedTopics}</strong>
                    <span className="text-[#85877E] text-[11px]">/{subj.totalTopics} Topics</span>
                  </span>

                  {subj.weakCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                      ⚠️ {subj.weakCount} Weak
                    </span>
                  ) : isMastered ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      ✓ Mastered
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#85877E] font-medium">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. PROFESSIONAL & ADVANCED HOMEPAGE FOOTER */}
      <AppFooter onNavigate={onNavigate} />
    </div>
  );
};
