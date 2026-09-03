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

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const userName = user?.name || user?.email?.split('@')[0] || profile.name || 'Scholar';

  return (
    <div className="pb-20">
      
      {/* ═══ ABOVE THE FOLD — Fills entire viewport ═══ */}
      <div className="min-h-[calc(100dvh-5rem)] flex flex-col justify-between gap-3 sm:gap-4">
      
        {/* 1. PERSONALIZED GREETING HEADER */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight leading-tight">
              {greeting}, <span className="text-[#596B35] dark:text-[#7AA2F7]">{userName}</span> 👋
            </h1>
            <p className="text-xs sm:text-[13px] text-[#65675F] dark:text-[#85877E] mt-0.5 font-medium">
              {overallStats.completionPercentage > 0 
                ? `You've mastered ${overallStats.completionPercentage}% of your syllabus. Keep pushing!`
                : 'Start your preparation journey today!'}
            </p>
          </div>

          {/* Quick Stats Cluster */}
          <div className="flex items-center gap-1.5 shrink-0">
            {profile.currentStreak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 tabular-nums font-mono">{profile.currentStreak}d</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#596B35]/10 dark:bg-[#7AA2F7]/10 border border-[#596B35]/20 dark:border-[#7AA2F7]/20 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7]" />
              <span className="text-[11px] font-black text-[#596B35] dark:text-[#7AA2F7] font-mono">Lvl {profile.level}</span>
            </div>
          </div>
        </div>

        {/* 2. HERO ARTWORK BANNER — Fills remaining space */}
        <div className="relative rounded-2xl overflow-hidden border border-[#D8D8CF] dark:border-[#272730] shadow-sm bg-[#0B0F19] flex-1 min-h-0">
          <div className="relative w-full h-full min-h-[200px] overflow-hidden">
            <img
              src="/dashboard-hero.jpg"
              alt="Focus Plan Achieve - Syllabus 3D Mastery"
              className="w-full h-full object-cover object-center absolute inset-0"
              loading="eager"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
            
            {/* Bottom Pills */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex items-center justify-between gap-2 pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] sm:text-xs font-bold font-mono tracking-wide">
                  {examName} ({examYear})
                </span>
              </div>
              
              <div className="px-2.5 py-1.5 rounded-xl bg-[#FACC15]/15 backdrop-blur-sm border border-[#FACC15]/25 text-[#FACC15] text-[11px] sm:text-xs font-bold">
                🏆 {overallStats.completionPercentage}% Mastered
              </div>
            </div>
          </div>
        </div>

        {/* 3. EXAM COUNTDOWN */}
        <ExamCountdown3D />
      
      </div>

      {/* ═══ BELOW THE FOLD — Visible on scroll ═══ */}
      <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">

      {/* 4. TOP 3 NON-NEGOTIABLES */}
      <Top3TargetsWidget />

      {/* 5. MASTERY ENGINE + DAILY PLANNER — Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        
        {/* CARD 1: Syllabus Mastery Engine */}
        <div className="md:col-span-7 p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-sm flex flex-col justify-between relative overflow-hidden">
          
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#EEEEE8] dark:border-[#242533]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#596B35]/10 dark:bg-[#7AA2F7]/15 text-[#596B35] dark:text-[#7AA2F7] flex items-center justify-center shrink-0">
                <Target className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-[15px] font-black text-[#191A17] dark:text-[#F5F5F7]">
                  Syllabus Mastery
                </h3>
                <span className="text-[11px] text-[#65675F] dark:text-[#85877E]">
                  {examName}
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-[#EEEEE8] dark:bg-[#23232A] text-[#596B35] dark:text-[#7AA2F7] font-mono border border-transparent dark:border-[#7AA2F7]/15 shrink-0">
              {profile.levelTitle}
            </span>
          </div>

          {/* Radial Ring + Progress Stats */}
          <div className="flex flex-col sm:flex-row items-center gap-4 py-1">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70" cy="70" r={radius}
                  stroke="currentColor" strokeWidth="10"
                  className="text-[#EEEEE8] dark:text-[#23232A]"
                  fill="transparent"
                />
                <circle
                  cx="70" cy="70" r={radius}
                  stroke="currentColor" strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-[#596B35] dark:text-[#7AA2F7] transition-all duration-1000 ease-out"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-black tabular-nums text-[#11120F] dark:text-[#F5F5F7]">
                  {overallStats.completionPercentage}%
                </span>
                <span className="text-[10px] font-bold text-[#596B35] dark:text-[#7AA2F7] uppercase tracking-widest font-mono">
                  Mastered
                </span>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="w-full space-y-2 flex-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1E2030] border border-[#E5E5DC] dark:border-[#272730] space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#65675F] dark:text-[#85877E] uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    Completed
                  </div>
                  <span className="text-sm font-black tabular-nums text-[#191A17] dark:text-[#F5F5F7] font-mono block">
                    {overallStats.completedCount}<span className="text-[11px] text-[#85877E] font-medium">/{overallStats.totalTopics}</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1E2030] border border-[#E5E5DC] dark:border-[#272730] space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#65675F] dark:text-[#85877E] uppercase tracking-wider">
                    <Clock className="w-3 h-3 text-[#596B35] dark:text-[#7AA2F7] shrink-0" />
                    Study Time
                  </div>
                  <span className="text-sm font-black tabular-nums text-[#596B35] dark:text-[#7AA2F7] font-mono block">
                    {overallStats.totalStudyHours}<span className="text-[11px] text-[#85877E] font-medium"> hrs</span>
                  </span>
                </div>
              </div>

              {/* Status Bar */}
              <div className="p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1E2030] border border-[#E5E5DC] dark:border-[#272730] space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-[#596B35] dark:text-[#7AA2F7] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#596B35] dark:bg-[#7AA2F7]" />
                    In Progress ({overallStats.inProgressCount})
                  </span>
                  <span className="text-rose-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Weak ({overallStats.weakCount})
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-[#EEEEE8] dark:bg-[#18181D] overflow-hidden flex">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(overallStats.completedCount / (overallStats.totalTopics || 1)) * 100}%` }} />
                  <div className="h-full bg-[#596B35] dark:bg-[#7AA2F7] transition-all duration-500" style={{ width: `${(overallStats.inProgressCount / (overallStats.totalTopics || 1)) * 100}%` }} />
                  <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${(overallStats.weakCount / (overallStats.totalTopics || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Daily Study Planner */}
        <div className="md:col-span-5 p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#596B35]/10 dark:bg-[#7AA2F7]/15 text-[#596B35] dark:text-[#7AA2F7] flex items-center justify-center shrink-0">
                <CalendarCheck className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-sm sm:text-[15px] font-black text-[#191A17] dark:text-[#F5F5F7]">
                  Daily Planner
                </h4>
                <p className="text-[11px] text-[#65675F] dark:text-[#85877E]">
                  {completedTodayTasks.length}/{totalTasksToday} targets done
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('planner')}
              className="p-1.5 rounded-lg bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-[#65675F] dark:text-[#A1A1AA] hover:text-[#596B35] dark:hover:text-[#7AA2F7] transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Velocity Bar */}
          <div className="space-y-1 p-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1E2030] border border-[#E5E5DC] dark:border-[#272730]">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-[#191A17] dark:text-[#F5F5F7]">Today's Velocity</span>
              <span className="text-[#596B35] dark:text-[#7AA2F7] font-mono tabular-nums">{todayProgressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#EEEEE8] dark:bg-[#18181D] overflow-hidden">
              <div className="h-full bg-[#596B35] dark:bg-[#7AA2F7] rounded-full transition-all duration-500" style={{ width: `${todayProgressPercent}%` }} />
            </div>
          </div>

          {/* Focus Queue */}
          <div className="space-y-1.5 flex-1">
            <span className="text-[10px] font-bold text-[#85877E] uppercase tracking-widest block font-mono">
              Active Focus Queue
            </span>
            {todayPlannerTasks.length > 0 ? (
              todayPlannerTasks.slice(0, 3).map(task => (
                <div
                  key={task.id}
                  onClick={() => onNavigate('planner')}
                  className="p-2 rounded-lg bg-[#F7F6F0] dark:bg-[#1E2030] border border-[#E5E5DC] dark:border-[#272730] hover:border-[#596B35] dark:hover:border-[#7AA2F7] flex items-center justify-between text-xs cursor-pointer transition-all"
                >
                  <span className="font-bold text-[#191A17] dark:text-[#F5F5F7] truncate pr-2">
                    {task.topicName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums text-[#596B35] dark:text-[#7AA2F7] bg-[#596B35]/10 dark:bg-[#7AA2F7]/15 shrink-0 font-bold">
                    {task.estimatedMinutes}m
                  </span>
                </div>
              ))
            ) : (
              <div className="py-3 text-center">
                <p className="text-xs text-[#85877E]">✨ All targets done!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. STUDY STATION & PLATFORMS */}
      {platforms.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-[#7AA2F7]/15 text-indigo-500 dark:text-[#7AA2F7] flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-[15px] font-black text-[#191A17] dark:text-[#F5F5F7]">
                  Study Station
                </h3>
                <p className="text-[10px] sm:text-[11px] text-[#65675F] dark:text-[#85877E]">
                  Connected learning platforms
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('platforms')}
              className="text-[11px] font-bold text-[#596B35] dark:text-[#7AA2F7] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {platforms.slice(0, 4).map(plat => (
              <div
                key={plat.id}
                onClick={() => {
                  soundManager.playClick();
                  window.open(plat.url, '_blank', 'noopener,noreferrer');
                }}
                className="p-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1E2030] border border-[#E5E5DC] dark:border-[#272730] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all cursor-pointer flex items-center gap-2 group active:scale-[0.98]"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-xs border border-white/20 shrink-0"
                  style={{ backgroundColor: plat.color || '#5A4FCF' }}
                >
                  {plat.icon || '⚡'}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-[#191A17] dark:text-[#F5F5F7] truncate block group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7]">
                    {plat.name}
                  </span>
                  <span className="text-[10px] text-[#85877E] font-mono block truncate">
                    {plat.category === 'course' ? 'Course' : 'Mock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SUBJECT MASTERY BREAKDOWN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#596B35]/10 dark:bg-[#7AA2F7]/15 text-[#596B35] dark:text-[#7AA2F7] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 stroke-[2]" />
            </div>
            <h3 className="text-sm sm:text-[15px] font-black text-[#191A17] dark:text-[#F5F5F7]">
              Subject Mastery
            </h3>
          </div>

          <button
            onClick={() => onNavigate('subjects')}
            className="text-[11px] font-bold text-[#596B35] dark:text-[#7AA2F7] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
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
              className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer space-y-2 group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: subj.color || '#596B35' }}
                  />
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#191A17] dark:text-[#F5F5F7] group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors truncate">
                    {subj.subjectName}
                  </h4>
                </div>
                <span className="text-[11px] font-black font-mono tabular-nums text-[#596B35] dark:text-[#7AA2F7] shrink-0">
                  {subj.percentage}%
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-[#EEEEE8] dark:bg-[#23232A] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${subj.percentage}%`,
                    backgroundColor: subj.color || '#596B35',
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#85877E] font-medium">
                <span>{subj.completedTopics}/{subj.totalTopics}</span>
                {subj.weakCount > 0 && (
                  <span className="text-rose-500 font-bold">{subj.weakCount} weak</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
