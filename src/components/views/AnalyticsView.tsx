import React from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Badge3D } from '../3d/Badge3D';
import { Zap, Trophy, Target, CheckCircle2, Award, Sparkles, Flame, Layers, Clock } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { profile, achievements, overallStats, subjectStats } = useSyllabus();

  const unLockedBadges = achievements.filter(b => b.unlocked);

  const readinessScore = Math.round(
    overallStats.completionPercentage * 0.5 +
    overallStats.averageAccuracy * 0.3 +
    Math.min(100, profile.currentStreak * 4) * 0.2
  );

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* 1. Header */}
      <div>
        <h2 className="text-xl sm:text-3xl font-black text-[#171717] dark:text-[#F5E6C8] tracking-tight flex items-center gap-2.5">
          <Trophy className="w-7 h-7 text-[#D4AF37]" />
          <span>Analytics & Gamification Vault</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A3A3A3] mt-1 font-medium">
          Exam readiness score, 3D achievement medals, XP progression, and subject distribution.
        </p>
      </div>

      {/* 2. Top Level Progress Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-lg relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#B89327] flex items-center justify-center text-[#171717] shadow-md shrink-0">
              <Zap className="w-6 h-6 sm:w-7 sm:h-7 fill-[#171717]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-black rounded-lg bg-[#D4AF37]/20 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/40 font-mono">
                  Level {profile.level}
                </span>
                <h4 className="text-base sm:text-lg font-black text-[#171717] dark:text-[#F5E6C8]">
                  {profile.levelTitle}
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-[#6B7280] dark:text-[#A3A3A3] mt-0.5 font-medium">
                Earn 40 XP for every mastered topic, target completion, and active revision.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs sm:text-sm font-black text-[#D4AF37] font-mono">
              {profile.xp} XP / {profile.level * 300} XP
            </span>
            <p className="text-[10px] text-[#6B7280] font-semibold">
              {300 - (profile.xp % 300)} XP to next level
            </p>
          </div>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#2A2A2A] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F5E6C8] to-[#B89327] transition-all duration-500"
            style={{ width: `${(profile.xp % 300) / 3}%` }}
          />
        </div>
      </div>

      {/* 3. Three KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Readiness */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-md space-y-1">
          <div className="flex items-center gap-2 text-[#D4AF37]">
            <Target className="w-4 h-4 stroke-[2.2]" />
            <span className="text-[10px] font-black uppercase tracking-wider">Exam Readiness Score</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#171717] dark:text-[#F5E6C8] font-mono">
            {readinessScore} <span className="text-xs font-normal text-[#6B7280]">/ 100</span>
          </h3>
          <p className="text-[11px] text-[#6B7280]">Weighted across coverage, accuracy & streak</p>
        </div>

        {/* Accuracy */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-md space-y-1">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            <span className="text-[10px] font-black uppercase tracking-wider">Avg Practice Accuracy</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono">
            {overallStats.averageAccuracy}%
          </h3>
          <p className="text-[11px] text-[#6B7280]">Cumulative question practice accuracy</p>
        </div>

        {/* Medals */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-md space-y-1">
          <div className="flex items-center gap-2 text-purple-500">
            <Award className="w-4 h-4 stroke-[2.2]" />
            <span className="text-[10px] font-black uppercase tracking-wider">Badges Unlocked</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-purple-500 font-mono">
            {unLockedBadges.length} <span className="text-xs font-normal text-[#6B7280]">/ {achievements.length}</span>
          </h3>
          <p className="text-[11px] text-[#6B7280]">3D Metallic Achievement Medals</p>
        </div>
      </div>

      {/* 4. 3D ACHIEVEMENT MEDALS GRID */}
      <div className="space-y-3.5">
        <div>
          <h3 className="text-base sm:text-xl font-black text-[#171717] dark:text-[#F5E6C8] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            <span>3D Metallic Achievement Medals</span>
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#A3A3A3]">
            Unlock medals by mastering syllabus topics, keeping daily streaks, and solving weak questions.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {achievements.map(badge => (
            <Badge3D key={badge.id} badge={badge} />
          ))}
        </div>
      </div>

      {/* 5. SUBJECT PREPARATION DISTRIBUTION */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] shadow-md space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
          <Layers className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="text-sm sm:text-base font-black text-[#171717] dark:text-[#F5E6C8]">
            Subject Preparation Distribution
          </h3>
        </div>

        <div className="space-y-3.5">
          {subjectStats.map(stat => (
            <div key={stat.subjectId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="font-bold text-[#171717] dark:text-[#F5E6C8]">
                    {stat.subjectName}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-[#6B7280]">{stat.completedTopics} / {stat.totalTopics} topics</span>
                  <span className="font-black text-[#D4AF37]">
                    {stat.percentage}%
                  </span>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#2A2A2A] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stat.percentage}%`,
                    backgroundColor: stat.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
