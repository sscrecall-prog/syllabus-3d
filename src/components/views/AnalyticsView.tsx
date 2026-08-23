import React from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Badge3D } from '../3d/Badge3D';
import { Zap, Trophy, Target, CheckCircle2 } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { profile, achievements, overallStats, subjectStats } = useSyllabus();

  const unLockedBadges = achievements.filter(b => b.unlocked);

  const readinessScore = Math.round(
    overallStats.completionPercentage * 0.5 +
    overallStats.averageAccuracy * 0.3 +
    Math.min(100, profile.currentStreak * 4) * 0.2
  );

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Analytics & Gamification
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Exam readiness, achievement badges, level progress, and subject preparation distribution.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-emerald-500/10 border border-brand-500/30 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Zap className="w-7 h-7 fill-white" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-brand-500 text-white">
                  Level {profile.level}
                </span>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {profile.levelTitle}
                </h4>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Earn 40 XP for every mastered topic and revision session.
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-sm font-bold text-brand-500">
              {profile.xp} XP / {profile.level * 300} XP
            </span>
            <p className="text-[10px] text-slate-500">
              {300 - (profile.xp % 300)} XP to next level
            </p>
          </div>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-500"
            style={{ width: `${(profile.xp % 300) / 3}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 text-brand-500 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">Exam Readiness Score</span>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {readinessScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Weighted across coverage, accuracy & streak</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">Avg Mock Accuracy</span>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {overallStats.averageAccuracy}%
          </h3>
          <p className="text-xs text-slate-500 mt-1">Cumulative question practice accuracy</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 text-purple-500 mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">Badges Unlocked</span>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {unLockedBadges.length} <span className="text-sm font-normal text-slate-500">/ {achievements.length}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">3D Metallic Achievement Medals</p>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            3D Achievement Medals
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hover over badges to explore 3D holographic metal shine
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4.5">
          {achievements.map(badge => (
            <Badge3D key={badge.id} badge={badge} />
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">
          Subject Preparation Distribution
        </h3>

        <div className="space-y-5">
          {subjectStats.map(stat => (
            <div key={stat.subjectId} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {stat.subjectName}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-500">
                  <span>{stat.completedTopics} / {stat.totalTopics} topics</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {stat.percentage}%
                  </span>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
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
