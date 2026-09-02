import React from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
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
  ExternalLink
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

  const todayPlannerTasks = plannerTasks.filter(t => t.status === 'today' || t.status === 'in_progress');
  const completedTodayTasks = plannerTasks.filter(t => t.status === 'completed');
  const totalTasksToday = todayPlannerTasks.length + completedTodayTasks.length;
  const todayProgressPercent = totalTasksToday > 0
    ? Math.round((completedTodayTasks.length / totalTasksToday) * 100)
    : 0;

  // 3D Circular Progress calculations
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallStats.completionPercentage / 100) * circumference;

  const examName = currentExam?.name || 'Target Exam';
  const examYear = currentExam?.targetYear || 2026;

  return (
    <div className="space-y-5 sm:space-y-7 pb-16">
      
      {/* 1. 3D VISUAL HERO ARTWORK BANNER (Full 100% Uncropped 16:9 Frame) */}
      <div className="relative rounded-3xl overflow-hidden border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth bg-[#0B0F19] group">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <img
            src="/dashboard-hero.jpg"
            alt="Focus Plan Achieve - Syllabus 3D Mastery"
            className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-[1.01]"
          />
          {/* Subtle gradient vignette to blend seamlessly */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          
          {/* Bottom Overlay Info Pill */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3.5 sm:left-4 sm:right-4 flex items-center justify-between gap-2 pointer-events-none">
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-white shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] sm:text-[13px] font-mono font-bold tracking-wide">
                Target: {examName} ({examYear})
              </span>
            </div>
            
            <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#FACC15]/20 backdrop-blur-md border border-[#FACC15]/30 text-[#FACC15] text-[11px] sm:text-[13px] font-bold shadow-lg">
              <span>ðŸ† {overallStats.completionPercentage}% Mastered</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Clean 3D Target Countdown Flip Clock */}
      <ExamCountdown3D />

      {/* 3. TOP 3 NON-NEGOTIABLES & NIGHT REFLECTION WIDGET */}
      <Top3TargetsWidget />

      {/* 4. ASYMMETRICAL BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        
        {/* CARD 1: 3D Syllabus Mastery Engine (Col 7) */}
        <div className="md:col-span-7 p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
          
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#EEEEE8] dark:border-[#1D201A]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-[15px] sm:text-base font-black text-[#191A17] dark:text-[#F5F5F7]">
                  Syllabus Mastery Engine
                </h3>
                <span className="text-[11px] text-[#65675F] dark:text-[#85877E]">
                  Target Exam: {examName}
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#EEEEE8] dark:bg-[#23232A] text-[#596B35] dark:text-[#7AA2F7] font-mono border border-transparent dark:border-[#7AA2F7]/20">
              Lvl {profile.level} â€¢ {profile.levelTitle}
            </span>
          </div>

          {/* Radial Ring + Progress Stats */}
          <div className="flex flex-col sm:flex-row items-center gap-5 py-1">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="11"
                  className="text-[#EEEEE8] dark:text-[#23232A]"
                  fill="transparent"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="11"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-[#596B35] dark:text-[#7AA2F7] transition-all duration-1000 ease-out drop-shadow-sm"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-black tabular-nums text-[#11120F] dark:text-[#F5F5F7] font-serif">
                  {overallStats.completionPercentage}%
                </span>
                <span className="text-[11px] font-bold text-[#596B35] dark:text-[#7AA2F7] uppercase tracking-widest mt-0.5 font-mono">
                  Mastered
                </span>
              </div>
            </div>

            {/* Quick KPI Stat Cards */}
            <div className="w-full space-y-2.5 flex-1">
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-3 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#65675F] dark:text-[#85877E]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4F7A45] dark:text-emerald-400 shrink-0" />
                    <span>Completed Topics</span>
                  </div>
                  <span className="text-sm sm:text-base font-black tabular-nums text-[#191A17] dark:text-[#F5F5F7] font-mono block">
                    {overallStats.completedCount} <span className="text-xs text-[#85877E]">/ {overallStats.totalTopics}</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#65675F] dark:text-[#85877E]">
                    <Clock className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7] shrink-0" />
                    <span>Study Time</span>
                  </div>
                  <span className="text-sm sm:text-base font-black tabular-nums text-[#596B35] dark:text-[#7AA2F7] font-mono block">
                    {overallStats.totalStudyHours} <span className="text-xs text-[#85877E]">hrs</span>
                  </span>
                </div>
              </div>

              {/* Multi-Segment Status Progress Bar */}
              <div className="p-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-[#596B35] dark:text-[#7AA2F7] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#596B35] dark:bg-[#7AA2F7]" />
                    In Progress ({overallStats.inProgressCount})
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Weak ({overallStats.weakCount})
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-[#EEEEE8] dark:bg-[#18181D] overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(overallStats.completedCount / (overallStats.totalTopics || 1)) * 100}%` }}
                  />
                  <div
                    className="h-full bg-[#596B35] dark:bg-[#7AA2F7] transition-all duration-500"
                    style={{ width: `${(overallStats.inProgressCount / (overallStats.totalTopics || 1)) * 100}%` }}
                  />
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${(overallStats.weakCount / (overallStats.totalTopics || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Daily Target Velocity (Col 5) */}
        <div className="md:col-span-5 p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-[15px] sm:text-base font-bold text-[#191A17] dark:text-[#F5F5F7]">
                  Daily Study Planner
                </h4>
                <p className="text-[11px] text-[#65675F] dark:text-[#85877E]">
                  {completedTodayTasks.length} of {totalTasksToday} targets finished
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('planner')}
              className="p-2 rounded-lg bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-[#65675F] dark:text-[#A1A1AA] hover:text-[#596B35] dark:hover:text-[#7AA2F7] transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730]">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#191A17] dark:text-[#F5F5F7]">Today's Target Velocity</span>
              <span className="text-[#596B35] dark:text-[#7AA2F7] font-mono tabular-nums">{todayProgressPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#EEEEE8] dark:bg-[#18181D] overflow-hidden">
              <div
                className="h-full bg-[#596B35] dark:bg-[#7AA2F7] rounded-full transition-all duration-500"
                style={{ width: `${todayProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#85877E] uppercase tracking-wider block font-mono">
              Active Focus Queue
            </span>
            {todayPlannerTasks.length > 0 ? (
              todayPlannerTasks.slice(0, 2).map(task => (
                <div
                  key={task.id}
                  onClick={() => onNavigate('planner')}
                  className="p-2.5 rounded-lg bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] flex items-center justify-between text-xs cursor-pointer transition-all"
                >
                  <span className="font-bold text-[#191A17] dark:text-[#F5F5F7] truncate pr-2">
                    {task.topicName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums text-[#596B35] dark:text-[#7AA2F7] bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 shrink-0 font-bold">
                    {task.estimatedMinutes}m
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#85877E] py-1 text-center font-serif">
                âœ¨ All targets completed for today!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. STUDY STATION & PLATFORMS QUICK DOCK */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#5A4FCF]/10 dark:bg-[#7AA2F7]/20 text-[#5A4FCF] dark:text-[#7AA2F7] flex items-center justify-center">
              <Globe className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-[15px] sm:text-base font-bold text-[#191A17] dark:text-[#F5F5F7]">
                Study Station & Connected Platforms
              </h3>
              <p className="text-[11px] text-[#65675F] dark:text-[#85877E]">
                Physics Wallah, Careerwill, Testbook, Oliveboard batches
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('platforms')}
            className="text-xs font-bold text-[#596B35] dark:text-[#7AA2F7] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Study Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {platforms.slice(0, 4).map(plat => (
            <div
              key={plat.id}
              onClick={() => {
                soundManager.playClick();
                window.open(plat.url, '_blank', 'noopener,noreferrer');
              }}
              className="p-3 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] dark:hover:border-[#7AA2F7] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group active:scale-98"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-xs border border-white/20 shrink-0 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: plat.color || '#5A4FCF' }}
                >
                  {plat.icon || 'âš¡'}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] truncate block group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7]">
                    {plat.name}
                  </span>
                  <span className="text-[11px] text-[#85877E] uppercase font-mono font-bold block truncate">
                    {plat.category === 'course' ? 'Course Batch' : 'Mock Series'}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#85877E] group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. SUBJECT MASTERY BREAKDOWN */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] flex items-center justify-center">
              <Layers className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-[15px] sm:text-base font-bold text-[#191A17] dark:text-[#F5F5F7]">
                Subject Mastery Breakdown
              </h3>
            </div>
          </div>

          <button
            onClick={() => onNavigate('subjects')}
            className="text-xs font-bold text-[#596B35] dark:text-[#7AA2F7] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

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
              className="p-4 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] dark:hover:border-[#7AA2F7] hover:-translate-y-1 transition-all duration-200 shadow-subtle-depth hover:shadow-md cursor-pointer space-y-2.5 group active:scale-98"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: subj.color || '#596B35' }}
                  />
                  <h4 className="text-sm sm:text-[15px] font-bold text-[#191A17] dark:text-[#F5F5F7] group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors truncate">
                    {subj.subjectName}
                  </h4>
                </div>
                <span className="text-xs font-bold font-mono tabular-nums text-[#596B35] dark:text-[#7AA2F7] shrink-0">
                  {subj.percentage}%
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-[#EEEEE8] dark:bg-[#23232A] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 shadow-xs"
                  style={{
                    width: `${subj.percentage}%`,
                    backgroundColor: subj.color || '#596B35',
                    boxShadow: `0 0 10px ${subj.color || '#596B35'}55`
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#85877E] font-medium">
                <span>{subj.completedTopics} / {subj.totalTopics} Mastered</span>
                {subj.weakCount > 0 && (
                  <span className="text-rose-500 font-bold">{subj.weakCount} Weak</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

