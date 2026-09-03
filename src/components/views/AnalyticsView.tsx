import React from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Badge3D } from '../3d/Badge3D';
import {
  Trophy,
  Target,
  CheckCircle2,
  Award,
  Zap,
  TrendingUp,
  Sparkles,
  Flame,
  Layers,
  Calculator,
  Globe,
  BrainCircuit,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { profile, achievements, overallStats, currentExam } = useSyllabus();

  const unLockedBadges = achievements.filter(b => b.unlocked);
  const readinessScore = Math.round(
    overallStats.completionPercentage * 0.5 +
    overallStats.averageAccuracy * 0.3 +
    Math.min(100, profile.currentStreak * 4) * 0.2
  );

  const xpMax = profile.level * 300;
  const xpCurrent = profile.xp % 300;
  const xpPercent = Math.min(100, Math.round((xpCurrent / 300) * 100));

  // Subject Icon Helper
  const getSubjectIconAndColor = (name: string, fallbackColor?: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('quant') || lower.includes('math')) {
      return { icon: Calculator, color: fallbackColor || '#EF4444' };
    }
    if (lower.includes('gk') || lower.includes('general awareness') || lower.includes('knowledge') || lower.includes('gs') || lower.includes('pyq')) {
      return { icon: Globe, color: fallbackColor || '#0EA5E9' };
    }
    if (lower.includes('reasoning') || lower.includes('intelligence')) {
      return { icon: BrainCircuit, color: fallbackColor || '#A855F7' };
    }
    if (lower.includes('english') || lower.includes('editorial') || lower.includes('comprehension')) {
      return { icon: BookOpen, color: fallbackColor || '#10B981' };
    }
    return { icon: Layers, color: fallbackColor || '#7AA2F7' };
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-24 sm:pb-20 max-w-5xl mx-auto select-none font-sans animate-fade-in">
      
      {/* 1. EXECUTIVE HERO HEADER */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-gradient-to-br from-[#451a03] via-[#78350f] to-[#1c0b02] border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] animate-pulse" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#596B35] dark:text-[#7AA2F7]">
                <span>Preparation Telemetry</span>
                <span>•</span>
                <span>Active Retention Index</span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight uppercase truncate">
                Analytics & Exam Readiness
              </h2>
              <p className="text-xs text-[#65675F] dark:text-[#94A3B8] font-medium hidden sm:block">
                Measurable preparation telemetry, active retention curve & 3D achievement badges
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-xs font-mono font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{profile.levelTitle}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE LEVEL & XP BENTO BANNER */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-3.5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-black flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0 border border-white/20">
              <Zap className="w-5 h-5 fill-current stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-tight">
                Level {profile.level} • {profile.levelTitle}
              </h3>
              <p className="text-xs text-[#65675F] dark:text-[#94A3B8] font-medium">
                Earn XP through active topic mastery, flashcard sprints and spaced revision
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 tabular-nums px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
              {profile.xp} / {xpMax} XP
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="w-full h-3 rounded-full bg-[#EEEEE8] dark:bg-[#13141C] overflow-hidden p-0.5 border border-[#D8D8CF]/50 dark:border-[#252736]/50">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
              style={{
                width: `${xpPercent}%`,
                boxShadow: '0 0 10px rgba(245,158,11,0.4)'
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono font-bold text-[#85877E] dark:text-[#787C99]">
            <span>Level {profile.level}</span>
            <span className="tabular-nums">{300 - xpCurrent} XP to Level {profile.level + 1}</span>
          </div>
        </div>
      </div>

      {/* 3. THREE EXECUTIVE TELEMETRY BENTO CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Readiness Score Card */}
        <div className="group relative p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-cyan-500/50 shadow-subtle-depth space-y-3 transition-all duration-200 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60 group-hover:opacity-100" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center border border-cyan-500/25">
                <Target className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider font-mono">Readiness Score</span>
            </div>
            
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black border ${
              readinessScore >= 75
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                : readinessScore >= 50
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/25'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
            }`}>
              {readinessScore >= 75 ? 'Exam Ready' : readinessScore >= 50 ? 'On Track' : 'Building'}
            </span>
          </div>

          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-[#11120F] dark:text-[#F5F5F7] font-mono tabular-nums leading-none">
              {readinessScore} <span className="text-xs font-sans text-[#85877E] font-bold">/ 100</span>
            </h3>
            <p className="text-[11px] text-[#65675F] dark:text-[#94A3B8] font-medium pt-1">
              Composite score from syllabus coverage, accuracy & consistency streak
            </p>
          </div>
        </div>

        {/* Practice Accuracy Card */}
        <div className="group relative p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-emerald-500/50 shadow-subtle-depth space-y-3 transition-all duration-200 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60 group-hover:opacity-100" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/25">
                <CheckCircle2 className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider font-mono">Practice Accuracy</span>
            </div>

            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              Recall Quality
            </span>
          </div>

          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums leading-none">
              {overallStats.averageAccuracy}%
            </h3>
            <p className="text-[11px] text-[#65675F] dark:text-[#94A3B8] font-medium pt-1">
              Active recall assessment score across all practiced quiz modules
            </p>
          </div>
        </div>

        {/* Badges Unlocked Card */}
        <div className="group relative p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-purple-500/50 shadow-subtle-depth space-y-3 transition-all duration-200 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60 group-hover:opacity-100" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center border border-purple-500/25">
                <Award className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider font-mono">Badges Unlocked</span>
            </div>

            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-black bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
              {Math.round((unLockedBadges.length / (achievements.length || 1)) * 100)}% Complete
            </span>
          </div>

          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-[#11120F] dark:text-[#F5F5F7] font-mono tabular-nums leading-none">
              {unLockedBadges.length} <span className="text-xs font-sans text-[#85877E] font-bold">/ {achievements.length}</span>
            </h3>
            <p className="text-[11px] text-[#65675F] dark:text-[#94A3B8] font-medium pt-1">
              Gamified milestone medals unlocked across all syllabus modules
            </p>
          </div>
        </div>

      </div>

      {/* 4. SUBJECT PREPAREDNESS BREAKDOWN */}
      {currentExam && currentExam.subjects.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#65675F] dark:text-[#A1A1AA] uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Subject Preparedness Distribution</span>
            </div>
            <span className="text-[11px] font-mono text-[#85877E]">
              {currentExam.subjects.length} Subjects Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {currentExam.subjects.map(s => {
              const { icon: SubjIcon, color } = getSubjectIconAndColor(s.name, s.color);
              const totalTopics = s.chapters.reduce((acc, c) => acc + c.topics.length, 0);
              const completedTopics = s.chapters.reduce((acc, c) => acc + c.topics.filter(t => t.status === 'completed').length, 0);
              const percent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

              return (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl bg-[#FAF9F5] dark:bg-[#14151F] border border-[#D8D8CF] dark:border-[#242533] space-y-2"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <SubjIcon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                      <span className="text-xs font-bold text-[#11120F] dark:text-white truncate">
                        {s.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-black text-cyan-500 tabular-nums">
                      {percent}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#EEEEE8] dark:bg-[#20212E] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. ACHIEVEMENT MEDALS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/25">
              <Award className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-tight">
                Achievement Medals & Milestones
              </h3>
              <p className="text-[11px] text-[#65675F] dark:text-[#94A3B8] font-medium hidden sm:block">
                3D metallic badges representing deep mastery across study streaks, active problem solving and spaced repetition
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl bg-[#FAF9F5] dark:bg-[#1E1F2A] border border-[#D8D8CF] dark:border-[#2C2E3E] text-xs font-mono font-black text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
            {unLockedBadges.length} of {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {achievements.map(badge => (
            <Badge3D key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
    </div>
  );
};

